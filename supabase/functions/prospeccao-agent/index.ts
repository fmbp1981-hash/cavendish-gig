import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { getAIConfig, type AIProviderConfig } from "../_shared/ai-provider.ts";
import { getWhatsAppConfig, sendWhatsAppMessage } from "../_shared/whatsapp-provider.ts";
import { PROSPECCAO_TOOLS, executarTool } from "../_shared/prospeccao-tools.ts";
import { gerarEmbedding } from "../_shared/gemini-embeddings.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Orquestrador do agente de IA do Finder (blueprint §8, Opção B: dedicado, não o ai-generate
// genérico — function-calling exige um loop de execução que o ai-generate não implementa).
//
// Function-calling nativo só está implementado para Gemini aqui — é o único provider
// efetivamente configurado/testado no projeto hoje (ver conversa sobre free tier do Google AI
// Studio). Se o provider ativo em Admin → Integrações for OpenAI/Claude, o agente ainda responde
// (texto simples, sem tools) mas não executa ações automáticas — a diferença é sinalizada no log,
// não falha silenciosamente. Estender pros outros dois providers fica para quando o time
// confirmar que vai usar algum deles de fato em produção (implementar 2 formatos de
// function-calling sem poder testar nenhum dos dois seria especulativo).
//
// `verify_jwt = false` (ver config.toml) — este function aceita DUAS formas de chamada:
//  1. Usuário autenticado (admin/representante) via UI, ex. botão "gerar resposta manualmente"
//  2. Chamada interna do whatsapp-webhook, sem JWT de usuário — autenticada por um segredo
//     compartilhado (`x-internal-secret`, reaproveitando o mesmo `cron_secret` de
//     system_settings já usado por compliance-alerts/reuniao-lembrete)

interface AgentRequest {
  leadId: string;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, any> };
  functionResponse?: { name: string; response: Record<string, any> };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

async function autenticar(req: Request, service: any): Promise<boolean> {
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret) {
    const { data } = await service.from("system_settings").select("value").eq("key", "cron_secret").maybeSingle();
    return !!data?.value && data.value === internalSecret;
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;
  const userClient = createUserClient(authHeader);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return false;

  const { data: roles } = await service.from("user_roles").select("role").eq("user_id", user.id);
  const roleNames = (roles ?? []).map((r: any) => r.role);
  return roleNames.includes("admin") || roleNames.includes("representante");
}

const MAX_ITERACOES_PADRAO = 5;

/** RAG (Fase 10, opcional) — só quando `agentConfig.usa_rag` e o provider ativo é Gemini (mesma
 * limitação já existente pro function-calling: único provider testável hoje). Falha degradando
 * (loga e retorna null) em vez de bloquear a resposta do agente — a base de conhecimento é um
 * complemento, não uma dependência crítica do fluxo de conversa. */
async function buscarContextoRAG(
  service: any,
  aiConfig: AIProviderConfig,
  agentConfig: Record<string, any>,
  categoria: string,
  ultimaMensagemUsuario: string | null,
): Promise<string | null> {
  if (!agentConfig.usa_rag || !ultimaMensagemUsuario) return null;
  try {
    const embedding = await gerarEmbedding(aiConfig.apiKey, aiConfig.baseUrl, ultimaMensagemUsuario);
    const { data, error } = await service.rpc("buscar_conhecimento_similar", {
      p_categoria: categoria,
      p_embedding: embedding,
      p_top_k: agentConfig.rag_top_k || 5,
      p_threshold: Number(agentConfig.rag_similarity_threshold) || 0.75,
    });
    if (error || !data || data.length === 0) return null;
    const trechos = data.map((d: any) => `- ${d.titulo}: ${d.conteudo}`).join("\n");
    return `Contexto da base de conhecimento (use se relevante para responder):\n${trechos}`;
  } catch (err) {
    console.error("[prospeccao-agent] falha ao buscar contexto RAG (não bloqueia a resposta):", err);
    return null;
  }
}

