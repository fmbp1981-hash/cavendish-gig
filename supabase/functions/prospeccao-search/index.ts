import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Busca externa de leads via Google Places (Text Search -> Details, em lotes de 5 — mesmo
// padrão do módulo Finder de referência, yolo_sdr/src/lib/google-places/client.ts). Sem
// Firecrawl: o enriquecimento do lead é um resumo curto gerado por IA (via ai-generate, já
// existente no projeto) a partir de nome+endereço, não scraping do site — o próprio
// prospect-pulse-54 (origem deste módulo) desativou o Firecrawl em produção por ser o maior
// gargalo (10s+ por lead). Ver CAVENDISH_PROSPECCAO_BLUEPRINT.md §6.

interface SearchRequest {
  termo: string;
  cidade: string;
  estado?: string;
  bairro?: string;
  categoria: string;
  quantidade?: number;
  responsavelId?: string; // admin pode atribuir a busca a outro representante
  gerarResumoIA?: boolean;
}

interface RawPlace {
  place_id: string;
  name: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  formatted_address?: string;
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  types?: string[];
}

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const MAX_QUANTIDADE = 20; // Text Search retorna no máx. 20 por página; paginação fica para uma v2

const TYPE_LABELS: Record<string, string> = {
  lawyer: "Advogado", accounting: "Contabilidade", real_estate_agency: "Imobiliária",
  insurance_agency: "Seguradora", general_contractor: "Empreiteiro", bank: "Banco",
  finance: "Financeira", store: "Loja", food: "Alimentação", health: "Saúde",
};

function translateType(types: string[] | undefined): string | null {
  if (!types) return null;
  for (const t of types) if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  return types[0] ? types[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function extractAddressPart(place: RawPlace, useShortName: boolean, ...types: string[]): string | null {
  const comp = place.address_components?.find((c) => types.some((t) => c.types.includes(t)));
  if (!comp) return null;
  return useShortName ? comp.short_name : comp.long_name;
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<RawPlace | null> {
  try {
    const url = new URL(`${PLACES_BASE}/details/json`);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set(
      "fields",
      "place_id,name,formatted_phone_number,international_phone_number,website,formatted_address,address_components,types",
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "pt-BR");
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK") return null;
    return data.result as RawPlace;
  } catch {
    return null;
  }
}

async function gerarResumoIA(authHeader: string, nome: string, endereco: string | null): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader, apikey: anonKey },
      body: JSON.stringify({
        tipo: "chat",
        input_data: {
          messages: [{
            role: "user",
            content: `Empresa: ${nome}. Endereço: ${endereco ?? "não informado"}.\nEm até 2 frases, resuma um possível gatilho de abordagem comercial para oferecer consultoria de governança e compliance a esta empresa. Sem emojis, sem hashtags.`,
          }],
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.trim?.() || data?.data?.content?.trim?.() || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createServiceClient();

    // Só admin/representante podem buscar — a function roda com service role (bypassa RLS),
    // então a checagem de papel precisa ser feita aqui.
    const { data: roles } = await service.from("user_roles").select("role").eq("user_id", user.id);
    const roleNames = (roles ?? []).map((r: any) => r.role);
    const isAdmin = roleNames.includes("admin");
    const isRepresentante = roleNames.includes("representante");
    if (!isAdmin && !isRepresentante) {
      return new Response(JSON.stringify({ error: "Acesso restrito a representantes e administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as SearchRequest;
    const { termo, cidade, estado, bairro, categoria, gerarResumoIA: querResumo } = body;
    const responsavelId = isAdmin && body.responsavelId ? body.responsavelId : user.id;
    const quantidade = Math.min(body.quantidade || 20, MAX_QUANTIDADE);

    if (!termo?.trim() || !cidade?.trim() || !categoria?.trim()) {
      return new Response(JSON.stringify({ error: "Informe termo, cidade e categoria" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const integration = await loadIntegration(service, "google-places", "system");
    if (!integration?.enabled) {
      return new Response(JSON.stringify({ error: "Google Places não configurado (Admin → Integrações)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = integration.secrets?.GOOGLE_PLACES_API_KEY as string | undefined;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key do Google Places ausente na integração" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const localizacao = [bairro, cidade, estado].filter(Boolean).join(", ");

    // 1. Text Search
    const searchUrl = new URL(`${PLACES_BASE}/textsearch/json`);
    searchUrl.searchParams.set("query", `${termo} em ${localizacao}`);
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("language", "pt-BR");
    searchUrl.searchParams.set("region", "br");

    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json();
    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      return new Response(
        JSON.stringify({ error: `Erro na API do Google Places: ${searchData.status}`, details: searchData.error_message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const places: Array<{ place_id: string }> = (searchData.results || []).slice(0, quantidade);

    // 2. Details em lotes de 5 (equilíbrio entre velocidade e rate limit — mesmo valor do
    // módulo Finder de referência)
    const detailed: RawPlace[] = [];
    const BATCH = 5;
    for (let i = 0; i < places.length; i += BATCH) {
      const batch = places.slice(i, i + BATCH);
      const results = await Promise.all(batch.map((p) => fetchPlaceDetails(p.place_id, apiKey)));
      for (const r of results) if (r) detailed.push(r);
    }

    // 3. Registro do histórico de busca
    const { data: busca, error: erroBusca } = await service
      .from("prospeccao_buscas")
      .insert({ responsavel_id: responsavelId, termo, localizacao, categoria, total_resultados: detailed.length })
      .select()
      .single();
    if (erroBusca) throw erroBusca;

    // 4. Dedup contra leads já existentes deste responsável (place_id ou telefone)
    const placeIds = detailed.map((p) => p.place_id).filter(Boolean);
    const { data: existentesPorPlace } = await service
      .from("prospeccao_leads")
      .select("google_place_id")
      .eq("responsavel_id", responsavelId)
      .in("google_place_id", placeIds.length ? placeIds : ["__none__"]);
    const placeIdsExistentes = new Set((existentesPorPlace ?? []).map((r: any) => r.google_place_id));

    const telefones = detailed
      .map((p) => normalizePhone(p.international_phone_number || p.formatted_phone_number))
      .filter((t): t is string => !!t);
    const { data: existentesPorTelefone } = await service
      .from("prospeccao_leads")
      .select("telefone")
      .eq("responsavel_id", responsavelId)
      .in("telefone", telefones.length ? telefones : ["__none__"]);
    const telefonesExistentes = new Set((existentesPorTelefone ?? []).map((r: any) => r.telefone));

    // 5. Funil padrão da categoria (mesma lógica do useCreateProspeccaoLead, aplicada uma vez
    // para todo o lote)
    const { data: funil } = await service
      .from("prospeccao_funis")
      .select("id")
      .eq("categoria", categoria)
      .eq("padrao", true)
      .maybeSingle();
    let primeiraEtapaId: string | null = null;
    if (funil) {
      const { data: etapa } = await service
        .from("prospeccao_funil_etapas")
        .select("id")
        .eq("funil_id", funil.id)
        .order("posicao", { ascending: true })
        .limit(1)
        .maybeSingle();
      primeiraEtapaId = etapa?.id ?? null;
    }

    // 6. Monta candidatos, deduplicando também dentro do próprio lote de resultados
    const vistosPlaceIds = new Set<string>();
    const vistosTelefones = new Set<string>();
    const candidatos: Array<Record<string, unknown>> = [];

    for (const place of detailed) {
      if (placeIdsExistentes.has(place.place_id) || vistosPlaceIds.has(place.place_id)) continue;
      const telefone = normalizePhone(place.international_phone_number || place.formatted_phone_number);
      if (telefone && (telefonesExistentes.has(telefone) || vistosTelefones.has(telefone))) continue;

      vistosPlaceIds.add(place.place_id);
      if (telefone) vistosTelefones.add(telefone);

      candidatos.push({
        responsavel_id: responsavelId,
        nome: place.name,
        telefone,
        website: place.website || null,
        endereco: place.formatted_address || null,
        cidade: extractAddressPart(place, false, "locality") || cidade,
        estado: extractAddressPart(place, true, "administrative_area_level_1") || estado || null,
        setor: translateType(place.types),
        categoria,
        origem: "google_places",
        google_place_id: place.place_id,
        busca_id: busca.id,
        funil_id: funil?.id ?? null,
        funil_etapa_id: primeiraEtapaId,
      });
    }

    // 7. Resumo IA em paralelo (opcional — se ai-generate/IA não estiver configurado, cada
    // chamada falha silenciosamente e o lead entra sem ai_resumo)
    if (querResumo && candidatos.length > 0) {
      const resumos = await Promise.all(
        candidatos.map((c) => gerarResumoIA(authHeader, c.nome as string, c.endereco as string | null)),
      );
      candidatos.forEach((c, i) => { c.ai_resumo = resumos[i]; });
    }

    // 8. Insert individual (não em lote) — mesma razão do useImportarArquivo: os índices únicos
    // de (responsavel_id, telefone)/(responsavel_id, google_place_id) são parciais, e um insert
    // em lote falha inteiro se uma linha violar a constraint.
    let totalImportados = 0;
    for (const lead of candidatos) {
      const { error } = await service.from("prospeccao_leads").insert(lead);
      if (!error) totalImportados++;
    }

    await service
      .from("prospeccao_buscas")
      .update({ total_importados: totalImportados })
      .eq("id", busca.id);

    return new Response(
      JSON.stringify({
        success: true,
        totalResultados: detailed.length,
        totalImportados,
        totalDuplicados: detailed.length - candidatos.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    await logEdgeFunctionError("prospeccao-search", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
