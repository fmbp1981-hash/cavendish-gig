import { supabase } from "@/integrations/supabase/client";

interface EmailData {
  documentoNome?: string;
  organizacaoNome?: string;
  observacao?: string;
  userName?: string;
  pendingCount?: number;
}

type EmailType = "documento_aprovado" | "documento_rejeitado" | "documento_enviado" | "lembrete_documentos";

export const enviarEmailNotificacao = async (
  type: EmailType,
  to: string,
  data: EmailData
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: response, error } = await supabase.functions.invoke("send-email", {
      body: { type, to, data },
    });

    if (error) {
      console.error("Error invoking send-email function:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending email notification:", error);
    return { success: false, error: error.message };
  }
};

export const notificarDocumentoAprovado = async (
  email: string,
  documentoNome: string,
  userName?: string
) => {
  return enviarEmailNotificacao("documento_aprovado", email, {
    documentoNome,
    userName,
  });
};

export const notificarDocumentoRejeitado = async (
  email: string,
  documentoNome: string,
  observacao?: string,
  userName?: string
) => {
  return enviarEmailNotificacao("documento_rejeitado", email, {
    documentoNome,
    observacao,
    userName,
  });
};

export const notificarNovoDocumento = async (
  email: string,
  documentoNome: string,
  organizacaoNome: string
) => {
  return enviarEmailNotificacao("documento_enviado", email, {
    documentoNome,
    organizacaoNome,
  });
};

export const notificarLembreteDocumentos = async (
  email: string,
  pendingCount: number,
  userName?: string
) => {
  return enviarEmailNotificacao("lembrete_documentos", email, {
    pendingCount,
    userName,
  });
};
