import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Integration disabled — not in active use
serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Trello sync desativado" }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