async function chamarGeminiComTools(
  apiKey: string,
  model: string,
  baseUrl: string,
  systemPrompt: string,
  historico: GeminiContent[],
  temperatura: number,
  maxIteracoes: number,
  service: any,
  lead: Record<string, any>,
): Promise<{ texto: string | null; transferido: boolean }> {
  const turnos: GeminiContent[] = [...historico];

  for (let i = 0; i < maxIteracoes; i++) {
    const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: turnos,
        tools: [{ functionDeclarations: PROSPECCAO_TOOLS }],
        generationConfig: { temperature: temperatura, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini respondeu ${res.status}`);

    const data = await res.json();
    const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];
    const functionCalls = parts.filter((p) => p.functionCall);
    const texto = parts.filter((p) => p.text).map((p) => p.text).join("\n").trim() || null;

    if (functionCalls.length === 0) {
      return { texto, transferido: false };
    }

    turnos.push({ role: "model", parts });

    const functionResponseParts: GeminiPart[] = [];
    let transferido = false;
    for (const fc of functionCalls) {
      const nome = fc.functionCall!.name;
      const args = fc.functionCall!.args ?? {};
      const resultado = await executarTool(service, lead, nome, args);
      functionResponseParts.push({ functionResponse: { name: nome, response: resultado as unknown as Record<string, any> } });
      if (nome === "transferir_para_humano" && resultado.success) transferido = true;
    }
    turnos.push({ role: "user", parts: functionResponseParts });

    if (transferido) {
      return { texto, transferido: true };
    }
  }

  return { texto: null, transferido: false };
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const service = createServiceClient();

  try {
    if (!(await autenticar(req, service))) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leadId } = await req.json() as AgentRequest;
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lead, error: erroLead } = await service.from("prospeccao_leads").select("*").eq("id", leadId).single();
    if (erroLead || !lead) {
      return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lead.modo_humano) {
      return new Response(JSON.stringify({ skipped: true, reason: "modo_humano" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: agentConfig } = await service
      .from("prospeccao_agent_configs")
      .select("*")
      .eq("categoria", lead.categoria)
      .eq("ativo", true)
      .maybeSingle();

    if (!agentConfig) {
      // Sem agente configurado pra essa categoria — não deixa o lead sem resposta, transfere.
      await executarTool(service, lead, "transferir_para_humano", { motivo: "sem agente de IA configurado para a categoria" });
      return new Response(JSON.stringify({ skipped: true, reason: "sem_agent_config", transferred: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: historicoDb } = await service
      .from("prospeccao_conversas")
      .select("role, conteudo")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true })
      .limit(30);

    let aiConfig;
    try {
      aiConfig = await getAIConfig(service);
    } catch {
      await executarTool(service, lead, "transferir_para_humano", { motivo: "IA não configurada" });
      return new Response(JSON.stringify({ skipped: true, reason: "ia_nao_configurada", transferred: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se o provider ativo do sistema for diferente do configurado pra esta categoria, usa o
    // ativo mesmo assim — só existe uma chave de IA no vault por vez (ver comentário no topo do
    // arquivo). Só loga a divergência.
    if (agentConfig.ai_provider && agentConfig.ai_provider !== aiConfig.provider) {
      console.warn(
        `[prospeccao-agent] categoria "${lead.categoria}" pede provider "${agentConfig.ai_provider}" mas o vault tem "${aiConfig.provider}" ativo — usando o ativo.`,
      );
    }

    const historico: GeminiContent[] = (historicoDb ?? []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.conteudo }],
    }));

    let texto: string | null = null;
    let transferido = false;

    if (aiConfig.provider === "gemini") {
      const ultimaMensagemUsuario = [...(historicoDb ?? [])].reverse().find((m: any) => m.role === "user")?.conteudo ?? null;
      const contextoRAG = await buscarContextoRAG(service, aiConfig, agentConfig, lead.categoria, ultimaMensagemUsuario);
      const systemPromptFinal = contextoRAG ? `${agentConfig.system_prompt}\n\n${contextoRAG}` : agentConfig.system_prompt;

      const resultado = await chamarGeminiComTools(
        aiConfig.apiKey,
        aiConfig.model,
        aiConfig.baseUrl,
        systemPromptFinal,
        historico,
        Number(agentConfig.temperatura) || 0.7,
        agentConfig.max_iteracoes || MAX_ITERACOES_PADRAO,
        service,
        lead,
      );
      texto = resultado.texto;
      transferido = resultado.transferido;
    } else {
      // OpenAI/Claude: sem function-calling implementado ainda (ver nota no topo do arquivo).
      // Também não dá pra cair no ai-generate genérico aqui: ele exige um JWT de usuário real
      // pra autenticar (auth.getUser()), e esta chamada pode não ter nenhum (disparo interno via
      // webhook, sem sessão de usuário) — forjar um token de service role como se fosse sessão de
      // usuário falharia silenciosamente (401) em vez de resolver o problema. Em vez de fingir
      // suporte que não existe, transfere direto pro humano.
      console.warn(`[prospeccao-agent] provider "${aiConfig.provider}" sem suporte a function-calling implementado — transferindo lead ${lead.id} para humano.`);
    }

    if (!texto && !transferido) {
      // Esgotou tentativas sem resposta final — não deixa o lead sem retorno, transfere.
      await executarTool(service, lead, "transferir_para_humano", { motivo: "agente não conseguiu concluir a resposta" });
      transferido = true;
    }

    if (texto) {
      await service.from("prospeccao_conversas").insert({ lead_id: lead.id, role: "assistant", conteudo: texto, tipo: "texto" });
      await service.from("prospeccao_leads").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", lead.id);

      if (lead.telefone) {
        const whatsappConfig = await getWhatsAppConfig(service);
        if (whatsappConfig) {
          const envio = await sendWhatsAppMessage(whatsappConfig, lead.telefone, texto);
          if (!envio.success) console.error(`[prospeccao-agent] falha ao enviar WhatsApp: ${envio.error}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, texto, transferido }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await logEdgeFunctionError("prospeccao-agent", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
