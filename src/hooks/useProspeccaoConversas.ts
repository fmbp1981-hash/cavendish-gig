import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProspeccaoConversa } from "@/types/prospeccao";

const db = supabase as any;

export function useConversasDoLead(leadId?: string) {
  return useQuery({
    queryKey: ["prospeccao_conversas", leadId],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospeccao_conversas")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ProspeccaoConversa[];
    },
    enabled: !!leadId,
  });
}

interface EnviarMensagemInput {
  leadId: string;
  telefone: string;
  mensagem: string;
}

/** Envia manualmente via WhatsApp — só funciona depois que um provedor (Evolution API ou
 * WhatsApp Cloud API oficial) estiver configurado em Admin → Integrações. */
export function useEnviarMensagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, telefone, mensagem }: EnviarMensagemInput) => {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { telefone, mensagem, leadId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_conversas", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
    },
    onError: (err: Error) => toast.error("Erro ao enviar mensagem", { description: err.message }),
  });
}

/** Aciona o agente de IA manualmente pra este lead (útil pra testar o orquestrador antes de ter
 * WhatsApp configurado, ou pra forçar uma nova resposta). */
export function useAcionarAgente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.functions.invoke("prospeccao-agent", { body: { leadId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; texto: string | null; transferido: boolean };
    },
    onSuccess: (data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_conversas", leadId] });
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      if (data.transferido) toast.info("Lead transferido para atendimento humano");
      else if (data.texto) toast.success("Agente respondeu");
    },
    onError: (err: Error) => toast.error("Erro ao acionar o agente", { description: err.message }),
  });
}
