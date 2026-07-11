import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProspeccaoAgentKnowledge, ProspeccaoCategoria } from "@/types/prospeccao";

const db = supabase as any;

export function useKnowledgeByCategoria(categoria: ProspeccaoCategoria) {
  return useQuery({
    queryKey: ["prospeccao_agent_knowledge", categoria],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospeccao_agent_knowledge")
        .select("id, categoria, titulo, conteudo, created_at, updated_at")
        .eq("categoria", categoria)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProspeccaoAgentKnowledge[];
    },
  });
}

interface AddKnowledgeInput {
  categoria: ProspeccaoCategoria;
  titulo: string;
  conteudo: string;
}

/** Gera o embedding server-side (exige a API key do Gemini, que o client nunca deve ter) e grava
 * o chunk — por isso passa pela Edge Function em vez de um insert direto. */
export function useAddKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddKnowledgeInput) => {
      const { data, error } = await supabase.functions.invoke("prospeccao-embed-knowledge", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.data as ProspeccaoAgentKnowledge;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_agent_knowledge", variables.categoria] });
      toast.success("Conteúdo adicionado à base de conhecimento");
    },
    onError: (err: Error) => toast.error("Erro ao adicionar conteúdo", { description: err.message }),
  });
}

export function useDeleteKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categoria: ProspeccaoCategoria }) => {
      const { error } = await db.from("prospeccao_agent_knowledge").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_agent_knowledge", variables.categoria] });
      toast.success("Conteúdo removido");
    },
    onError: (err: Error) => toast.error("Erro ao remover conteúdo", { description: err.message }),
  });
}
