import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAlocacoes() {
  return useQuery({
    queryKey: ["alocacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultor_organizacoes")
        .select("id, consultor_id, organizacao_id, created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useAlocacoesPorConsultor(consultorId: string | undefined) {
  return useQuery({
    queryKey: ["alocacoes-consultor", consultorId],
    queryFn: async () => {
      if (!consultorId) return [];
      const { data, error } = await supabase
        .from("consultor_organizacoes")
        .select("id, organizacao_id")
        .eq("consultor_id", consultorId);
      if (error) throw error;
      return data;
    },
    enabled: !!consultorId,
  });
}

export function useAlocacoesPorOrganizacao(orgId: string | undefined) {
  return useQuery({
    queryKey: ["alocacoes-org", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("consultor_organizacoes")
        .select("id, consultor_id")
        .eq("organizacao_id", orgId);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useAlocarConsultor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consultorId,
      organizacaoId,
    }: {
      consultorId: string;
      organizacaoId: string;
    }) => {
      const { error } = await supabase
        .from("consultor_organizacoes")
        .insert({ consultor_id: consultorId, organizacao_id: organizacaoId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alocacoes"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes-consultor"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes-org"] });
      queryClient.invalidateQueries({ queryKey: ["documentos-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["consultor-organizacoes"] });
      toast.success("Consultor alocado com sucesso");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Este consultor já está alocado nessa organização");
      } else {
        toast.error("Erro ao alocar consultor");
      }
    },
  });
}

export function useDesalocarConsultor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alocacaoId: string) => {
      const { error } = await supabase
        .from("consultor_organizacoes")
        .delete()
        .eq("id", alocacaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alocacoes"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes-consultor"] });
      queryClient.invalidateQueries({ queryKey: ["alocacoes-org"] });
      queryClient.invalidateQueries({ queryKey: ["documentos-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["consultor-organizacoes"] });
      toast.success("Consultor desalocado");
    },
    onError: () => {
      toast.error("Erro ao desalocar consultor");
    },
  });
}
