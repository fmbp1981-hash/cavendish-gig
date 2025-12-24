import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FirefliesWebhook {
  meetingId: string;
  title: string;
  dateTime: string;
  duration: number;
  transcript?: string;
  summary?: string;
  attendees?: string[];
  actionItems?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("process-transcription function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Webhook authentication (Fireflies or similar)
    const service = createServiceClient();
    const integration = await loadIntegration(service, "fireflies", "system", null);

    if (integration && !integration.enabled) {
      return new Response(
        JSON.stringify({ error: "Transcription integration disabled" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const expectedSecret = (integration?.secrets as any)?.TRANSCRIPTION_WEBHOOK_SECRET || Deno.env.get("TRANSCRIPTION_WEBHOOK_SECRET") || "";
    const providedSecret = req.headers.get("x-webhook-secret") || "";
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData: FirefliesWebhook = await req.json();
    console.log("Received transcription webhook");

    // Generate meeting minutes using AI
    const aiPrompt = `Você é um especialista em Governança Corporativa. Baseado na transcrição abaixo, gere uma ata de reunião profissional.

**Reunião:** ${webhookData.title}
**Data:** ${webhookData.dateTime}
**Duração:** ${webhookData.duration} minutos
${webhookData.attendees ? `**Participantes:** ${webhookData.attendees.join(", ")}` : ""}

**Transcrição:**
${webhookData.transcript || "Transcrição não disponível"}

${webhookData.summary ? `**Resumo automático:** ${webhookData.summary}` : ""}

${webhookData.actionItems?.length ? `**Ações identificadas:** ${webhookData.actionItems.join("; ")}` : ""}

Gere uma ata formal contendo:
1. Cabeçalho com data, hora e participantes
2. Pauta da reunião
3. Discussões principais (resumido)
4. Deliberações e decisões
5. Ações definidas com responsáveis e prazos
6. Encerramento

Formato: Markdown profissional`;

    // Generate minutes using the AI gateway directly (system-to-system)
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em Governança Corporativa. Gere uma ata de reunião formal e profissional em Markdown.",
          },
          { role: "user", content: aiPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error("AI Gateway error:", aiResp.status, errorText);
      throw new Error("Failed to generate meeting minutes");
    }

    const aiJson = await aiResp.json();
    const generatedMinutes = aiJson.choices?.[0]?.message?.content || "Ata não gerada";

    // Store generation for auditability
    await supabase.from("ai_generations").insert({
      tipo: "ata_reuniao",
      input_data: {
        meeting_id: webhookData.meetingId,
        meeting_title: webhookData.title,
        meeting_datetime: webhookData.dateTime,
      },
      output_text: generatedMinutes,
      status: "completed",
    });

    // Log the generation
    console.log("Meeting minutes generated successfully");

    // Return the generated minutes
    return new Response(
      JSON.stringify({
        success: true,
        meetingId: webhookData.meetingId,
        title: webhookData.title,
        minutes: generatedMinutes,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing transcription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
