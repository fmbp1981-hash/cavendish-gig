import { loadIntegration } from "./integrations.ts";

// Suporte a dois provedores de WhatsApp, selecionáveis via vault (mesmo padrão do seletor de
// provider de IA em AdminIntegracoes.tsx — um único registro `whatsapp-provider` no scope
// "system", com `config.provider` decidindo qual dos dois está ativo):
//
//  - "evolution-api": instância self-hosted/terceirizada da Evolution API (mais barato, mais
//    flexível, mas não é a API oficial do WhatsApp — risco de ban se usado fora das regras).
//  - "whatsapp-official": WhatsApp Cloud API oficial da Meta (mais burocrático de configurar —
//    exige app no Meta for Developers + número verificado — mas é o caminho suportado
//    oficialmente pela Meta).
//
// Nenhum dos dois está configurado ainda (sem credenciais) — esta é só a estrutura/arquitetura,
// pronta para receber as credenciais em Admin → Integrações quando disponíveis.

export interface WhatsAppConfig {
  provider: "evolution-api" | "whatsapp-official";
  // evolution-api
  baseUrl?: string;
  instanceName?: string;
  apiKey?: string;
  /** Segredo compartilhado esperado no header `x-webhook-secret` das chamadas inbound —
   * configurado manualmente também no painel da Evolution API. Distinto da apiKey (que é só
   * outbound) por boa prática de separar segredo de envio do segredo de recebimento. */
  webhookSecret?: string;
  // whatsapp-official (Meta Cloud API)
  phoneNumberId?: string;
  accessToken?: string;
  /** Usado para verificar a assinatura HMAC (`X-Hub-Signature-256`) das chamadas inbound da Meta. */
  appSecret?: string;
  /** Usado só no handshake de verificação do webhook (GET com `hub.verify_token`). */
  verifyToken?: string;
}

export async function getWhatsAppConfig(supabaseService: any): Promise<WhatsAppConfig | null> {
  const integration = await loadIntegration(supabaseService, "whatsapp-provider", "system");
  if (!integration?.enabled) return null;

  const provider = integration.config?.provider as string | undefined;

  if (provider === "evolution-api") {
    return {
      provider: "evolution-api",
      baseUrl: integration.config?.baseUrl as string | undefined,
      instanceName: integration.config?.instanceName as string | undefined,
      apiKey: integration.secrets?.EVOLUTION_API_KEY as string | undefined,
      webhookSecret: integration.secrets?.EVOLUTION_WEBHOOK_SECRET as string | undefined,
    };
  }

  if (provider === "whatsapp-official") {
    return {
      provider: "whatsapp-official",
      phoneNumberId: integration.config?.phoneNumberId as string | undefined,
      accessToken: integration.secrets?.WHATSAPP_ACCESS_TOKEN as string | undefined,
      appSecret: integration.secrets?.WHATSAPP_APP_SECRET as string | undefined,
      verifyToken: integration.secrets?.WHATSAPP_VERIFY_TOKEN as string | undefined,
    };
  }

  return null;
}

export interface EnvioResultado {
  success: boolean;
  messageId?: string | null;
  error?: string;
}

export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  telefone: string,
  mensagem: string,
): Promise<EnvioResultado> {
  if (config.provider === "evolution-api") {
    if (!config.baseUrl || !config.instanceName || !config.apiKey) {
      return { success: false, error: "Configuração da Evolution API incompleta" };
    }
    try {
      const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/message/sendText/${config.instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: config.apiKey },
        body: JSON.stringify({ number: telefone, text: mensagem }),
      });
      if (!res.ok) return { success: false, error: `Evolution API respondeu ${res.status}` };
      const data = await res.json();
      return { success: true, messageId: data?.key?.id ?? null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erro ao chamar Evolution API" };
    }
  }

  if (config.provider === "whatsapp-official") {
    if (!config.phoneNumberId || !config.accessToken) {
      return { success: false, error: "Configuração do WhatsApp Cloud API incompleta" };
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefone,
          type: "text",
          text: { body: mensagem },
        }),
      });
      if (!res.ok) {
        const detalhe = await res.text();
        return { success: false, error: `WhatsApp Cloud API respondeu ${res.status}: ${detalhe}` };
      }
      const data = await res.json();
      return { success: true, messageId: data?.messages?.[0]?.id ?? null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erro ao chamar WhatsApp Cloud API" };
    }
  }

  return { success: false, error: "Provedor de WhatsApp não reconhecido" };
}
