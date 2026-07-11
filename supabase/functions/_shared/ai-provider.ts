import { importAesGcmKeyFromEnv, decryptJsonAesGcm } from "./crypto.ts";

// Extraído de ai-generate/index.ts para reaproveitamento (ver
// CAVENDISH_PROSPECCAO_BLUEPRINT.md §8: evita duplicar a lógica de decrypt/fallback entre
// pontos de chamada de LLM diferentes).

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "claude";
  apiKey: string;
  model: string;
  baseUrl: string;
}

export async function getAIConfig(supabaseService: any): Promise<AIProviderConfig> {
  // Try to get configured provider from system_settings
  const { data: settings } = await supabaseService
    .from("system_settings")
    .select("key, value")
    .in("key", ["ai_provider", "ai_configured"]);

  const settingsMap: Record<string, string> = {};
  (settings || []).forEach((row: any) => {
    settingsMap[row.key] = row.value;
  });

  // If custom provider configured, try to load from integrations table
  if (settingsMap.ai_configured === "true" && settingsMap.ai_provider) {
    const { data: integrationRow } = await supabaseService
      .from("integrations")
      .select("secrets_encrypted, config")
      .eq("provider", "ai-provider")
      .eq("scope", "system")
      .single();

    if (integrationRow?.secrets_encrypted) {
      try {
        // Decrypt secrets using the same AES-GCM key used by the integrations edge function
        const cryptoKey = await importAesGcmKeyFromEnv("INTEGRATIONS_ENCRYPTION_KEY");
        const secrets = await decryptJsonAesGcm<Record<string, string>>(cryptoKey, integrationRow.secrets_encrypted);
        const config = integrationRow.config as Record<string, string>;

        const providerName = config?.provider || settingsMap.ai_provider;

        switch (providerName) {
          case "gemini":
            return {
              provider: "gemini",
              apiKey: secrets.GEMINI_API_KEY || "",
              model: "gemini-1.5-flash",
              baseUrl: "https://generativelanguage.googleapis.com/v1beta"
            };
          case "openai":
            return {
              provider: "openai",
              apiKey: secrets.OPENAI_API_KEY || "",
              model: "gpt-4o-mini",
              baseUrl: "https://api.openai.com/v1"
            };
          case "claude":
            return {
              provider: "claude",
              apiKey: secrets.ANTHROPIC_API_KEY || "",
              model: "claude-3-5-sonnet-20241022",
              baseUrl: "https://api.anthropic.com/v1"
            };
        }
      } catch (decryptErr) {
        console.error("Erro ao decriptar credenciais de IA:", decryptErr);
        // Fall through to env fallback
      }
    }
  }

  // Fallback: OPENAI_API_KEY da env (compatível com OpenAI-compatible APIs)
  const fallbackKey = Deno.env.get("OPENAI_API_KEY");
  if (!fallbackKey) {
    throw new Error("Nenhum provedor de IA configurado. Configure em Admin → Integrações.");
  }

  return {
    provider: "openai",
    apiKey: fallbackKey,
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1"
  };
}
