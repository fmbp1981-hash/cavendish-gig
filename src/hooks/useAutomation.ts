import { supabase } from "@/integrations/supabase/client";

interface ReminderResponse {
  success: boolean;
  organizationsWithPending?: number;
  totalPendingDocuments?: number;
  emailsSent?: number;
  error?: string;
}

// Manually trigger document reminders
export const dispararLembretesDocumentos = async (): Promise<ReminderResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("document-reminders");

    if (error) {
      console.error("Error triggering reminders:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      organizationsWithPending: data?.organizationsWithPending,
      totalPendingDocuments: data?.totalPendingDocuments,
      emailsSent: data?.emailsSent,
    };
  } catch (error: any) {
    console.error("Error invoking document-reminders function:", error);
    return { success: false, error: error.message };
  }
};

// Process a Fireflies transcription webhook
export const processarTranscricao = async (
  meetingId: string,
  title: string,
  dateTime: string,
  duration: number,
  transcript?: string,
  summary?: string,
  attendees?: string[],
  actionItems?: string[]
): Promise<{ success: boolean; minutes?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("process-transcription", {
      body: {
        meetingId,
        title,
        dateTime,
        duration,
        transcript,
        summary,
        attendees,
        actionItems,
      },
    });

    if (error) {
      console.error("Error processing transcription:", error);
      return { success: false, error: error.message };
    }

    return { success: true, minutes: data?.minutes };
  } catch (error: any) {
    console.error("Error invoking process-transcription function:", error);
    return { success: false, error: error.message };
  }
};
