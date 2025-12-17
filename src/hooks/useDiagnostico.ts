import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiagnosticoPergunta {
  id: string;
  dimensao: string;
  ordem: number;
  pergunta: string;
  descricao: string | null;
}

export interface Diagnostico {
  id: string;
  projeto_id: string;
  organizacao_id: string;
  status: string;
  etapa_atual: number;
  score_estrutura_societaria: number | null;
  score_governanca: number | null;
  score_compliance: number | null;
  score_gestao: number | null;
  score_planejamento: number | null;
  score_geral: number | null;
  nivel_maturidade: string | null;
  pontos_fortes: string[] | null;
  pontos_atencao: string[] | null;
  concluido_em: string | null;
  created_at: string;
}

export interface DiagnosticoResposta {
  id: string;
  diagnostico_id: string;
  pergunta_id: string;
  resposta: string;
  valor: number;
}

const DIMENSOES = [
  { key: 'estrutura_societaria', label: 'Estrutura Societária', etapa: 1 },
  { key: 'governanca', label: 'Governança', etapa: 2 },
  { key: 'compliance', label: 'Compliance', etapa: 3 },
  { key: 'gestao', label: 'Gestão', etapa: 4 },
  { key: 'planejamento', label: 'Planejamento', etapa: 5 },
];

export const getDimensoes = () => DIMENSOES;

export const getNivelMaturidadeLabel = (nivel: string | null) => {
  const labels: Record<string, string> = {
    inexistente: 'Inexistente (0-20%)',
    inicial: 'Inicial (21-40%)',
    basico: 'Básico (41-60%)',
    intermediario: 'Intermediário (61-75%)',
    avancado: 'Avançado (76-90%)',
    excelencia: 'Excelência (91-100%)',
  };
  return nivel ? labels[nivel] || nivel : 'Não avaliado';
};

export const getNivelMaturidadeColor = (nivel: string | null) => {
  const colors: Record<string, string> = {
    inexistente: 'text-destructive',
    inicial: 'text-orange-500',
    basico: 'text-yellow-500',
    intermediario: 'text-blue-500',
    avancado: 'text-green-500',
    excelencia: 'text-emerald-600',
  };
  return nivel ? colors[nivel] || 'text-muted-foreground' : 'text-muted-foreground';
};

export function usePerguntas() {
  return useQuery({
    queryKey: ["diagnostico-perguntas"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("diagnostico_perguntas" as any) as any)
        .select("*")
        .order("dimensao")
        .order("ordem");

      if (error) throw error;
      return data as DiagnosticoPergunta[];
    },
  });
}

export function useDiagnostico(projetoId: string | undefined) {
  return useQuery({
    queryKey: ["diagnostico", projetoId],
    queryFn: async () => {
      if (!projetoId) return null;
      
      const { data, error } = await (supabase
        .from("diagnosticos" as any) as any)
        .select("*")
        .eq("projeto_id", projetoId)
        .maybeSingle();

      if (error) throw error;
      return data as Diagnostico | null;
    },
    enabled: !!projetoId,
  });
}

export function useRespostas(diagnosticoId: string | undefined) {
  return useQuery({
    queryKey: ["diagnostico-respostas", diagnosticoId],
    queryFn: async () => {
      if (!diagnosticoId) return [];
      
      const { data, error } = await (supabase
        .from("diagnostico_respostas" as any) as any)
        .select("*")
        .eq("diagnostico_id", diagnosticoId);

      if (error) throw error;
      return data as DiagnosticoResposta[];
    },
    enabled: !!diagnosticoId,
  });
}

export function useIniciarDiagnostico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projetoId, organizacaoId }: { projetoId: string; organizacaoId: string }) => {
      const { data, error } = await (supabase
        .from("diagnosticos" as any) as any)
        .insert({
          projeto_id: projetoId,
          organizacao_id: organizacaoId,
          status: 'em_andamento',
          etapa_atual: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["diagnostico", variables.projetoId] });
      toast.success("Diagnóstico iniciado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao iniciar diagnóstico", { description: error.message });
    },
  });
}

export function useSalvarRespostas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      diagnosticoId, 
      respostas,
      proximaEtapa 
    }: { 
      diagnosticoId: string; 
      respostas: { pergunta_id: string; resposta: string; valor: number }[];
      proximaEtapa: number;
    }) => {
      // Delete existing answers for these questions
      const perguntaIds = respostas.map(r => r.pergunta_id);
      await (supabase
        .from("diagnostico_respostas" as any) as any)
        .delete()
        .eq("diagnostico_id", diagnosticoId)
        .in("pergunta_id", perguntaIds);

      // Insert new answers
      const { error: insertError } = await (supabase
        .from("diagnostico_respostas" as any) as any)
        .insert(respostas.map(r => ({
          diagnostico_id: diagnosticoId,
          pergunta_id: r.pergunta_id,
          resposta: r.resposta,
          valor: r.valor,
        })));

      if (insertError) throw insertError;

      // Update etapa atual
      const { error: updateError } = await (supabase
        .from("diagnosticos" as any) as any)
        .update({ etapa_atual: proximaEtapa })
        .eq("id", diagnosticoId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["diagnostico-respostas", variables.diagnosticoId] });
      queryClient.invalidateQueries({ queryKey: ["diagnostico"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar respostas", { description: error.message });
    },
  });
}

export function useFinalizarDiagnostico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diagnosticoId: string) => {
      const { data, error } = await (supabase.rpc as any)('calcular_scores_diagnostico', {
        p_diagnostico_id: diagnosticoId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostico"] });
      toast.success("Diagnóstico concluído!", {
        description: "Seus resultados estão disponíveis."
      });
    },
    onError: (error: any) => {
      toast.error("Erro ao finalizar diagnóstico", { description: error.message });
    },
  });
}
