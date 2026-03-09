import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RelatorioEnvio {
  id: string;
  organizacao_id: string;
  organizacao_nome?: string;
  mes_referencia: number;
  ano_referencia: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  email_destinatario: string;
  assunto: string;
  total_documentos?: number;
  documentos_aprovados?: number;
  documentos_pendentes?: number;
  total_tarefas?: number;
  tarefas_concluidas?: number;
  progresso_projeto?: number;
  tentativas: number;
  ultimo_erro?: string | null;
  enviado_em?: string | null;
  created_at: string;
}

export function useRelatorioEnvios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sb = supabase;

  /**
   * Query: Buscar histórico de envios
   */
  const {
    data: relatorios,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["relatorio-envios"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("relatorio_envios_recentes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as RelatorioEnvio[];
    },
  });

  /**
   * Query: Buscar envios por organização
   */
  const getEnviosPorOrganizacao = async (organizacaoId: string) => {
    const { data, error } = await sb
      .from("relatorio_envios")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar envios:", error);
      return [];
    }

    return data as RelatorioEnvio[];
  };

  /**
   * Mutation: Invocar Edge Function manualmente
   */
  const { mutate: enviarRelatoriosManual, isPending: isEnviando } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "send-monthly-reports",
        { body: {} }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["relatorio-envios"] });

      toast({
        title: "✅ Envio concluído",
        description: `${data.enviados} relatórios enviados com sucesso. ${data.falhas} falhas.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar relatórios",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Helper: Formatar status
   */
  const formatarStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      sending: "Enviando...",
      sent: "Enviado",
      failed: "Falhou",
    };
    return statusMap[status] || status;
  };

  /**
   * Helper: Cor do badge por status
   */
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      sending: "bg-blue-100 text-blue-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  /**
   * Helper: Formatar mês/ano
   */
  const formatarPeriodo = (mes: number, ano: number): string => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[mes - 1]}/${ano}`;
  };

  /**
   * Helper: Estatísticas gerais
   */
  const getEstatisticas = () => {
    if (!relatorios) return null;

    const total = relatorios.length;
    const enviados = relatorios.filter(r => r.status === 'sent').length;
    const pendentes = relatorios.filter(r => r.status === 'pending').length;
    const falhas = relatorios.filter(r => r.status === 'failed').length;
    const taxaSucesso = total > 0 ? (enviados / total) * 100 : 0;

    return {
      total,
      enviados,
      pendentes,
      falhas,
      taxaSucesso: taxaSucesso.toFixed(1),
    };
  };

  return {
    // Dados
    relatorios,
    error,

    // Estados
    isLoading,
    isEnviando,

    // Ações
    enviarRelatoriosManual,
    getEnviosPorOrganizacao,
    refetch,

    // Helpers
    formatarStatus,
    getStatusColor,
    formatarPeriodo,
    getEstatisticas,
  };
}
