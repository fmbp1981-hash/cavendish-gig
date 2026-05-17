import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Deprecated — replaced by the onedrive edge function (Item 2, Onda 3)
serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ error: "Google Drive integração removida. Use OneDrive." }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
