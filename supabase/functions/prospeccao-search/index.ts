import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";
import { getAIConfig } from "../_shared/ai-provider.ts";
import { normalizePhone } from "../_shared/phone.ts";

// Busca externa de leads via Google Places (Text Search -> Details, em lotes de 5 — mesmo
// padrão do módulo Finder de referência, yolo_sdr/src/lib/google-places/client.ts).
//
// Sem Firecrawl: o prospect-pulse-54 (origem deste módulo) desativou o Firecrawl em produção
// por ser o maior gargalo (10s+ por lead, síncrono). Em vez de um serviço de scraping
// separado, o enriquecimento usa a tool nativa `url_context` do Gemini (GA em 2026) — o
// próprio modelo busca e lê o site na mesma chamada de geração, sem vendor novo, cobrado só
// como tokens de input extras. Só funciona quando o provider de IA ativo é Gemini (decisão de
// produto do usuário: manter no free tier do Google AI Studio por enquanto — ver conversa);
// para outros providers, cai no fallback de resumo só com nome+endereço (mesmo comportamento
// do módulo Finder original, yolo_sdr). Ver CAVENDISH_PROSPECCAO_BLUEPRINT.md §6.

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
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

interface EnriquecimentoIA {
  resumo: string | null;
  email: string | null;
  cnpj: string | null;
  linkedin: string | null;
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
      "place_id,name,formatted_phone_number,international_phone_number,website,formatted_address,address_components,types,rating,user_ratings_total,business_status",
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

/** Fallback sem site (ou sem provider Gemini): resumo especulativo só com nome+endereço, via
 * ai-generate (mesmo comportamento do módulo Finder original, yolo_sdr). */
async function gerarResumoBasico(authHeader: string, nome: string, endereco: string | null): Promise<string | null> {
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
    return typeof data?.output === "string" ? data.output.trim() : null;
  } catch {
    return null;
  }
}

/** Enriquecimento com o site real via `url_context` do Gemini — pede resumo do gatilho de
 * compliance E extração de email/CNPJ/LinkedIn se estiverem visíveis na página (comuns no
 * rodapé de sites de PME brasileiras). Resposta esperada em JSON estrito; se o modelo não
 * seguir o formato, cai para o resumo básico sem quebrar a busca. */
async function enriquecerComGemini(
  apiKey: string,
  model: string,
  baseUrl: string,
  nome: string,
  website: string,
): Promise<EnriquecimentoIA | null> {
  try {
    const prompt = `Empresa: ${nome}. Site: ${website}
Leia o conteúdo do site acima e responda SOMENTE com um JSON válido, sem markdown, no formato:
{"resumo": "até 2 frases sobre um possível gatilho de compliance/governança para abordar esta empresa (licitação pública, M&A, ISO, crédito/investimento, grupo com filiais, sem programa de compliance formal) baseado no que o site realmente mostra", "email": "email de contato encontrado no site, ou null", "cnpj": "CNPJ encontrado no site (só números), ou null", "linkedin": "URL do LinkedIn da empresa encontrada no site, ou null"}
Se não conseguir acessar o site, responda com "resumo" baseado só no nome da empresa e os demais campos null.`;

    const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ url_context: {} }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      resumo: typeof parsed.resumo === "string" ? parsed.resumo.trim() : null,
      email: typeof parsed.email === "string" ? parsed.email.trim() : null,
      cnpj: typeof parsed.cnpj === "string" ? parsed.cnpj.replace(/\D/g, "") || null : null,
      linkedin: typeof parsed.linkedin === "string" ? parsed.linkedin.trim() : null,
    };
  } catch {
    return null;
  }
}

/** Ponto único de enriquecimento: tenta url_context do Gemini quando há site e o provider
 * ativo é Gemini; cai para o resumo básico em qualquer outro caso. */
async function enriquecerLead(
  authHeader: string,
  service: any,
  nome: string,
  endereco: string | null,
  website: string | null,
): Promise<EnriquecimentoIA> {
  if (website) {
    try {
      const aiConfig = await getAIConfig(service);
      if (aiConfig.provider === "gemini" && aiConfig.apiKey) {
        const resultado = await enriquecerComGemini(aiConfig.apiKey, aiConfig.model, aiConfig.baseUrl, nome, website);
        if (resultado) return resultado;
      }
    } catch {
      // Provider de IA não configurado — segue para o fallback básico
    }
  }
  const resumo = await gerarResumoBasico(authHeader, nome, endereco);
  return { resumo, email: null, cnpj: null, linkedin: null };
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
        // Places não tem coluna dedicada para link do mapa/rating — vai no catch-all metadata
        metadata: {
          google_maps_link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
          rating: place.rating ?? null,
          user_ratings_total: place.user_ratings_total ?? null,
          business_status: place.business_status ?? null,
        },
      });
    }

    // 7. Enriquecimento em paralelo (opcional). Com site + provider Gemini ativo, lê o
    // conteúdo real via url_context (resumo fundamentado + tenta extrair email/CNPJ/LinkedIn
    // do rodapé do site); sem isso, cai no resumo especulativo só com nome+endereço. Falha
    // silenciosa em qualquer caso — o lead sempre entra, só sem esses campos.
    if (querResumo && candidatos.length > 0) {
      const enriquecimentos = await Promise.all(
        candidatos.map((c) =>
          enriquecerLead(authHeader, service, c.nome as string, c.endereco as string | null, c.website as string | null),
        ),
      );
      candidatos.forEach((c, i) => {
        const e = enriquecimentos[i];
        c.ai_resumo = e.resumo;
        if (e.email && !c.email) c.email = e.email;
        if (e.cnpj && !c.cnpj) c.cnpj = e.cnpj;
        if (e.linkedin && !c.linkedin) c.linkedin = e.linkedin;
      });
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
