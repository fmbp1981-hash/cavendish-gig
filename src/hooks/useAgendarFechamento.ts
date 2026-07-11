import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgendarFechamentoResultado {
  success: boolean;
  noSlot?: boolean;
  message?: string;
  reuniaoId?: string;
  dataInicio?: string;
  meetLink?: string | null;
}

/** Dispara o agendamento automático da reunião de fechamento com o Alberto (Fase 6). Sucesso e
 * "sem slot disponível" são ambos outcomes esperados (ver prospeccao-agendar-fechamento) — só
 * erros de fato (rede, Google Calendar fora do ar, etc.) caem em onError. */
export function useAgendarFechamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke("prospeccao-agendar-fechamento", { body: { leadId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AgendarFechamentoResultado;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      if (data.noSlot) {
        toast.info("Sem horário disponível", { description: data.message });
      } else {
        const dataFormatada = data.dataInicio
          ? new Date(data.dataInicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" })
          : "";
        toast.success("Reunião de fechamento agendada", { description: dataFormatada });
      }
    },
    onError: (err: Error) => toast.error("Erro ao agendar reunião", { description: err.message }),
  });
}
