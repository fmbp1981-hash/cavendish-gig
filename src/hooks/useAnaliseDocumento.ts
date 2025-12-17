import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notificarDocumentoAprovado, notificarDocumentoRejeitado } from './useNotificacoesEmail';

interface DocumentoContext {
  documentoNome: string;
  organizacaoId: string;
}

async function buscarDadosCliente(statusId: string): Promise<{
  emails: string[];
  documentoNome: string;
  organizacaoNome: string;
  userNames: string[];
} | null> {
  try {
    // Buscar informações do documento e organização
    const { data: statusData, error: statusError } = await supabase
      .from('documentos_requeridos_status')
      .select(`
        documento_requerido_id,
        documentos_requeridos (
          nome,
          projeto_id,
          projetos (
            organizacao_id,
            organizacoes (
              id,
              nome
            )
          )
        )
      `)
      .eq('id', statusId)
      .single();

    if (statusError || !statusData) {
      console.error('Erro ao buscar dados do documento:', statusError);
      return null;
    }

    const docRequerido = statusData.documentos_requeridos as any;
    const projeto = docRequerido?.projetos as any;
    const organizacao = projeto?.organizacoes as any;

    if (!organizacao?.id) {
      console.error('Organização não encontrada');
      return null;
    }

    // Buscar membros da organização com seus emails
    const { data: membros, error: membrosError } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        profiles:user_id (
          email,
          nome
        )
      `)
      .eq('organizacao_id', organizacao.id);

    if (membrosError) {
      console.error('Erro ao buscar membros:', membrosError);
      return null;
    }

    const emails: string[] = [];
    const userNames: string[] = [];

    membros?.forEach((membro: any) => {
      if (membro.profiles?.email) {
        emails.push(membro.profiles.email);
        if (membro.profiles.nome) {
          userNames.push(membro.profiles.nome);
        }
      }
    });

    return {
      emails,
      documentoNome: docRequerido?.nome || 'Documento',
      organizacaoNome: organizacao?.nome || 'Organização',
      userNames
    };
  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error);
    return null;
  }
}

export function useAprovarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await (supabase
        .from('documentos_requeridos_status' as any) as any)
        .update({
          status: 'aprovado',
          analisado_por: user.id,
          analisado_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', statusId);

      if (error) throw error;

      // Dispara email de notificação em background
      buscarDadosCliente(statusId).then(async (dados) => {
        if (dados && dados.emails.length > 0) {
          console.log('Enviando emails de aprovação para:', dados.emails);
          for (let i = 0; i < dados.emails.length; i++) {
            const email = dados.emails[i];
            const userName = dados.userNames[i];
            await notificarDocumentoAprovado(email, dados.documentoNome, userName);
          }
        }
      }).catch(err => {
        console.error('Erro ao enviar email de aprovação:', err);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    }
  });
}

export function useRejeitarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ statusId, observacao }: { statusId: string; observacao: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await (supabase
        .from('documentos_requeridos_status' as any) as any)
        .update({
          status: 'rejeitado',
          observacao_rejeicao: observacao,
          analisado_por: user.id,
          analisado_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', statusId);

      if (error) throw error;

      // Dispara email de notificação em background
      buscarDadosCliente(statusId).then(async (dados) => {
        if (dados && dados.emails.length > 0) {
          console.log('Enviando emails de rejeição para:', dados.emails);
          for (let i = 0; i < dados.emails.length; i++) {
            const email = dados.emails[i];
            const userName = dados.userNames[i];
            await notificarDocumentoRejeitado(email, dados.documentoNome, observacao, userName);
          }
        }
      }).catch(err => {
        console.error('Erro ao enviar email de rejeição:', err);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    }
  });
}

export function useIniciarAnalise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await (supabase
        .from('documentos_requeridos_status' as any) as any)
        .update({
          status: 'em_analise',
          updated_at: new Date().toISOString()
        })
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    }
  });
}
