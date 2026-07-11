import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { getAIConfig } from "../_shared/ai-provider.ts";
import { gerarEmbedding } from "../_shared/gemini-embeddings.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Cria/atualiza um chunk da base de conhecimento (Fase 10, RAG) já com o embedding calculado —
// fica aqui (fat server) porque exige a API key do provider de IA, que o client nunca deve ter.
// Só admin: prospeccao_agent_knowledge é RLS-restrita a is_admin() (mesma regra de
// prospeccao_agent_configs, Fase 1).

interface EmbedKnowledgeRequest {
  id?: string;
  categoria: string;
  titulo: string;
  conteudo: string;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createServiceClient();
    const { data: isAdmin } = await service.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { id, categoria, titulo, conteudo } = await req.json() as EmbedKnowledgeRequest;
    if (!categoria || !titulo?.trim() || !conteudo?.trim()) {
      return new Response(JSON.stringify({ error: "categoria, titulo e conteudo são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiConfig = await getAIConfig(service);
    if (aiConfig.provider !== "gemini") {
      return new Response(
        JSON.stringify({ error: "Base de conhecimento (RAG) requer o Gemini como provider de IA ativo em Admin → Integrações" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const embedding = await gerarEmbedding(aiConfig.apiKey, aiConfig.baseUrl, conteudo);

    const linha = { categoria, titulo: titulo.trim(), conteudo: conteudo.trim(), embedding };
    const { data, error } = id
      ? await service.from("prospeccao_agent_knowledge").update(linha).eq("id", id).select().single()
      : await service.from("prospeccao_agent_knowledge").insert(linha).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await logEdgeFunctionError("prospeccao-embed-knowledge", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
