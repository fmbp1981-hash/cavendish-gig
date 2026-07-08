import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { getWhatsAppConfig, sendWhatsAppMessage } from "../_shared/whatsapp-provider.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Disparo em massa de campanhas do Finder. A mensagem do template fica em
// `prospeccao_campanhas.metadata.mensagem` — não há coluna dedicada pra isso (schema da Fase 1
// já tinha um campo `metadata` flexível exatamente pra esse tipo de extensão, evita mais uma
// migration). Throttle simples (200ms entre envios) pra não estourar rate limit do provedor.

interface DispatchRequest {
  campanhaId: string;
}

const THROTTLE_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const { data: roles } = await service.from("user_roles").select("role").eq("user_id", user.id);
    const roleNames = (roles ?? []).map((r: any) => r.role);
    const isAdmin = roleNames.includes("admin");
    if (!isAdmin && !roleNames.includes("representante")) {
      return new Response(JSON.stringify({ error: "Acesso restrito a representantes e administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campanhaId } = await req.json() as DispatchRequest;
    const { data: campanha, error: erroCampanha } = await service
      .from("prospeccao_campanhas")
      .select("*")
      .eq("id", campanhaId)
      .single();
    if (erroCampanha || !campanha) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isAdmin && campanha.responsavel_id !== user.id) {
      return new Response(JSON.stringify({ error: "Você só pode disparar suas próprias campanhas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mensagem = campanha.metadata?.mensagem as string | undefined;
    if (!mensagem?.trim()) {
      return new Response(JSON.stringify({ error: "Campanha sem mensagem definida (metadata.mensagem)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whatsappConfig = await getWhatsAppConfig(service);
    if (!whatsappConfig) {
      return new Response(JSON.stringify({ error: "WhatsApp não configurado (Admin → Integrações)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await service.from("prospeccao_campanhas").update({ status: "executando" }).eq("id", campanhaId);

    const { data: alvos, error: erroAlvos } = await service
      .from("prospeccao_campanha_leads")
      .select("id, lead_id, status")
      .eq("campanha_id", campanhaId)
      .eq("status", "pendente");
    if (erroAlvos) throw erroAlvos;

    let enviados = 0;

    for (const alvo of alvos ?? []) {
      const { data: lead } = await service.from("prospeccao_leads").select("id, nome, telefone").eq("id", alvo.lead_id).maybeSingle();

      if (!lead?.telefone) {
        await service.from("prospeccao_campanha_leads").update({ status: "falhou" }).eq("id", alvo.id);
        continue;
      }

      const mensagemPersonalizada = mensagem.replace(/\{nome\}/g, lead.nome);
      const resultado = await sendWhatsAppMessage(whatsappConfig, lead.telefone, mensagemPersonalizada);

      if (resultado.success) {
        await service
          .from("prospeccao_campanha_leads")
          .update({ status: "enviado", enviado_em: new Date().toISOString() })
          .eq("id", alvo.id);
        await service.from("prospeccao_conversas").insert({
          lead_id: lead.id,
          role: "assistant",
          conteudo: mensagemPersonalizada,
          tipo: "texto",
        });
        await service.from("prospeccao_leads").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", lead.id);
        enviados++;
      } else {
        await service.from("prospeccao_campanha_leads").update({ status: "falhou" }).eq("id", alvo.id);
      }

      await sleep(THROTTLE_MS);
    }

    await service
      .from("prospeccao_campanhas")
      .update({ status: "concluida", total_enviados: enviados })
      .eq("id", campanhaId);

    return new Response(JSON.stringify({ success: true, totalAlvos: (alvos ?? []).length, enviados }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await logEdgeFunctionError("prospeccao-campaign-dispatch", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
