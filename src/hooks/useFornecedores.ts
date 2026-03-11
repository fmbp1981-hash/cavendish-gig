import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export type FornecedorCategoria = "ti" | "servicos" | "logistica" | "financeiro" | "saude" | "outro";
export type FornecedorStatus = "ativo" | "inativo" | "bloqueado";
export type NivelCriticidade = "baixo" | "medio" | "alto" | "critico";

export interface Fornecedor {
  id: string;
  organizacao_id: string;
  nome: string;
  cnpj: string | null;
  categoria: FornecedorCategoria | null;
  nivel_criticidade: NivelCriticidade;
  website: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  status: FornecedorStatus;
  score_risco_atual: number | null;
  proxima_avaliacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface DDPergunta {
  id: string;
  categoria: string;
  pergunta: string;
  peso: number;
  ativo: boolean;
}

export interface DueDiligence {
  id: string;
  fornecedor_id: string | null;
  organization_id: string;
  respostas: Record<string, boolean> | null;
  score_calculado: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CATEGORIA_LABEL: Record<FornecedorCategoria, string> = {
  ti:          "Tecnologia",
  servicos:    "Serviços",
  logistica:   "Logística",
  financeiro:  "Financeiro",
  saude:       "Saúde",
  outro:       "Outro",
};

export const CRITICIDADE_LABEL: Record<NivelCriticidade, string> = {
  baixo:   "Baixo",
  medio:   "Médio",
  alto:    "Alto",
  critico: "Crítico",
};

export const CRITICIDADE_COR: Record<NivelCriticidade, string> = {
  baixo:   "bg-green-100 text-green-800 border-green-300",
  medio:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  alto:    "bg-orange-100 text-orange-800 border-orange-300",
  critico: "bg-red-100 text-red-800 border-red-300",
};

export const SCORE_COR = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};

export function scoreToNivel(score: number): NivelCriticidade {
  if (score >= 80) return "baixo";
  if (score >= 60) return "medio";
  if (score >= 40) return "alto";
  return "critico";
}

// ─── Fornecedores ─────────────────────────────────────────────────────────────

export function useFornecedores(organizacaoId?: string) {
  return useQuery({
    queryKey: ["fornecedores", organizacaoId],
    queryFn: async () => {
      let q = db.from("fornecedores").select("*").order("nome", { ascending: true });
      if (organizacaoId) q = q.eq("organizacao_id", organizacaoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Fornecedor[];
    },
  });
}

export function useCriarFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      organizacao_id: string;
      nome: string;
      cnpj?: string;
      categoria?: FornecedorCategoria;
      nivel_criticidade?: NivelCriticidade;
      website?: string;
      contato_nome?: string;
      contato_email?: string;
    }) => {
      const { data, error } = await db.from("fornecedores").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar fornecedor"),
  });
}

export function useAtualizarFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Fornecedor> & { id: string }) => {
      const { error } = await db.from("fornecedores").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar fornecedor"),
  });
}

export function useExcluirFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor removido.");
    },
    onError: () => toast.error("Erro ao remover fornecedor"),
  });
}

// ─── Perguntas de Due Diligence ───────────────────────────────────────────────

export function useDDPerguntas() {
  return useQuery({
    queryKey: ["dd-perguntas"],
    queryFn: async () => {
      const { data, error } = await db
        .from("due_diligence_perguntas")
        .select("*")
        .eq("ativo", true)
        .order("categoria", { ascending: true });
      if (error) throw error;
      return data as DDPergunta[];
    },
    staleTime: 10 * 60 * 1000, // 10 min — dados estáticos
  });
}

// ─── Due Diligence ────────────────────────────────────────────────────────────

export function useDueDiligenceFornecedor(fornecedorId: string) {
  return useQuery({
    queryKey: ["due-diligence-fornecedor", fornecedorId],
    queryFn: async () => {
      const { data } = await db
        .from("due_diligence")
        .select("*")
        .eq("fornecedor_id", fornecedorId)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as DueDiligence[];
    },
    enabled: !!fornecedorId,
  });
}

export function useFinalizarDueDiligence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fornecedorId,
      organizacaoId,
      respostas,
      perguntas,
    }: {
      fornecedorId: string;
      organizacaoId: string;
      respostas: Record<string, boolean>;
      perguntas: DDPergunta[];
    }) => {
      // Calcular score: soma dos pesos das perguntas respondidas SIM / soma total de pesos
      const totalPeso = perguntas.reduce((s, p) => s + p.peso, 0);
      const pesoPontuado = perguntas
        .filter(p => respostas[p.id] === true)
        .reduce((s, p) => s + p.peso, 0);
      const score = totalPeso > 0 ? Math.round((pesoPontuado / totalPeso) * 100) : 0;

      // Salvar avaliação
      const { error: ddError } = await db.from("due_diligence").insert({
        organization_id: organizacaoId,
        fornecedor_id: fornecedorId,
        respostas,
        score_calculado: score,
        status: "concluido",
      });
      if (ddError) throw ddError;

      // Atualizar score e próxima avaliação no fornecedor
      const proximaAvaliacao = new Date();
      proximaAvaliacao.setFullYear(proximaAvaliacao.getFullYear() + 1);
      await db.from("fornecedores").update({
        score_risco_atual: score,
        proxima_avaliacao: proximaAvaliacao.toISOString().split("T")[0],
        nivel_criticidade: scoreToNivel(score),
      }).eq("id", fornecedorId);

      return score;
    },
    onSuccess: (score, vars) => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      queryClient.invalidateQueries({ queryKey: ["due-diligence-fornecedor", vars.fornecedorId] });
      toast.success(`Due diligence concluída! Score: ${score}/100`);
    },
    onError: () => toast.error("Erro ao finalizar due diligence"),
  });
}
