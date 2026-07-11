import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getWhatsAppConfig, sendWhatsAppMessage } from "../_shared/whatsapp-provider.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Processa prospeccao_fila_followup — chamado por pg_cron a cada 30 min (ver migration
// finder_followup_cron.sql). Autenticado por x-cron-secret comparado direto contra
// system_settings.cron_secret (mesmo valor que a função SQL wrapper lê para montar o header) —
// sem depender de uma env var separada, evitando risco de os dois valores ficarem dessincronizados.

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const service = createServiceClient();

  try {
    const { data: cronSecret } = await service.from("system_settings").select("value").eq("key", "cron_secret").maybeSingle();
    const providedSecret = req.headers.get("x-cron-secret") ?? "";
    if (!cronSecret?.value || providedSecret !== cronSecret.value) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pendentes, error: erroPendentes } = await service
      .from("prospeccao_fila_followup")
      .select("id, lead_id, enviar_em, mensagem, created_at")
      .eq("status", "pendente")
      .lte("enviar_em", new Date().toISOString())
      .limit(100);
    if (erroPendentes) throw erroPendentes;

    if (!pendentes || pendentes.length === 0) {
      return new Response(JSON.stringify({ processados: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whatsappConfig = await getWhatsAppConfig(service);

    let enviados = 0;
    let ignorados = 0;
    let falharam = 0;

    for (const item of pendentes) {
      const { data: lead } = await service
        .from("prospeccao_leads")
        .select("id, telefone, modo_humano, ultimo_contato_em, status")
        .eq("id", item.lead_id)
        .maybeSingle();

      if (!lead || lead.status === "convertido" || lead.status === "perdido") {
        await service.from("prospeccao_fila_followup").update({ status: "ignorado" }).eq("id", item.id);
        ignorados++;
        continue;
      }

      // Lead já foi contatado de novo depois que este follow-up foi agendado — não faz sentido
      // mandar uma mensagem "esqueceram de você" pra quem já está em conversa.
      const contatoRecente = lead.ultimo_contato_em && new Date(lead.ultimo_contato_em) > new Date(item.created_at);
      if (lead.modo_humano || contatoRecente) {
        await service.from("prospeccao_fila_followup").update({ status: "ignorado" }).eq("id", item.id);
        ignorados++;
        continue;
      }

      if (!lead.telefone || !whatsappConfig) {
        await service
          .from("prospeccao_fila_followup")
          .update({ status: "falhou", erro: !lead.telefone ? "Lead sem telefone" : "WhatsApp não configurado" })
          .eq("id", item.id);
        falharam++;
        continue;
      }

      const mensagem = item.mensagem || "Oi! Passando aqui pra saber se você teve a chance de ver nossa mensagem anterior.";
      const resultado = await sendWhatsAppMessage(whatsappConfig, lead.telefone, mensagem);

      if (resultado.success) {
        await service
          .from("prospeccao_fila_followup")
          .update({ status: "enviado", enviado_em: new Date().toISOString() })
          .eq("id", item.id);
        await service.from("prospeccao_conversas").insert({ lead_id: lead.id, role: "assistant", conteudo: mensagem, tipo: "texto" });
        await service.from("prospeccao_leads").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", lead.id);
        enviados++;
      } else {
        await service.from("prospeccao_fila_followup").update({ status: "falhou", erro: resultado.error }).eq("id", item.id);
        falharam++;
      }
    }

    return new Response(JSON.stringify({ processados: pendentes.length, enviados, ignorados, falharam }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await logEdgeFunctionError("prospeccao-followup-cron", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
