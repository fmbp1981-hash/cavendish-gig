import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Deprecated — Twilio removed (Item 11). WhatsApp via Evolution API not yet implemented.
serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ error: "WhatsApp via Twilio desativado. Migrar para Evolution API." }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
