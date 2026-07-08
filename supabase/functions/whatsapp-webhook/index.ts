import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getWhatsAppConfig } from "../_shared/whatsapp-provider.ts";
import { normalizePhone } from "../_shared/phone.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Webhook inbound de mensagens WhatsApp — recebe de QUALQUER um dos dois provedores configurados
// (Evolution API ou WhatsApp Cloud API oficial da Meta), normaliza pro mesmo formato interno,
// resolve o lead por telefone e grava a conversa. `verify_jwt = false` (ver config.toml): quem
// chama aqui é o provedor externo, não um usuário logado do GIG — a autenticidade é validada por
// mecanismo específico de cada provider (ver validarOrigemMeta/validarOrigemEvolution).
//
// Disparo do agente de IA (prospeccao-agent) fica marcado como TODO explícito abaixo — implementado
// junto com a issue do orquestrador, para não misturar duas responsabilidades grandes no mesmo
// commit.

interface MensagemNormalizada {
  telefone: string;
  texto: string;
  provider: "evolution-api" | "whatsapp-official";
  externalId?: string | null;
}

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validarOrigemMeta(rawBody: string, signatureHeader: string | null, appSecret: string): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const esperado = signatureHeader.slice("sha256=".length);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return hexEncode(assinatura) === esperado;
}

function extrairMensagensMeta(payload: any): MensagemNormalizada[] {
  const mensagens: MensagemNormalizada[] = [];
  const entries = payload?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      for (const msg of change?.value?.messages ?? []) {
        if (msg.type !== "text" || !msg.text?.body) continue;
        const telefone = normalizePhone(msg.from);
        if (!telefone) continue;
        mensagens.push({ telefone, texto: msg.text.body, provider: "whatsapp-official", externalId: msg.id ?? null });
      }
    }
  }
  return mensagens;
}

function extrairMensagensEvolution(payload: any): MensagemNormalizada[] {
  // Formato típico de webhook Baileys/Evolution API (MESSAGES_UPSERT) — validar contra o payload
  // real assim que houver uma instância configurada para testar; a forma exata pode variar por
  // versão da Evolution API.
  const data = payload?.data;
  if (!data || data.key?.fromMe) return [];
  const texto = data.message?.conversation || data.message?.extendedTextMessage?.text;
  const remoteJid = data.key?.remoteJid as string | undefined;
  if (!texto || !remoteJid) return [];
  const telefone = normalizePhone(remoteJid.split("@")[0]);
  if (!telefone) return [];
  return [{ telefone, texto, provider: "evolution-api", externalId: data.key?.id ?? null }];
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const service = createServiceClient();

  // Handshake de verificação do WhatsApp Cloud API (Meta chama GET na primeira configuração do
  // webhook, esperando o valor de hub.challenge de volta).
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const config = await getWhatsAppConfig(service);
    if (mode === "subscribe" && config?.provider === "whatsapp-official" && token === config.verifyToken) {
      return new Response(challenge ?? "", { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const config = await getWhatsAppConfig(service);
    if (!config) {
      // WhatsApp ainda não configurado — não há como validar origem nem processar. 200 pra não
      // ficar re-entregando um webhook que nunca vai funcionar.
      return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let mensagens: MensagemNormalizada[] = [];

    if (payload?.object === "whatsapp_business_account") {
      if (config.provider !== "whatsapp-official" || !config.appSecret) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
      const valido = await validarOrigemMeta(rawBody, req.headers.get("x-hub-signature-256"), config.appSecret);
      if (!valido) return new Response("Forbidden", { status: 403, headers: corsHeaders });
      mensagens = extrairMensagensMeta(payload);
    } else {
      if (config.provider !== "evolution-api" || !config.webhookSecret) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
      if (req.headers.get("x-webhook-secret") !== config.webhookSecret) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
      mensagens = extrairMensagensEvolution(payload);
    }

    for (const msg of mensagens) {
      const { data: lead } = await service
        .from("prospeccao_leads")
        .select("id, modo_humano")
        .eq("telefone", msg.telefone)
        .maybeSingle();

      if (!lead) continue; // Número não corresponde a nenhum lead nosso — ignora.

      await service.from("prospeccao_conversas").insert({
        lead_id: lead.id,
        role: "user",
        conteudo: msg.texto,
        tipo: "texto",
      });
      await service.from("prospeccao_leads").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", lead.id);

      // TODO(Fase 4b — orquestrador do agente): se !lead.modo_humano, invocar prospeccao-agent
      // aqui para gerar e enviar a resposta automática. Implementado junto com
      // supabase/functions/prospeccao-agent/index.ts.
    }

    return new Response(JSON.stringify({ success: true, processadas: mensagens.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await logEdgeFunctionError("whatsapp-webhook", error);
    // 200 mesmo em erro — evita retry agressivo de um payload que provavelmente vai falhar de
    // novo; o erro já fica registrado via logEdgeFunctionError para investigação.
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
