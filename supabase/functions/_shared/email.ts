import { loadIntegration } from "./integrations.ts";

const FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") || "Cavendish GIG <noreply@cavendish.com.br>";

/**
 * Sends an email via Resend API.
 * Loads the API key from the integrations vault first, then falls back to RESEND_API_KEY env var.
 *
 * @param supabase  Service-role Supabase client (needed to read integrations vault)
 * @param to        Recipient email address
 * @param subject   Email subject
 * @param html      Email HTML body
 * @returns true if sent successfully, false otherwise
 */
export async function sendEmail(
  supabase: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const integration = await loadIntegration(supabase, "resend", "system", null);

    if (integration && !integration.enabled) {
      console.log("Resend disabled via integrations vault, skipping email.");
      return false;
    }

    const apiKey =
      (integration?.secrets as Record<string, string> | null)?.RESEND_API_KEY ||
      Deno.env.get("RESEND_API_KEY") ||
      "";

    if (!apiKey) {
      console.error("RESEND_API_KEY not configured.");
      return false;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("sendEmail error:", err);
    return false;
  }
}
