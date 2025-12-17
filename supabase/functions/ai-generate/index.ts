import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  tipo: "codigo_etica" | "analise_documento" | "gerar_ata" | "chat";
  input_data: Record<string, unknown>;
  projeto_id?: string;
  organizacao_id?: string;
  stream?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tipo, input_data, projeto_id, organizacao_id, stream = false }: AIRequest = await req.json();

    // Construir prompt baseado no tipo
    let systemPrompt = "";
    let userPrompt = "";

    switch (tipo) {
      case "codigo_etica":
        systemPrompt = `Você é um especialista em governança corporativa e compliance. 
Gere um Código de Ética profissional e completo para uma empresa, seguindo as melhores práticas de mercado.
O código deve incluir: Introdução, Valores e Princípios, Conduta Profissional, Conflitos de Interesse, 
Relacionamento com Stakeholders, Confidencialidade, Canais de Denúncia, e Disposições Finais.
Formate o documento em Markdown com seções claras.`;
        userPrompt = `Gere um Código de Ética para a empresa "${input_data.nome_empresa || "Empresa"}".
Setor: ${input_data.setor || "Geral"}
Porte: ${input_data.porte || "Médio"}
Valores principais: ${input_data.valores || "Ética, Transparência, Respeito"}`;
        break;

      case "analise_documento":
        systemPrompt = `Você é um analista de documentos especializado em compliance e governança.
Analise o documento fornecido e forneça uma avaliação estruturada com:
1. Resumo do documento
2. Pontos positivos
3. Pontos de atenção ou melhorias necessárias
4. Recomendação: APROVAR, APROVAR COM RESSALVAS, ou REJEITAR
5. Justificativa da recomendação`;
        userPrompt = `Analise o seguinte documento:
Tipo: ${input_data.tipo_documento || "Documento"}
Nome: ${input_data.nome_documento || "Sem nome"}
Conteúdo/Descrição: ${input_data.conteudo || input_data.descricao || "Não disponível"}`;
        break;

      case "gerar_ata":
        systemPrompt = `Você é um secretário executivo especializado em documentação corporativa.
Gere uma ata de reunião profissional e estruturada com base nas informações fornecidas.
A ata deve incluir: Data, Participantes, Pauta, Discussões, Deliberações, Encaminhamentos e Encerramento.
Formate em Markdown.`;
        userPrompt = `Gere uma ata de reunião com as seguintes informações:
Data: ${input_data.data || new Date().toLocaleDateString("pt-BR")}
Participantes: ${input_data.participantes || "A definir"}
Pauta: ${input_data.pauta || "Reunião geral"}
Notas/Discussões: ${input_data.notas || "Discussão dos temas da pauta"}`;
        break;

      case "chat":
      default:
        systemPrompt = `Você é um assistente especializado em governança corporativa, compliance e gestão empresarial.
Responda de forma clara, profissional e objetiva.`;
        userPrompt = String(input_data.mensagem || input_data.prompt || "");
        break;
    }

    const startTime = Date.now();

    if (stream) {
      // Streaming response
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na configuração do workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Non-streaming response
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na configuração do workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      // Salvar no histórico usando service role
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabaseService.from("ai_generations").insert({
        tipo,
        input_data,
        output_text: generatedText,
        user_id: user.id,
        projeto_id: projeto_id || null,
        organizacao_id: organizacao_id || null,
        tokens_used: tokensUsed,
        duracao_ms: durationMs,
        status: "completed",
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          output: generatedText,
          tokens_used: tokensUsed,
          duration_ms: durationMs
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro na função ai-generate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
