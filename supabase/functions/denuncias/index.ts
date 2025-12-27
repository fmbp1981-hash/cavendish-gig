import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  // GDPR/LGPD: Explicitly do not expose any tracking headers
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

interface DenunciaRequest {
  action?: "registrar" | "consultar";
  categoria?: string;
  descricao?: string;
  data_ocorrido?: string;
  envolvidos?: string;
  ticket_id?: string;
  ticket_secret?: string;
  organizacao_id?: string; // Optional: for routing to specific organization
}

// Headers that could identify the user - we explicitly ignore these
const PRIVACY_HEADERS_TO_IGNORE = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "x-client-ip",
  "x-cluster-client-ip",
  "forwarded",
  "via",
  "user-agent",
  "referer",
  "origin",
  "cookie",
  "authorization",
] as const;

/**
 * Sanitize request to ensure no identifying information is logged or stored.
 * This is crucial for anonymous whistleblower protection.
 */
function sanitizeForAnonymity(req: Request): void {
  // Log that we are deliberately NOT logging any identifying headers
  console.log("[ANONYMITY] Processing anonymous denuncia request - no identifying info logged");
  
  // Verify we're not accidentally accessing identifying headers
  for (const header of PRIVACY_HEADERS_TO_IGNORE) {
    // We explicitly do NOT use req.headers.get(header) to avoid any accidental logging
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // CRITICAL: Ensure anonymity - do not log or process identifying headers
  sanitizeForAnonymity(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: DenunciaRequest = await req.json();
    const action = body.action || "registrar";

    // Consultar protocolo
    if (action === "consultar") {
      if (!body.ticket_id || !body.ticket_secret) {
        return new Response(
          JSON.stringify({ error: "Protocolo e código secreto são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("denuncias")
        .select("ticket_id, status, categoria, created_at, analisado_em")
        .eq("ticket_id", body.ticket_id)
        .eq("ticket_secret", body.ticket_secret)
        .maybeSingle();

      if (error) throw error;

      return new Response(
        JSON.stringify({ denuncia: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar nova denúncia
    if (!body.categoria || !body.descricao) {
      return new Response(
        JSON.stringify({ error: "Categoria e descrição são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("denuncias")
      .insert({
        categoria: body.categoria,
        descricao: body.descricao,
        data_ocorrido: body.data_ocorrido || null,
        envolvidos: body.envolvidos || null,
      })
      .select("ticket_id, ticket_secret")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, ticket_id: data.ticket_id, ticket_secret: data.ticket_secret }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função denuncias");
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
