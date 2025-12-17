import { supabase } from "@/integrations/supabase/client";

interface WhatsAppResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export const enviarSMS = async (
  telefone: string,
  mensagem: string
): Promise<WhatsAppResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { type: "sms", to: telefone, message: mensagem },
    });

    if (error) {
      console.error("Error sending SMS:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageSid: data?.messageSid };
  } catch (error: any) {
    console.error("Error invoking send-whatsapp function:", error);
    return { success: false, error: error.message };
  }
};

export const enviarWhatsApp = async (
  telefone: string,
  mensagem: string
): Promise<WhatsAppResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { type: "whatsapp", to: telefone, message: mensagem },
    });

    if (error) {
      console.error("Error sending WhatsApp:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageSid: data?.messageSid };
  } catch (error: any) {
    console.error("Error invoking send-whatsapp function:", error);
    return { success: false, error: error.message };
  }
};

// Pre-built message templates
export const notificarDocumentoPendenteWhatsApp = async (
  telefone: string,
  documentoNome: string,
  userName?: string
): Promise<WhatsAppResponse> => {
  const mensagem = `Olá${userName ? ` ${userName}` : ''}! 📋

O documento "${documentoNome}" ainda está pendente de envio no sistema Cavendish GIG.

Por favor, acesse o sistema para enviar o documento necessário.

Atenciosamente,
Equipe Cavendish GIG`;

  return enviarWhatsApp(telefone, mensagem);
};

export const notificarAprovacaoWhatsApp = async (
  telefone: string,
  documentoNome: string,
  userName?: string
): Promise<WhatsAppResponse> => {
  const mensagem = `Olá${userName ? ` ${userName}` : ''}! ✅

Ótimas notícias! O documento "${documentoNome}" foi aprovado pela nossa equipe.

Continue enviando os documentos pendentes para avançar no projeto.

Atenciosamente,
Equipe Cavendish GIG`;

  return enviarWhatsApp(telefone, mensagem);
};

export const notificarRejeicaoWhatsApp = async (
  telefone: string,
  documentoNome: string,
  motivo: string,
  userName?: string
): Promise<WhatsAppResponse> => {
  const mensagem = `Olá${userName ? ` ${userName}` : ''}! ⚠️

O documento "${documentoNome}" precisa de ajustes.

Motivo: ${motivo}

Por favor, corrija e envie novamente.

Atenciosamente,
Equipe Cavendish GIG`;

  return enviarWhatsApp(telefone, mensagem);
};
