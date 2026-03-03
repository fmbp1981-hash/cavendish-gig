import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notificarNovoDocumento } from './useNotificacoesEmail';
import { useUploadToDrive } from './useGoogleDrive';

const sb = supabase;

interface Documento {
  id: string;
  organizacao_id: string | null;
  projeto_id: string | null;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  tamanho_bytes: number | null;
  url: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UploadParams {
  file: File;
  documentoRequeridoId: string;
  projetoId: string;
  organizacaoId: string;
  nomeDocumento: string;
}

async function buscarEmailsConsultores(): Promise<string[]> {
  try {
    // Buscar usuários com role de consultor ou admin
    const { data: roles, error } = await sb
      .from('user_roles')
      .select(`
        user_id,
        role
      `)
      .in('role', ['consultor', 'admin']);

    if (error || !roles) {
      console.error('Erro ao buscar roles:', error);
      return [];
    }

    const userIds = roles.map(r => r.user_id);
    
    if (userIds.length === 0) return [];

    // Buscar emails dos consultores/admins
    const { data: profiles, error: profileError } = await sb
      .from('profiles')
      .select('email')
      .in('id', userIds);

    if (profileError || !profiles) {
      console.error('Erro ao buscar profiles:', profileError);
      return [];
    }

    return profiles.filter(p => p.email).map(p => p.email as string);
  } catch (error) {
    console.error('Erro ao buscar emails de consultores:', error);
    return [];
  }
}

async function buscarNomeOrganizacao(organizacaoId: string): Promise<string> {
  try {
    const { data, error } = await sb
      .from('organizacoes')
      .select('nome')
      .eq('id', organizacaoId)
      .single();

    if (error || !data) return 'Organização';
    return data.nome;
  } catch {
    return 'Organização';
  }
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentoRequeridoId,
      projetoId,
      organizacaoId,
      nomeDocumento
    }: UploadParams): Promise<Documento> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizacaoId}/${projetoId}/${documentoRequeridoId}/${Date.now()}.${fileExt}`;

      // Upload do arquivo para o Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública do Supabase
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      // Criar registro na tabela documentos
      const { data: documento, error: docError } = await sb
        .from('documentos')
        .insert({
          organizacao_id: organizacaoId,
          projeto_id: projetoId,
          nome: nomeDocumento,
          url: urlData.publicUrl,
          storage_path: fileName,
          tipo: file.type,
          tamanho_bytes: file.size,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (docError) throw docError;
      if (!documento) throw new Error('Falha ao criar documento');

      // Upload para Google Drive em background (não bloqueia o fluxo principal)
      uploadToGoogleDriveBackground(file, organizacaoId, documento.id);

      // Atualizar ou criar status do documento requerido
      const { error: statusError } = await sb
        .from('documentos_requeridos_status')
        .upsert({
          documento_requerido_id: documentoRequeridoId,
          documento_id: documento.id,
          status: 'enviado'
        }, {
          onConflict: 'documento_requerido_id'
        });

      if (statusError) throw statusError;

      // Notificar consultores em background
      Promise.all([
        buscarEmailsConsultores(),
        buscarNomeOrganizacao(organizacaoId)
      ]).then(async ([emails, orgNome]) => {
        if (emails.length > 0) {
          console.log('Notificando consultores sobre novo documento:', emails);
          for (const email of emails) {
            await notificarNovoDocumento(email, nomeDocumento, orgNome);
          }
        }
      }).catch(err => {
        console.error('Erro ao notificar consultores:', err);
      });

      return documento as Documento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-requeridos'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-pendentes'] });
    }
  });
}

async function uploadToGoogleDriveBackground(file: File, organizacaoId: string, documentoId: string) {
  try {
    // Check if Drive is enabled
    const { data: settings } = await sb
      .from('system_settings')
      .select('value')
      .eq('key', 'google_drive_enabled')
      .single();

    if (settings?.value !== 'true') {
      console.log('Google Drive integration is disabled, skipping Drive upload');
      return;
    }

    // Get the organization's Drive folder structure
    const { data: org } = await sb
      .from('organizacoes')
      .select('drive_folder_id')
      .eq('id', organizacaoId)
      .single();

    if (!org?.drive_folder_id) {
      console.warn('Organization does not have a Google Drive folder configured');
      return;
    }

    // Get list of subfolders to find the "01 - Documentos Recebidos" folder
    const { data: listResult, error: listError } = await supabase.functions.invoke('google-drive', {
      body: {
        action: 'listFolders',
        parentFolderId: org.drive_folder_id,
      },
    });

    if (listError) {
      console.error('Error listing Drive folders:', listError);
      return;
    }

    const targetFolderObj = listResult?.data?.find(
      (folder: { name: string; id: string }) => folder.name === '01 - Documentos Recebidos'
    );

    if (!targetFolderObj) {
      console.warn('Target folder "01 - Documentos Recebidos" not found in organization Drive');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:mime;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    const fileData = await base64Promise;

    // Upload file to Drive
    const { data, error } = await supabase.functions.invoke('google-drive', {
      body: {
        action: 'uploadFile',
        fileName: file.name,
        fileData,
        mimeType: file.type,
        parentFolderId: targetFolderObj.id,
      },
    });

    if (error) {
      console.error('Error uploading to Google Drive:', error);
    } else {
      console.log('File successfully uploaded to Google Drive');

      // Update documento with drive_file_id
      if (data?.success && data?.data?.id) {
        await sb
          .from('documentos')
          .update({ drive_file_id: data.data.id })
          .eq('id', documentoId);

        console.log('Document updated with drive_file_id:', data.data.id);
      }
    }
  } catch (error) {
    console.error('Error in Google Drive upload background task:', error);
  }
}
