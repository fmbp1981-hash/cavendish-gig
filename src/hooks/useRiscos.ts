import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiscoCategoria = "legal" | "financeiro" | "reputacional" | "operacional" | "ambiental";
export type RiscoStatus = "identificado" | "mitigando" | "mitigado" | "aceito";
export type MitigacaoStatus = "pendente" | "em_andamento" | "concluida";

export interface Risco {
  id: string;
  organizacao_id: string | null;
  organization_id: string | null;
  titulo: string;
  categoria: RiscoCategoria;
  probabilidade: number;
  impacto: number;
  nivel_risco: number;
  status: RiscoStatus;
  responsavel_id: string | null;
  plano_acao: string | null;
  prazo: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string | null; email: string | null } | null;
}

export interface RiscoMitigacao {
  id: string;
  risco_id: string;
  descricao: string;
  responsavel_id: string | null;
  prazo: string | null;
  status: MitigacaoStatus;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string | null } | null;
}

export interface RiscoAvaliacao {
  id: string;
  risco_id: string;
  avaliado_por: string | null;
  probabilidade_anterior: number | null;
  impacto_anterior: number | null;
  probabilidade_nova: number;
  impacto_nova: number;
  justificativa: string | null;
  created_at: string;
  profiles?: { nome: string | null } | null;
}

// ─── Riscos ───────────────────────────────────────────────────────────────────

export function useRiscos(organizacaoId?: string) {
  return useQuery({
    queryKey: ["riscos", organizacaoId],
    queryFn: async () => {
      let q = supabase
        .from("riscos")
        .select(`*, profiles:responsavel_id(nome, email)`)
        .order("nivel_risco", { ascending: false });

      if (organizacaoId) {
        q = q.eq("organizacao_id", organizacaoId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Risco[];
    },
  });
}

export function useCriarRisco() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      organizacao_id: string;
      titulo: string;
      categoria: RiscoCategoria;
      probabilidade: number;
      impacto: number;
      status?: RiscoStatus;
      responsavel_id?: string | null;
      plano_acao?: string | null;
      prazo?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("riscos")
        // riscos has both organizacao_id (nullable FK) and organization_id (required) due to a migration inconsistency
        .insert({ ...payload, organization_id: payload.organizacao_id, status: payload.status ?? "identificado" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      toast.success("Risco cadastrado com sucesso!");
    },
    onError: (e) => {
      console.error(e);
      toast.error("Erro ao cadastrar risco");
    },
  });
}

export function useAtualizarRisco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<Risco, "profiles">> & { id: string }) => {
      const { error } = await (supabase as any).from("riscos").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      toast.success("Risco atualizado!");
    },
    onError: (e) => {
      console.error(e);
      toast.error("Erro ao atualizar risco");
    },
  });
}

export function useExcluirRisco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("riscos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      toast.success("Risco removido!");
    },
    onError: () => toast.error("Erro ao remover risco"),
  });
}

// ─── Mitigações ───────────────────────────────────────────────────────────────

export function useRiscoMitigacoes(riscoId: string) {
  return useQuery({
    queryKey: ["riscos-mitigacao", riscoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("riscos_mitigacao")
        .select(`*, profiles:responsavel_id(nome)`)
        .eq("risco_id", riscoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as RiscoMitigacao[];
    },
    enabled: !!riscoId,
  });
}

export function useCriarMitigacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      risco_id: string;
      descricao: string;
      responsavel_id?: string | null;
      prazo?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("riscos_mitigacao")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["riscos-mitigacao", vars.risco_id] });
      toast.success("Ação de mitigação adicionada!");
    },
    onError: () => toast.error("Erro ao adicionar ação"),
  });
}

export function useAtualizarMitigacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      risco_id,
      ...payload
    }: Partial<RiscoMitigacao> & { id: string; risco_id: string }) => {
      const { error } = await (supabase as any).from("riscos_mitigacao").update(payload).eq("id", id);
      if (error) throw error;
      return risco_id;
    },
    onSuccess: (riscoId) => {
      queryClient.invalidateQueries({ queryKey: ["riscos-mitigacao", riscoId] });
      toast.success("Ação atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar ação"),
  });
}

