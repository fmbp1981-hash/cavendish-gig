import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  responsavel_id: string | null;
  projeto_id: string | null;
  organizacao_id: string | null;
  prazo: string | null;
  concluido_em: string | null;
  created_at: string;
  updated_at: string;
}

export function useTarefas(organizacaoId?: string, projetoId?: string) {
  return useQuery({
    queryKey: ["tarefas", organizacaoId, projetoId],
    queryFn: async () => {
      let query = supabase
        .from("tarefas")
        .select("*")
        .order("created_at", { ascending: false });

      if (organizacaoId) {
        query = query.eq("organizacao_id", organizacaoId);
      }
      if (projetoId) {
        query = query.eq("projeto_id", projetoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Tarefa[];
    },
    enabled: true,
  });
}

export function useCriarTarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tarefa: {
      titulo: string;
      descricao?: string;
      prioridade?: string;
      responsavel_id?: string;
      projeto_id?: string;
      organizacao_id?: string;
      prazo?: string;
    }) => {
      const { data, error } = await supabase
        .from("tarefas")
        .insert(tarefa)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
  });
}

export function useAtualizarTarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      titulo?: string;
      descricao?: string;
      status?: string;
      prioridade?: string;
      responsavel_id?: string;
      prazo?: string;
      concluido_em?: string;
    }) => {
      const { error } = await supabase
        .from("tarefas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
  });
}

export function useExcluirTarefa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tarefas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
  });
}
