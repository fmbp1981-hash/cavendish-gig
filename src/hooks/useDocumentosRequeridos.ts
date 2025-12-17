import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FaseProjeto, StatusDocumento } from '@/types/database';

interface DocumentoRequerido {
  id: string;
  projeto_id: string;
  catalogo_id: string;
  nome: string;
  descricao: string | null;
  fase: FaseProjeto;
  obrigatorio: boolean;
  template_url: string | null;
  formatos_aceitos: string[] | null;
  tamanho_maximo_mb: number | null;
  criterios_aceitacao: string | null;
  created_at: string;
}

interface DocumentoRequeridoStatus {
  id: string;
  documento_requerido_id: string;
  documento_id: string | null;
  status: StatusDocumento;
  observacao_rejeicao: string | null;
  analisado_por: string | null;
  analisado_em: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentoComStatus extends DocumentoRequerido {
  status_info?: DocumentoRequeridoStatus | null;
}

export function useDocumentosRequeridos(projetoId: string | undefined) {
  return useQuery({
    queryKey: ['documentos-requeridos', projetoId],
    queryFn: async (): Promise<DocumentoComStatus[]> => {
      if (!projetoId) return [];

      // Buscar documentos requeridos do projeto
      const { data: documentos, error: docError } = await (supabase
        .from('documentos_requeridos' as any) as any)
        .select('*')
        .eq('projeto_id', projetoId)
        .order('fase')
        .order('created_at');

      if (docError) throw docError;

      if (!documentos || documentos.length === 0) return [];

      // Buscar status para cada documento
      const docIds = documentos.map((d: any) => d.id);
      const { data: statusList, error: statusError } = await (supabase
        .from('documentos_requeridos_status' as any) as any)
        .select('*')
        .in('documento_requerido_id', docIds);

      if (statusError) throw statusError;

      // Combinar documentos com seus status
      return (documentos as DocumentoRequerido[]).map(doc => ({
        ...doc,
        status_info: (statusList as DocumentoRequeridoStatus[] || [])?.find(
          s => s.documento_requerido_id === doc.id
        ) || null
      }));
    },
    enabled: !!projetoId
  });
}

export function useDocumentosPorFase(projetoId: string | undefined, fase: FaseProjeto | 'todas') {
  const { data: documentos, ...rest } = useDocumentosRequeridos(projetoId);

  const filtered = fase === 'todas' 
    ? documentos 
    : documentos?.filter(d => d.fase === fase);

  return { data: filtered, ...rest };
}

export function useProgressoDocumentos(projetoId: string | undefined) {
  const { data: documentos } = useDocumentosRequeridos(projetoId);

  const total = documentos?.filter(d => d.obrigatorio).length || 0;
  const aprovados = documentos?.filter(
    d => d.obrigatorio && d.status_info?.status === 'aprovado'
  ).length || 0;
  const enviados = documentos?.filter(
    d => d.obrigatorio && ['enviado', 'em_analise', 'aprovado'].includes(d.status_info?.status || '')
  ).length || 0;
  const pendentes = documentos?.filter(
    d => d.obrigatorio && (!d.status_info || d.status_info.status === 'pendente' || d.status_info.status === 'rejeitado')
  ).length || 0;

  return {
    total,
    aprovados,
    enviados,
    pendentes,
    percentual: total > 0 ? Math.round((aprovados / total) * 100) : 0
  };
}

export function useAtualizarStatusDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      statusId, 
      novoStatus, 
      observacao 
    }: { 
      statusId: string; 
      novoStatus: StatusDocumento; 
      observacao?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Record<string, unknown> = {
        status: novoStatus,
        updated_at: new Date().toISOString()
      };

      if (novoStatus === 'rejeitado' && observacao) {
        updateData.observacao_rejeicao = observacao;
      }

      if (['aprovado', 'rejeitado'].includes(novoStatus)) {
        updateData.analisado_por = user?.id;
        updateData.analisado_em = new Date().toISOString();
      }

      const { error } = await (supabase
        .from('documentos_requeridos_status' as any) as any)
        .update(updateData)
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
    }
  });
}

export function useCriarStatusDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentoRequeridoId,
      documentoId
    }: { 
      documentoRequeridoId: string;
      documentoId?: string;
    }) => {
      const { error } = await (supabase
        .from('documentos_requeridos_status' as any) as any)
        .upsert({
          documento_requerido_id: documentoRequeridoId,
          documento_id: documentoId,
          status: 'enviado'
        }, {
          onConflict: 'documento_requerido_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
    }
  });
}
