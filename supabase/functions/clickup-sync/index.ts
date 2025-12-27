import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * ClickUp Integration Edge Function
 * Syncs tasks between Cavendish GIG and ClickUp workspaces
 * 
 * Features:
 * - Create ClickUp tasks from internal tasks
 * - Sync task status back to internal tasks
 * - Webhook receiver for ClickUp updates
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClickUpConfig {
  api_token: string;
  workspace_id: string;
  list_id: string;
  status_mappings: Record<string, string>; // internal_status -> clickup_status
}

interface SyncRequest {
  action: "sync_task" | "webhook" | "get_workspaces" | "get_lists" | "setup";
  tarefa_id?: string;
  webhook_data?: any;
  organizacao_id?: string;
  folder_id?: string;
}

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

async function getClickUpConfig(supabase: any, organizacaoId: string): Promise<ClickUpConfig | null> {
  const { data, error } = await supabase
    .from("integrations")
    .select("config")
    .eq("organizacao_id", organizacaoId)
    .eq("tipo", "clickup")
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) return null;
  return data.config as ClickUpConfig;
}

async function clickUpFetch(config: ClickUpConfig, path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${CLICKUP_API_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": config.api_token,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function createClickUpTask(config: ClickUpConfig, task: any): Promise<{ id: string; url: string } | null> {
  const priorityMap: Record<string, number> = {
    urgente: 1,
    alta: 2,
    media: 3,
    baixa: 4,
  };

  const body: any = {
    name: task.titulo,
    description: task.descricao || "",
    status: config.status_mappings[task.status] || "to do",
    priority: priorityMap[task.prioridade] || 3,
  };

  if (task.prazo) {
    body.due_date = new Date(task.prazo).getTime();
  }

  const response = await clickUpFetch(config, `/list/${config.list_id}/task`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error("ClickUp API error:", await response.text());
    return null;
  }

  const clickUpTask = await response.json();
  return { id: clickUpTask.id, url: clickUpTask.url };
}

async function updateClickUpTask(config: ClickUpConfig, taskId: string, updates: any): Promise<boolean> {
  const body: any = {};
  
  if (updates.titulo) body.name = updates.titulo;
  if (updates.descricao !== undefined) body.description = updates.descricao;
  if (updates.prazo) body.due_date = new Date(updates.prazo).getTime();
  if (updates.status && config.status_mappings[updates.status]) {
    body.status = config.status_mappings[updates.status];
  }

  const response = await clickUpFetch(config, `/task/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return response.ok;
}

async function getWorkspaces(config: ClickUpConfig): Promise<any[]> {
  const response = await clickUpFetch(config, "/team");
  if (!response.ok) return [];
  const data = await response.json();
  return data.teams || [];
}

async function getSpaces(config: ClickUpConfig): Promise<any[]> {
  const response = await clickUpFetch(config, `/team/${config.workspace_id}/space`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.spaces || [];
}

async function getFolders(config: ClickUpConfig, spaceId: string): Promise<any[]> {
  const response = await clickUpFetch(config, `/space/${spaceId}/folder`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.folders || [];
}

async function getLists(config: ClickUpConfig, folderId: string): Promise<any[]> {
  const response = await clickUpFetch(config, `/folder/${folderId}/list`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.lists || [];
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

    // Check if organization has ClickUp feature enabled
    if (body.organizacao_id) {
      const { data: hasFeature } = await supabase.rpc("org_has_feature", {
        p_organizacao_id: body.organizacao_id,
        p_feature: "integracao_clickup",
      });

      if (!hasFeature) {
        return new Response(
          JSON.stringify({ error: "Integração ClickUp não disponível no seu plano" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const config = body.organizacao_id 
      ? await getClickUpConfig(supabase, body.organizacao_id) 
      : null;

    switch (body.action) {
      case "get_workspaces": {
        if (!config) {
          return new Response(
            JSON.stringify({ error: "Configuração ClickUp não encontrada" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const workspaces = await getWorkspaces(config);
        return new Response(
          JSON.stringify({ workspaces }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_lists": {
        if (!config || !body.folder_id) {
          return new Response(
            JSON.stringify({ error: "Configuração ou folder_id ausente" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const lists = await getLists(config, body.folder_id);
        return new Response(
          JSON.stringify({ lists }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "setup": {
        if (!config) {
          return new Response(
            JSON.stringify({ error: "Configuração ClickUp não encontrada" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const spaces = await getSpaces(config);
        return new Response(
          JSON.stringify({ spaces }),
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
          .eq("integration_type", "clickup")
          .eq("entity_type", "tarefa")
          .eq("entity_id", body.tarefa_id)
          .maybeSingle();

        if (existing?.external_id) {
          // Update existing task
          await updateClickUpTask(config, existing.external_id, tarefa);
          return new Response(
            JSON.stringify({ success: true, action: "updated", task_id: existing.external_id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create new task
        const clickUpTask = await createClickUpTask(config, tarefa);
        if (!clickUpTask) {
          return new Response(
            JSON.stringify({ error: "Erro ao criar task no ClickUp" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Store sync mapping
        await supabase.from("integration_sync").insert({
          integration_type: "clickup",
          entity_type: "tarefa",
          entity_id: body.tarefa_id,
          external_id: clickUpTask.id,
          external_url: clickUpTask.url,
          organizacao_id: body.organizacao_id,
        });

        return new Response(
          JSON.stringify({ success: true, action: "created", task_id: clickUpTask.id, url: clickUpTask.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "webhook": {
        // Handle ClickUp webhook callbacks
        console.log("[ClickUp Webhook]", body.webhook_data);
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
    console.error("Erro na função clickup-sync:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
