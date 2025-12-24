import { decryptJsonAesGcm, importAesGcmKeyFromEnv } from "./crypto.ts";

export type IntegrationScope = "system" | "organization";

export interface IntegrationRecord {
  enabled: boolean;
  config: Record<string, unknown>;
  secrets: Record<string, unknown> | null;
}

export async function loadIntegration(
  service: any,
  provider: string,
  scope: IntegrationScope = "system",
  organizacaoId: string | null = null,
): Promise<IntegrationRecord | null> {
  let q = service
    .from("integrations")
    .select("enabled, config, secrets_encrypted")
    .eq("provider", provider)
    .eq("scope", scope);

  if (scope === "organization") q = q.eq("organizacao_id", organizacaoId);
  else q = q.is("organizacao_id", null);

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Return the record even if disabled so callers can respect `enabled=false`.
  // Also avoid decrypting secrets when disabled to prevent hard dependency on
  // INTEGRATIONS_ENCRYPTION_KEY for disabled integrations.
  if (!data.enabled) {
    return {
      enabled: false,
      config: data.config || {},
      secrets: null,
    };
  }

  let secrets: Record<string, unknown> | null = null;
  if (data.secrets_encrypted) {
    const key = await importAesGcmKeyFromEnv("INTEGRATIONS_ENCRYPTION_KEY");
    secrets = await decryptJsonAesGcm<Record<string, unknown>>(key, data.secrets_encrypted);
  }

  return {
    enabled: !!data.enabled,
    config: data.config || {},
    secrets,
  };
}
