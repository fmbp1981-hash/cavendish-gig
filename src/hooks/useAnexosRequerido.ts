import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase;

export interface AnexoRequerido {
  id: string;
  documento_requerido_id: string;
  documento_id: string;
  status: string;
  ordem: number;
  observacao_rejeicao: string | null;
  analisado_por: string | null;
  analisado_em: string | null;
  created_at: string;
  updated_at: string;
  documento?: {
    id: string;
    nome: string;
    url: string | null;
    tipo: string | null;
    tamanho_bytes: number | null;
    storage_path: string | null;
    descricao: string | null;
    drive_file_id: string | null;
  } | null;
}

interface AprovarAnexoParams {
  anexoId: string;
}

interface RejeitarAnexoParams {
  anexoId: string;
  observacaoRejeicao: string;
}

interface DeleteAnexoParams {
  anexoId: string;
  storagePath: string | null;
}

export function useAnexosByRequerido(documentoRequeridoId: string | null) {
  return useQuery<AnexoRequerido[]>({
    queryKey: ['anexos-requerido', documentoRequeridoId],
    enabled: !!documentoRequeridoId,
    queryFn: async () => {
      if (!documentoRequeridoId) return [];

      const { data, error } = await sb
        .from('documentos_requeridos_anexos' as 'documentos_requeridos_status')
        .select(`
          id,
          documento_requerido_id,
          documento_id,
          status,
          ordem,
          observacao_rejeicao,
          analisado_por,
          analisado_em,
          created_at,
          updated_at,
          documento:documentos(
            id,
            nome,
            url,
            tipo,
            tamanho_bytes,
            storage_path,
            descricao,
            drive_file_id
          )
        `)
        .eq('documento_requerido_id', documentoRequeridoId)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as AnexoRequerido[];
    },
  });
}

export function useAprovarAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ anexoId }: AprovarAnexoParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await sb
        .from('documentos_requeridos_anexos' as 'documentos_requeridos_status')
        .update({
          status: 'aprovado',
          analisado_por: user.id,
          analisado_em: new Date().toISOString(),
        } as never)
        .eq('id', anexoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anexos-requerido'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    },
  });
}

export function useRejeitarAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ anexoId, observacaoRejeicao }: RejeitarAnexoParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await sb
        .from('documentos_requeridos_anexos' as 'documentos_requeridos_status')
        .update({
          status: 'rejeitado',
          observacao_rejeicao: observacaoRejeicao,
          analisado_por: user.id,
          analisado_em: new Date().toISOString(),
        } as never)
        .eq('id', anexoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anexos-requerido'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    },
  });
}

export function useDeleteAnexo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ anexoId, storagePath }: DeleteAnexoParams) => {
      // Delete from storage if path available
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documentos')
          .remove([storagePath]);

        if (storageError) {
          console.error('Erro ao remover arquivo do storage:', storageError);
          // Non-blocking — continue with DB deletion
        }
      }

      // Delete the anexo record (trigger will recalc documentos_requeridos_status)
      const { error } = await sb
        .from('documentos_requeridos_anexos' as 'documentos_requeridos_status')
        .delete()
        .eq('id', anexoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anexos-requerido'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    },
  });
}
