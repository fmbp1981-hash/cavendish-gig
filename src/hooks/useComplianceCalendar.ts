import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addMonths, addQuarters, addYears, format, isBefore, parseISO } from "date-fns";

const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Periodicidade = "unica" | "mensal" | "trimestral" | "semestral" | "anual";
export type ObrigacaoStatus = "pendente" | "em_andamento" | "concluida" | "atrasada";

export interface ComplianceObrigacao {
  id: string;
  organizacao_id: string | null;
  titulo: string;
  descricao: string | null;
  lei_referencia: string | null;
  orgao_regulador: string | null;
  periodicidade: Periodicidade;
  mes_vencimento: number | null;
  dia_vencimento: number | null;
  proxima_data: string;
  status: ObrigacaoStatus;
  responsavel_id: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<ObrigacaoStatus, string> = {
  pendente:     "Pendente",
  em_andamento: "Em andamento",
  concluida:    "Concluída",
  atrasada:     "Atrasada",
};

export const STATUS_COR: Record<ObrigacaoStatus, string> = {
  pendente:     "bg-slate-100 text-slate-700 border-slate-300",
  em_andamento: "bg-blue-100 text-blue-700 border-blue-300",
  concluida:    "bg-green-100 text-green-700 border-green-300",
  atrasada:     "bg-red-100 text-red-700 border-red-300",
};

export const PERIODO_LABEL: Record<Periodicidade, string> = {
  unica:       "Única",
  mensal:      "Mensal",
  trimestral:  "Trimestral",
  semestral:   "Semestral",
  anual:       "Anual",
};

// Calcula próxima data com base na periodicidade
function calcularProximaData(
  dataAtual: string,
  periodicidade: Periodicidade
): string {
  const d = parseISO(dataAtual);
  let next: Date;
  switch (periodicidade) {
    case "mensal":      next = addMonths(d, 1); break;
    case "trimestral":  next = addQuarters(d, 1); break;
    case "semestral":   next = addMonths(d, 6); break;
    case "anual":       next = addYears(d, 1); break;
    default:            return dataAtual;
  }
  return format(next, "yyyy-MM-dd");
}

// Verifica se obrigação está atrasada
export function isAtrasada(obrigacao: ComplianceObrigacao): boolean {
  return (
    obrigacao.status !== "concluida" &&
    isBefore(parseISO(obrigacao.proxima_data), new Date())
  );
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useComplianceObrigacoes(organizacaoId?: string) {
  return useQuery({
    queryKey: ["compliance-obrigacoes", organizacaoId],
    queryFn: async () => {
      // Busca obrigações globais (org null) + da organização específica
      let q = db
        .from("compliance_obrigacoes")
        .select("*")
        .order("proxima_data", { ascending: true });

      if (organizacaoId) {
        q = q.or(`organizacao_id.is.null,organizacao_id.eq.${organizacaoId}`);
      } else {
        q = q.is("organizacao_id", null);
      }

      const { data, error } = await q;
      if (error) throw error;

      // Marca atrasadas automaticamente
      const obrigacoes = (data ?? []) as ComplianceObrigacao[];
      return obrigacoes.map(o => ({
        ...o,
        status: isAtrasada(o) && o.status === "pendente" ? "atrasada" as ObrigacaoStatus : o.status,
      }));
    },
  });
}

// Obrigações dos próximos N dias (para widget no dashboard)
export function useProximasObrigacoes(organizacaoId?: string, dias = 30) {
  return useQuery({
    queryKey: ["proximas-obrigacoes", organizacaoId, dias],
    queryFn: async () => {
      const limite = new Date();
      limite.setDate(limite.getDate() + dias);

      let q = db
        .from("compliance_obrigacoes")
        .select("*")
        .lte("proxima_data", format(limite, "yyyy-MM-dd"))
        .neq("status", "concluida")
        .order("proxima_data", { ascending: true })
        .limit(10);

      if (organizacaoId) {
        q = q.or(`organizacao_id.is.null,organizacao_id.eq.${organizacaoId}`);
      } else {
        q = q.is("organizacao_id", null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ComplianceObrigacao[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCriarObrigacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      organizacao_id?: string;
      titulo: string;
      descricao?: string;
      lei_referencia?: string;
      orgao_regulador?: string;
      periodicidade: Periodicidade;
      proxima_data: string;
    }) => {
      const { data, error } = await db
        .from("compliance_obrigacoes")
        .insert({ ...payload, responsavel_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-obrigacoes"] });
      queryClient.invalidateQueries({ queryKey: ["proximas-obrigacoes"] });
      toast.success("Obrigação criada!");
    },
    onError: () => toast.error("Erro ao criar obrigação"),
  });
}

export function useConcluirObrigacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (obrigacao: ComplianceObrigacao) => {
      const proximaData = calcularProximaData(obrigacao.proxima_data, obrigacao.periodicidade);
      const update: Record<string, unknown> = { status: "concluida" };

      // Para periódicas, recria automaticamente a próxima ocorrência
      if (obrigacao.periodicidade !== "unica") {
        // Marca atual como concluída
        const { error: e1 } = await db
          .from("compliance_obrigacoes")
          .update({ status: "concluida" })
          .eq("id", obrigacao.id);
        if (e1) throw e1;

        // Cria próxima ocorrência
        const { error: e2 } = await db.from("compliance_obrigacoes").insert({
          organizacao_id: obrigacao.organizacao_id,
          titulo: obrigacao.titulo,
          descricao: obrigacao.descricao,
          lei_referencia: obrigacao.lei_referencia,
          orgao_regulador: obrigacao.orgao_regulador,
          periodicidade: obrigacao.periodicidade,
          mes_vencimento: obrigacao.mes_vencimento,
          dia_vencimento: obrigacao.dia_vencimento,
          proxima_data: proximaData,
          status: "pendente",
          responsavel_id: obrigacao.responsavel_id,
        });
        if (e2) throw e2;
      } else {
        const { error } = await db
          .from("compliance_obrigacoes")
          .update({ status: "concluida" })
          .eq("id", obrigacao.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-obrigacoes"] });
      queryClient.invalidateQueries({ queryKey: ["proximas-obrigacoes"] });
      toast.success("Obrigação concluída!");
    },
    onError: () => toast.error("Erro ao concluir obrigação"),
  });
}

export function useAtualizarStatusObrigacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ObrigacaoStatus }) => {
      const { error } = await db
        .from("compliance_obrigacoes")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-obrigacoes"] });
      queryClient.invalidateQueries({ queryKey: ["proximas-obrigacoes"] });
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });
}

export function useExcluirObrigacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("compliance_obrigacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-obrigacoes"] });
      toast.success("Obrigação removida.");
    },
    onError: () => toast.error("Erro ao remover obrigação"),
  });
}
