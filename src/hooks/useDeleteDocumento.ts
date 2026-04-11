import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeleteParams {
  documentoId: string;
  storagePath: string | null;
  documentoRequeridoId?: string | null;
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentoId, storagePath, documentoRequeridoId }: DeleteParams) => {
      // 1. Remove o status vinculado (volta para pendente)
      if (documentoRequeridoId) {
        const { error: statusError } = await supabase
          .from('documentos_requeridos_status')
          .update({ documento_id: null, status: 'pendente' })
          .eq('documento_requerido_id', documentoRequeridoId);

        if (statusError) throw statusError;
      }

      // 2. Deleta o registro da tabela documentos
      const { error: docError } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documentoId);

      if (docError) throw docError;

      // 3. Remove o arquivo do storage (em background, não bloqueia)
      if (storagePath) {
        supabase.storage
          .from('documentos')
          .remove([storagePath])
          .then(({ error }) => {
            if (error) console.error('Erro ao remover arquivo do storage:', error);
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos-projeto'] });
      queryClient.invalidateQueries({ queryKey: ['repositorio-completo'] });
      queryClient.invalidateQueries({ queryKey: ['docs-requeridos-sem-status'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    },
  });
}
