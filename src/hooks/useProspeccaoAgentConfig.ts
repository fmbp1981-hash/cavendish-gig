import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProspeccaoAgentConfig, ProspeccaoCategoria } from "@/types/prospeccao";

const db = supabase as any;

export function useAgentConfigs() {
  return useQuery({
    queryKey: ["prospeccao_agent_configs"],
    queryFn: async () => {
      const { data, error } = await db.from("prospeccao_agent_configs").select("*").order("categoria");
      if (error) throw error;
      return data as ProspeccaoAgentConfig[];
    },
  });
}

/** Mensagem amigável pro índice único parcial `idx_prospeccao_agent_configs_ativo`
 * (`UNIQUE(categoria) WHERE ativo = true`) — só uma config pode estar ativa por categoria. */
function mensagemDeErro(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Já existe uma configuração ativa para esta categoria. Desative a outra antes de ativar esta.";
  }
  return error.message;
}

type AgentConfigInput = Partial<Omit<ProspeccaoAgentConfig, "id" | "created_at" | "updated_at">> & {
  categoria: ProspeccaoCategoria;
};

export function useCreateAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AgentConfigInput) => {
      const { data, error } = await db.from("prospeccao_agent_configs").insert(input).select().single();
      if (error) throw error;
      return data as ProspeccaoAgentConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_agent_configs"] });
      toast.success("Configuração criada");
    },
    onError: (err: { code?: string; message: string }) => toast.error("Erro ao criar configuração", { description: mensagemDeErro(err) }),
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProspeccaoAgentConfig> & { id: string }) => {
      const { error } = await db.from("prospeccao_agent_configs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_agent_configs"] });
      toast.success("Configuração salva");
    },
    onError: (err: { code?: string; message: string }) => toast.error("Erro ao salvar configuração", { description: mensagemDeErro(err) }),
  });
}
