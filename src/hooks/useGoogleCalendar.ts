import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  location?: string;
  timeZone?: string;
}

interface GoogleCalendarEvent {
  id?: string;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { uri: string }[] };
  [key: string]: unknown;
}

interface CalendarResponse {
  success: boolean;
  data?: GoogleCalendarEvent | GoogleCalendarEvent[];
  error?: string;
}

export const criarEventoCalendario = async (
  event: CalendarEvent
): Promise<CalendarResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("google-calendar", {
      body: { action: "create", event },
    });

    if (error) {
      console.error("Error creating calendar event:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.data };
  } catch (error: unknown) {
    console.error("Error invoking google-calendar function:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const listarEventosCalendario = async (): Promise<CalendarResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("google-calendar", {
      body: { action: "list" },
    });

    if (error) {
      console.error("Error listing calendar events:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.data };
  } catch (error: unknown) {
    console.error("Error invoking google-calendar function:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const deletarEventoCalendario = async (
  eventId: string
): Promise<CalendarResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("google-calendar", {
      body: { action: "delete", eventId },
    });

    if (error) {
      console.error("Error deleting calendar event:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.data };
  } catch (error: unknown) {
    console.error("Error invoking google-calendar function:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Helper function to create a kickoff meeting
export const agendarReuniaoKickoff = async (
  organizacaoNome: string,
  dataHora: Date,
  participantes: string[],
  duracao: number = 60 // minutes
): Promise<CalendarResponse> => {
  const endDateTime = new Date(dataHora.getTime() + duracao * 60000);

  return criarEventoCalendario({
    summary: `Reunião de Kickoff - ${organizacaoNome}`,
    description: `Reunião de kickoff do projeto de Governança, Integridade e Gestão Estratégica.

Agenda:
1. Apresentação da equipe
2. Alinhamento de expectativas
3. Cronograma do projeto
4. Próximos passos

Este é um link para a videoconferência gerado automaticamente.`,
    startDateTime: dataHora.toISOString(),
    endDateTime: endDateTime.toISOString(),
    attendees: participantes,
    timeZone: "America/Sao_Paulo",
  });
};

// Helper function to create a follow-up meeting
export const agendarReuniaoAcompanhamento = async (
  organizacaoNome: string,
  dataHora: Date,
  participantes: string[],
  fase: string,
  duracao: number = 45 // minutes
): Promise<CalendarResponse> => {
  const endDateTime = new Date(dataHora.getTime() + duracao * 60000);

  return criarEventoCalendario({
    summary: `Acompanhamento ${fase} - ${organizacaoNome}`,
    description: `Reunião de acompanhamento da fase de ${fase}.

Pauta:
1. Status das entregas
2. Documentos pendentes
3. Próximos passos
4. Dúvidas e suporte

Este é um link para a videoconferência gerado automaticamente.`,
    startDateTime: dataHora.toISOString(),
    endDateTime: endDateTime.toISOString(),
    attendees: participantes,
    timeZone: "America/Sao_Paulo",
  });
};
