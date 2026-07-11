import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;

/** Status da reunião de fechamento vinculada ao lead — usado pra saber se o Gate de conversão
 * em organização já está liberado (reunioes.status === 'realizada'). */
export function useReuniaoFechamentoStatus(reuniaoId?: string | null) {
  return useQuery({
    queryKey: ["reuniao_fechamento_status", reuniaoId],
    queryFn: async () => {
      const { data, error } = await db.from("reunioes").select("status").eq("id", reuniaoId).maybeSingle();
      if (error) throw error;
      return data as { status: string } | null;
    },
    enabled: !!reuniaoId,
  });
}

interface ConversaoResultado {
  success: boolean;
  organizacaoId?: string;
}

interface ConverterOrganizacaoInput {
  leadId: string;
  nomeOrganizacao?: string;
  cnpj?: string;
  contatoNome?: string;
  contatoEmail?: string;
}

interface ConverterParceiroInput {
  leadId: string;
  contatoNome?: string;
  contatoEmail?: string;
}

async function chamarConversao(body: Record<string, unknown>): Promise<ConversaoResultado> {
  const { data, error } = await supabase.functions.invoke("prospeccao-converter-lead", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as ConversaoResultado;
}

/** Confirma que a reunião de fechamento aconteceu — pré-requisito (Gate) pra conversão em
 * organização, mas não pra conversão em parceiro. */
export function useMarcarReuniaoRealizada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => chamarConversao({ leadId, action: "marcar_reuniao_realizada" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      toast.success("Reunião marcada como realizada");
    },
    onError: (err: Error) => toast.error("Erro ao marcar reunião como realizada", { description: err.message }),
  });
}

export function useConverterLeadOrganizacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConverterOrganizacaoInput) => chamarConversao({ ...input, action: "converter_organizacao" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      queryClient.invalidateQueries({ queryKey: ["organizacoes"] });
      toast.success("Lead convertido em organização");
    },
    onError: (err: Error) => toast.error("Erro ao converter lead", { description: err.message }),
  });
}

export function useConverterLeadParceiro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConverterParceiroInput) => chamarConversao({ ...input, action: "converter_parceiro" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      toast.success("Lead convertido em parceiro");
    },
    onError: (err: Error) => toast.error("Erro ao converter lead", { description: err.message }),
  });
}
