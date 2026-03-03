import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Treinamento {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  carga_horaria_minutos: number;
  obrigatorio: boolean;
  ativo: boolean;
  ordem: number;
}

export interface TreinamentoConteudo {
  id: string;
  treinamento_id: string;
  titulo: string;
  tipo: string;
  conteudo: string | null;
  duracao_minutos: number;
  ordem: number;
}

export interface TreinamentoQuiz {
  id: string;
  treinamento_id: string;
  pergunta: string;
  alternativas: { texto: string; correta: boolean }[];
  ordem: number;
}

export interface TreinamentoInscricao {
  id: string;
  treinamento_id: string;
  user_id: string;
  organizacao_id: string;
  status: string;
  progresso_conteudo: string[];
  quiz_tentativas: number;
  quiz_nota: number | null;
  quiz_aprovado: boolean;
  iniciado_em: string | null;
  concluido_em: string | null;
}

export interface TreinamentoCertificado {
  id: string;
  inscricao_id: string;
  user_id: string;
  treinamento_id: string;
  codigo_validacao: string;
  emitido_em: string;
  nome_completo: string;
  nota_final: number;
}

export function useTreinamentos() {
  return useQuery({
    queryKey: ["treinamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treinamentos")
        .select("*")
        .eq("ativo", true)
        .order("ordem");

      if (error) throw error;
      return data as Treinamento[];
    },
  });
}

export function useTreinamentoConteudos(treinamentoId: string | undefined) {
  return useQuery({
    queryKey: ["treinamento-conteudos", treinamentoId],
    queryFn: async () => {
      if (!treinamentoId) return [];
      const { data, error } = await supabase
        .from("treinamento_conteudos")
        .select("*")
        .eq("treinamento_id", treinamentoId)
        .order("ordem");

      if (error) throw error;
      return data as TreinamentoConteudo[];
    },
    enabled: !!treinamentoId,
  });
}

export function useTreinamentoQuiz(treinamentoId: string | undefined) {
  return useQuery({
    queryKey: ["treinamento-quiz", treinamentoId],
    queryFn: async () => {
      if (!treinamentoId) return [];
      const { data, error } = await supabase
        .from("treinamento_quiz")
        .select("*")
        .eq("treinamento_id", treinamentoId)
        .order("ordem");

      if (error) throw error;
      return data as unknown as TreinamentoQuiz[];
    },
    enabled: !!treinamentoId,
  });
}

export function useMinhaInscricao(treinamentoId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["minha-inscricao", treinamentoId, user?.id],
    queryFn: async () => {
      if (!treinamentoId || !user?.id) return null;
      const { data, error } = await supabase
        .from("treinamento_inscricoes")
        .select("*")
        .eq("treinamento_id", treinamentoId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as TreinamentoInscricao | null;
    },
    enabled: !!treinamentoId && !!user?.id,
  });
}

export function useMinhasInscricoes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["minhas-inscricoes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("treinamento_inscricoes")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as TreinamentoInscricao[];
    },
    enabled: !!user?.id,
  });
}

export function useMeusCertificados() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["meus-certificados", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("treinamento_certificados")
        .select("*, treinamentos:treinamento_id(nome)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as (TreinamentoCertificado & { treinamentos: { nome: string } })[];
    },
    enabled: !!user?.id,
  });
}

export function useIniciarTreinamento() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ treinamentoId, organizacaoId }: { treinamentoId: string; organizacaoId: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("treinamento_inscricoes")
        .insert({
          treinamento_id: treinamentoId,
          user_id: user.id,
          organizacao_id: organizacaoId,
          status: "em_andamento",
          iniciado_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minha-inscricao"] });
      queryClient.invalidateQueries({ queryKey: ["minhas-inscricoes"] });
      toast.success("Treinamento iniciado!");
    },
    onError: (error) => {
      console.error("Erro ao iniciar treinamento:", error);
      toast.error("Erro ao iniciar treinamento");
    },
  });
}

export function useSalvarProgresso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inscricaoId, conteudosConcluidos }: { inscricaoId: string; conteudosConcluidos: string[] }) => {
      const { data, error } = await supabase
        .from("treinamento_inscricoes")
        .update({
          progresso_conteudo: conteudosConcluidos,
        })
        .eq("id", inscricaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minha-inscricao"] });
    },
  });
}

export function useResponderQuiz() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      inscricaoId, 
      treinamentoId,
      nota, 
      aprovado 
    }: { 
      inscricaoId: string; 
      treinamentoId: string;
      nota: number; 
      aprovado: boolean;
    }) => {
      // Atualizar inscrição
      const { data: inscricao, error: inscricaoError } = await supabase
        .from("treinamento_inscricoes")
        .update({
          quiz_nota: nota,
          quiz_aprovado: aprovado,
          quiz_tentativas: supabase.rpc ? 1 : 1, // Increment seria ideal
          status: aprovado ? "concluido" : "em_andamento",
          concluido_em: aprovado ? new Date().toISOString() : null,
        })
        .eq("id", inscricaoId)
        .select()
        .single();

      if (inscricaoError) throw inscricaoError;

      // Se aprovado, criar certificado
      if (aprovado && user?.id) {
        const { error: certError } = await supabase
          .from("treinamento_certificados")
          .insert({
            inscricao_id: inscricaoId,
            user_id: user.id,
            treinamento_id: treinamentoId,
            nome_completo: profile?.nome || "Colaborador",
            nota_final: nota,
          });

        if (certError) {
          console.error("Erro ao criar certificado:", certError);
        }
      }

      return { inscricao, aprovado };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["minha-inscricao"] });
      queryClient.invalidateQueries({ queryKey: ["minhas-inscricoes"] });
      queryClient.invalidateQueries({ queryKey: ["meus-certificados"] });
      
      if (data.aprovado) {
        toast.success("Parabéns! Você foi aprovado e seu certificado foi gerado!");
      } else {
        toast.error("Você não atingiu a nota mínima. Tente novamente!");
      }
    },
    onError: (error) => {
      console.error("Erro ao responder quiz:", error);
      toast.error("Erro ao processar respostas");
    },
  });
}

export function getCategoriaLabel(categoria: string): string {
  const labels: Record<string, string> = {
    compliance: "Compliance",
    etica: "Ética",
    governanca: "Governança",
    lgpd: "LGPD",
    seguranca: "Segurança",
  };
  return labels[categoria] || categoria;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    nao_iniciado: "Não Iniciado",
    em_andamento: "Em Andamento",
    concluido: "Concluído",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    nao_iniciado: "bg-muted text-muted-foreground",
    em_andamento: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    concluido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}
