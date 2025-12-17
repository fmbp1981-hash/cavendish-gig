import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface DocumentoVersao {
  id: string;
  documento_id: string;
  version_number: number;
  nome: string;
  descricao: string | null;
  tipo: string;
  url: string;
  tamanho: number | null;
  mime_type: string | null;
  drive_file_id: string | null;
  organizacao_id: string | null;
  projeto_id: string | null;
  uploaded_by: string | null;
  change_type: 'create' | 'update' | 'metadata_change';
  change_description: string | null;
  changed_fields: string[] | null;
  created_at: string;
  created_by: string | null;
  created_by_name?: string;
  created_by_avatar?: string;
  documento_atual_nome?: string;
}

export interface VersionDiff {
  nome?: { from: string; to: string };
  descricao?: { from: string | null; to: string | null };
  arquivo?: { changed: boolean };
}

/**
 * Hook para gerenciar versões de documentos
 * Permite listar, comparar e restaurar versões anteriores
 */
export function useDocumentoVersoes(documentoId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Query: Buscar todas as versões de um documento
   */
  const {
    data: versoes,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["documento-versoes", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];

      const { data, error } = await supabase
        .from("documento_versoes_resumo" as any)
        .select("*")
        .eq("documento_id", documentoId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as DocumentoVersao[];
    },
    enabled: !!documentoId,
  });

  /**
   * Query: Buscar uma versão específica
   */
  const getVersao = async (versionNumber: number): Promise<DocumentoVersao | null> => {
    if (!documentoId) return null;

    const { data, error } = await supabase
      .from("documento_versoes" as any)
      .select("*")
      .eq("documento_id", documentoId)
      .eq("version_number", versionNumber)
      .single();

    if (error) {
      console.error("Erro ao buscar versão:", error);
      return null;
    }

    return (data ?? null) as unknown as DocumentoVersao | null;
  };

  /**
   * Query: Comparar duas versões
   */
  const {
    data: diff,
    mutate: comparar,
    isPending: isComparing
  } = useMutation({
    mutationFn: async ({
      versionFrom,
      versionTo
    }: {
      versionFrom: number;
      versionTo: number;
    }) => {
      if (!documentoId) throw new Error("documento_id é obrigatório");

      const { data, error } = await supabase.rpc("get_version_diff" as any, {
        p_documento_id: documentoId,
        p_version_from: versionFrom,
        p_version_to: versionTo,
      });

      if (error) throw error;
      return data as unknown as VersionDiff;
    },
    onSuccess: () => {
      toast({
        title: "Comparação realizada",
        description: "As diferenças entre as versões foram calculadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao comparar versões",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutation: Restaurar versão anterior
   */
  const { mutate: restaurar, isPending: isRestoring } = useMutation({
    mutationFn: async (versionNumber: number) => {
      if (!documentoId) throw new Error("documento_id é obrigatório");

      const { data, error } = await supabase.rpc("restore_document_version" as any, {
        p_documento_id: documentoId,
        p_version_number: versionNumber,
      });

      if (error) throw error;
      return data as unknown;
    },
    onSuccess: () => {
      // Invalidar cache do documento e suas versões
      queryClient.invalidateQueries({ queryKey: ["documento-versoes", documentoId] });
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["documento", documentoId] });

      toast({
        title: "✅ Versão restaurada",
        description: "O documento foi restaurado para a versão selecionada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao restaurar versão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Função helper: Obter última versão
   */
  const getUltimaVersao = (): DocumentoVersao | undefined => {
    if (!versoes || versoes.length === 0) return undefined;
    return versoes[0]; // Já vem ordenado DESC
  };

  /**
   * Função helper: Obter número total de versões
   */
  const getTotalVersoes = (): number => {
    return versoes?.length || 0;
  };

  /**
   * Função helper: Verificar se há versões antigas
   */
  const hasVersoesAntigas = (): boolean => {
    return getTotalVersoes() > 1;
  };

  /**
   * Função helper: Formatar descrição da mudança
   */
  const formatarMudanca = (versao: DocumentoVersao): string => {
    if (versao.change_type === 'create') {
      return 'Versão inicial do documento';
    }

    if (versao.change_description) {
      return versao.change_description;
    }

    if (versao.changed_fields && versao.changed_fields.length > 0) {
      const campos = versao.changed_fields.join(', ');
      return `Alteração em: ${campos}`;
    }

    return 'Documento atualizado';
  };

  /**
   * Função helper: Formatar data relativa
   */
  const formatarDataRelativa = (dataISO: string): string => {
    const data = new Date(dataISO);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Há ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
    if (diffDias < 30) {
      const semanas = Math.floor(diffDias / 7);
      return `Há ${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    if (diffDias < 365) {
      const meses = Math.floor(diffDias / 30);
      return `Há ${meses} ${meses > 1 ? 'meses' : 'mês'}`;
    }

    return data.toLocaleDateString('pt-BR');
  };

  return {
    // Dados
    versoes,
    diff,

    // Estados
    isLoading,
    isComparing,
    isRestoring,
    error,

    // Ações
    restaurar,
    comparar,
    getVersao,
    refetch,

    // Helpers
    getUltimaVersao,
    getTotalVersoes,
    hasVersoesAntigas,
    formatarMudanca,
    formatarDataRelativa,
  };
}
