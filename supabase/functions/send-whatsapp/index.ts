import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { getWhatsAppConfig, sendWhatsAppMessage } from "../_shared/whatsapp-provider.ts";
import { normalizePhone } from "../_shared/phone.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Envio de WhatsApp para o módulo Finder — despacha para o provedor configurado no vault
// (Evolution API ou WhatsApp Cloud API oficial da Meta, ver _shared/whatsapp-provider.ts).
// Nenhum dos dois está configurado ainda (sem credenciais) — a estrutura já está pronta,
// `getWhatsAppConfig()` retorna null até que Admin → Integrações seja preenchido.

interface SendRequest {
  telefone: string;
  mensagem: string;
  leadId?: string;
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
    if (!roleNames.includes("admin") && !roleNames.includes("representante")) {
      return new Response(JSON.stringify({ error: "Acesso restrito a representantes e administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { telefone, mensagem, leadId } = await req.json() as SendRequest;
    if (!telefone?.trim() || !mensagem?.trim()) {
      return new Response(JSON.stringify({ error: "telefone e mensagem são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = await getWhatsAppConfig(service);
    if (!config) {
      return new Response(
        JSON.stringify({ error: "WhatsApp não configurado (Admin → Integrações → Evolution API ou WhatsApp Oficial)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const numero = normalizePhone(telefone) ?? telefone;
    const resultado = await sendWhatsAppMessage(config, numero, mensagem);
    if (!resultado.success) {
      return new Response(JSON.stringify({ error: resultado.error || "Falha ao enviar WhatsApp" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (leadId) {
      await service.from("prospeccao_conversas").insert({
        lead_id: leadId,
        role: "assistant",
        conteudo: mensagem,
        tipo: "texto",
      });
      await service.from("prospeccao_leads").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", leadId);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: resultado.messageId, provider: config.provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await logEdgeFunctionError("send-whatsapp", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
