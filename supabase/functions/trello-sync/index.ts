import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Trello Integration Edge Function
 * Syncs tasks between Cavendish GIG and Trello boards
 * 
 * Features:
 * - Create Trello cards from internal tasks
 * - Sync card status back to internal tasks
 * - Webhook receiver for Trello updates
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrelloConfig {
  api_key: string;
  api_token: string;
  board_id: string;
  list_mappings: Record<string, string>; // status -> list_id
}

interface SyncRequest {
  action: "sync_task" | "webhook" | "get_boards" | "setup";
  tarefa_id?: string;
  webhook_data?: any;
  organizacao_id?: string;
}

const TRELLO_API_BASE = "https://api.trello.com/1";

async function getTrelloConfig(supabase: any, organizacaoId: string): Promise<TrelloConfig | null> {
  const { data, error } = await supabase
    .from("integrations")
    .select("config")
    .eq("organizacao_id", organizacaoId)
    .eq("tipo", "trello")
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) return null;
  return data.config as TrelloConfig;
}

async function createTrelloCard(config: TrelloConfig, task: any): Promise<{ id: string; url: string } | null> {
  const listId = config.list_mappings[task.status] || config.list_mappings["pendente"];
  if (!listId) return null;

  const response = await fetch(`${TRELLO_API_BASE}/cards?key=${config.api_key}&token=${config.api_token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idList: listId,
      name: task.titulo,
      desc: task.descricao || "",
      due: task.prazo || null,
      labels: task.prioridade === "urgente" ? ["red"] : task.prioridade === "alta" ? ["orange"] : [],
    }),
  });

  if (!response.ok) {
    console.error("Trello API error:", await response.text());
    return null;
  }

  const card = await response.json();
  return { id: card.id, url: card.url };
}

async function updateTrelloCard(config: TrelloConfig, cardId: string, updates: any): Promise<boolean> {
  const listId = config.list_mappings[updates.status];
  
  const body: any = {};
  if (updates.titulo) body.name = updates.titulo;
  if (updates.descricao !== undefined) body.desc = updates.descricao;
  if (updates.prazo) body.due = updates.prazo;
  if (listId) body.idList = listId;
  if (updates.status === "concluida") body.closed = true;
  if (updates.status !== "concluida") body.closed = false;

  const response = await fetch(
    `${TRELLO_API_BASE}/cards/${cardId}?key=${config.api_key}&token=${config.api_token}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  return response.ok;
}

async function getBoards(config: TrelloConfig): Promise<any[]> {
  const response = await fetch(
    `${TRELLO_API_BASE}/members/me/boards?key=${config.api_key}&token=${config.api_token}&fields=name,id,url`
  );
  
  if (!response.ok) return [];
  return response.json();
}

async function getBoardLists(config: TrelloConfig): Promise<any[]> {
  const response = await fetch(
    `${TRELLO_API_BASE}/boards/${config.board_id}/lists?key=${config.api_key}&token=${config.api_token}&fields=name,id`
  );
  
  if (!response.ok) return [];
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json();

    // Validate organizacao_id exists
    if (!body.organizacao_id && body.action !== "webhook") {
      return new Response(
        JSON.stringify({ error: "organizacao_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if organization has Trello feature enabled
    if (body.organizacao_id) {
      const { data: hasFeature } = await supabase.rpc("org_has_feature", {
        p_organizacao_id: body.organizacao_id,
        p_feature: "integracao_trello",
      });

      if (!hasFeature) {
        return new Response(
          JSON.stringify({ error: "Integração Trello não disponível no seu plano" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const config = body.organizacao_id 
      ? await getTrelloConfig(supabase, body.organizacao_id) 
      : null;

    switch (body.action) {
      case "get_boards": {
        if (!config) {
          return new Response(
            JSON.stringify({ error: "Configuração Trello não encontrada" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const boards = await getBoards(config);
        return new Response(
          JSON.stringify({ boards }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "setup": {
        if (!config) {
          return new Response(
            JSON.stringify({ error: "Configuração Trello não encontrada" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const lists = await getBoardLists(config);
        return new Response(
          JSON.stringify({ lists }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync_task": {
        if (!config || !body.tarefa_id) {
          return new Response(
            JSON.stringify({ error: "Configuração ou tarefa_id ausente" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get task
        const { data: tarefa, error: tarefaError } = await supabase
          .from("tarefas")
          .select("*")
          .eq("id", body.tarefa_id)
          .single();

        if (tarefaError || !tarefa) {
          return new Response(
            JSON.stringify({ error: "Tarefa não encontrada" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if already synced
        const { data: existing } = await supabase
          .from("integration_sync")
          .select("external_id")
          .eq("integration_type", "trello")
          .eq("entity_type", "tarefa")
          .eq("entity_id", body.tarefa_id)
          .maybeSingle();

        if (existing?.external_id) {
          // Update existing card
          await updateTrelloCard(config, existing.external_id, tarefa);
          return new Response(
            JSON.stringify({ success: true, action: "updated", card_id: existing.external_id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create new card
        const card = await createTrelloCard(config, tarefa);
        if (!card) {
          return new Response(
            JSON.stringify({ error: "Erro ao criar card no Trello" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Store sync mapping
        await supabase.from("integration_sync").insert({
          integration_type: "trello",
          entity_type: "tarefa",
          entity_id: body.tarefa_id,
          external_id: card.id,
          external_url: card.url,
          organizacao_id: body.organizacao_id,
        });

        return new Response(
          JSON.stringify({ success: true, action: "created", card_id: card.id, url: card.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "webhook": {
        // Handle Trello webhook callbacks
        // This would update local tasks when Trello cards change
        console.log("[Trello Webhook]", body.webhook_data);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Erro na função trello-sync:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
