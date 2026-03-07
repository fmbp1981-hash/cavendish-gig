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
    // Extract organizacao_id from query params (e.g. ?organizacao_id=uuid)
    const url = new URL(req.url);
    const organizacaoId = url.searchParams.get("organizacao_id") || null;

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
    console.log("Received transcription webhook for org:", organizacaoId);

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
        organizacao_id: organizacaoId,
      },
      output_text: generatedMinutes,
      status: "completed",
      ...(organizacaoId ? { organizacao_id: organizacaoId } : {}),
    });

    // Save ata as a document in the organization's document repository
    if (organizacaoId) {
      await saveAtaAsDocument(supabase, webhookData, generatedMinutes, organizacaoId);
    }

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

async function saveAtaAsDocument(
  supabase: ReturnType<typeof createClient>,
  webhookData: FirefliesWebhook,
  generatedMinutes: string,
  organizacaoId: string
): Promise<void> {
  try {
    // Find active project for this organization
    const { data: projetos } = await supabase
      .from("projetos")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false })
      .limit(1);

    const projetoId = projetos?.[0]?.id || null;

    // Upload markdown to Supabase Storage
    const timestamp = Date.now();
    const safeId = webhookData.meetingId.replace(/[^a-zA-Z0-9-_]/g, "_");
    const storagePath = `${organizacaoId}/atas/${safeId}-${timestamp}.md`;
    const markdownBytes = new TextEncoder().encode(generatedMinutes);

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(storagePath, markdownBytes, {
        contentType: "text/markdown",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return;
    }

    // Format the meeting date for display
    const meetingDate = webhookData.dateTime
      ? new Date(webhookData.dateTime).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");

    // Insert document record linked to the organization
    const { error: insertError } = await supabase.from("documentos").insert({
      organizacao_id: organizacaoId,
      ...(projetoId ? { projeto_id: projetoId } : {}),
      nome: `Ata - ${webhookData.title}`,
      descricao: `Ata de reunião gerada automaticamente via FireFlies.ai — ${meetingDate}`,
      tipo: "text/markdown",
      tamanho_bytes: markdownBytes.length,
      storage_path: storagePath,
      url: storagePath,
    });

    if (insertError) {
      console.error("Document insert error:", insertError);
    } else {
      console.log("Ata saved to document repository:", storagePath);
    }
  } catch (err) {
    console.error("Error saving ata as document:", err);
  }
}

serve(handler);