export function useExcluirMitigacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, risco_id }: { id: string; risco_id: string }) => {
      const { error } = await (supabase as any).from("riscos_mitigacao").delete().eq("id", id);
      if (error) throw error;
      return risco_id;
    },
    onSuccess: (riscoId) => {
      queryClient.invalidateQueries({ queryKey: ["riscos-mitigacao", riscoId] });
      toast.success("Ação removida!");
    },
    onError: () => toast.error("Erro ao remover ação"),
  });
}

// ─── Avaliações ───────────────────────────────────────────────────────────────

export function useRiscoAvaliacoes(riscoId: string) {
  return useQuery({
    queryKey: ["riscos-avaliacoes", riscoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("riscos_avaliacoes")
        .select(`*, profiles:avaliado_por(nome)`)
        .eq("risco_id", riscoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as RiscoAvaliacao[];
    },
    enabled: !!riscoId,
  });
}

export function useRegistrarAvaliacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      risco_id: string;
      probabilidade_anterior: number;
      impacto_anterior: number;
      probabilidade_nova: number;
      impacto_nova: number;
      justificativa?: string;
    }) => {
      const { data, error } = await supabase
        .from("riscos_avaliacoes")
        .insert({ ...payload, avaliado_por: user?.id })
        .select()
        .single();
      if (error) throw error;

      // Atualiza probabilidade/impacto no risco principal
      await supabase
        .from("riscos")
        .update({
          probabilidade: payload.probabilidade_nova,
          impacto: payload.impacto_nova,
        })
        .eq("id", payload.risco_id);

      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["riscos"] });
      queryClient.invalidateQueries({ queryKey: ["riscos-avaliacoes", vars.risco_id] });
      toast.success("Reavaliação registrada!");
    },
    onError: () => toast.error("Erro ao registrar reavaliação"),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const NIVEL_COR: Record<number, string> = {
  1:  "bg-green-100 text-green-800 border-green-300",
  2:  "bg-green-100 text-green-800 border-green-300",
  3:  "bg-green-100 text-green-800 border-green-300",
  4:  "bg-green-100 text-green-800 border-green-300",
  5:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  6:  "bg-yellow-100 text-yellow-800 border-yellow-300",
  8:  "bg-orange-100 text-orange-800 border-orange-300",
  9:  "bg-orange-100 text-orange-800 border-orange-300",
  10: "bg-red-100 text-red-800 border-red-300",
  12: "bg-red-100 text-red-800 border-red-300",
  15: "bg-red-100 text-red-800 border-red-300",
  16: "bg-red-100 text-red-800 border-red-300",
  20: "bg-red-100 text-red-800 border-red-300",
  25: "bg-red-100 text-red-800 border-red-300",
};

export function nivelLabel(nivel: number): string {
  if (nivel <= 4)  return "Baixo";
  if (nivel <= 9)  return "Médio";
  if (nivel <= 16) return "Alto";
  return "Crítico";
}

export function nivelBgHeatmap(prob: number, imp: number): string {
  const n = prob * imp;
  if (n <= 4)  return "bg-green-200 hover:bg-green-300";
  if (n <= 9)  return "bg-yellow-200 hover:bg-yellow-300";
  if (n <= 16) return "bg-orange-300 hover:bg-orange-400";
  return "bg-red-400 hover:bg-red-500";
}

export const CATEGORIA_LABEL: Record<RiscoCategoria, string> = {
  legal:         "Legal/Regulatório",
  financeiro:    "Financeiro",
  reputacional:  "Reputacional",
  operacional:   "Operacional",
  ambiental:     "Ambiental/ESG",
};

export const STATUS_LABEL: Record<RiscoStatus, string> = {
  identificado: "Identificado",
  mitigando:    "Em mitigação",
  mitigado:     "Mitigado",
  aceito:       "Aceito",
};
