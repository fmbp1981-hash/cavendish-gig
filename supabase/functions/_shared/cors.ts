/**
 * Shared CORS helper for Supabase Edge Functions.
 *
 * Uses the ALLOWED_ORIGIN env var when set (production).
 * Falls back to "*" if not set (local dev / CI).
 */

function getAllowedOrigin(): string {
  return Deno.env.get("ALLOWED_ORIGIN") || "*";
}

export function buildCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowed = getAllowedOrigin();

  // If wildcard, return as-is
  if (allowed === "*") {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
    };
  }

  // Otherwise validate request origin against the configured allowed origin
  const allowedOrigins = allowed.split(",").map((o) => o.trim());
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]; // default to first allowed origin

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
    "Vary": "Origin",
  };
}
