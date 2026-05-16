import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DocComplementarPayload {
  projetoId: string;
  organizacaoId: string;
  nome: string;
  descricao?: string;
  catalogoId?: string;
  formatos_aceitos?: string;
  tamanho_maximo_mb?: number;
}

export function useDocumentosComplementaresProjeto(projetoId: string | undefined) {
  return useQuery({
    queryKey: ["docs-complementares", projetoId],
    queryFn: async () => {
      if (!projetoId) return [];
      const { data, error } = await supabase
        .from("documentos_requeridos")
        .select("*")
        .eq("projeto_id", projetoId)
        .eq("is_complementar", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projetoId,
  });
}

export function useProjetoPorOrganizacao(organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["projeto-org", organizacaoId],
    queryFn: async () => {
      if (!organizacaoId) return null;
      const { data, error } = await supabase
        .from("projetos")
        .select("id, nome, fase_atual")
        .eq("organizacao_id", organizacaoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizacaoId,
  });
}

export function useSolicitarDocComplementar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: DocComplementarPayload) => {
      const { data, error } = await supabase
        .from("documentos_requeridos")
        .insert({
          projeto_id: payload.projetoId,
          catalogo_id: payload.catalogoId ?? null,
          nome: payload.nome,
          descricao: payload.descricao ?? null,
          fase: "diagnostico",
          obrigatorio: false,
          is_complementar: true,
          solicitado_por: user?.id ?? null,
          formatos_aceitos: payload.formatos_aceitos?.split(',') ?? ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg'],
          tamanho_maximo_mb: payload.tamanho_maximo_mb ?? 25,
          ativo: true,
          ordem: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["docs-complementares", variables.projetoId] });
      queryClient.invalidateQueries({ queryKey: ["documentos-requeridos-projeto", variables.projetoId] });
    },
  });
}

export function useRemoverDocComplementar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projetoId }: { id: string; projetoId: string }) => {
      const { error } = await supabase
        .from("documentos_requeridos")
        .delete()
        .eq("id", id)
        .eq("is_complementar", true);
      if (error) throw error;
      return projetoId;
    },
    onSuccess: (projetoId) => {
      queryClient.invalidateQueries({ queryKey: ["docs-complementares", projetoId] });
      queryClient.invalidateQueries({ queryKey: ["documentos-requeridos-projeto", projetoId] });
    },
  });
}

export function useToggleCatalogoComplementar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_complementar }: { id: string; is_complementar: boolean }) => {
      const { error } = await supabase
        .from("documentos_catalogo")
        .update({ is_complementar })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documento-catalogo"] });
    },
  });
}
