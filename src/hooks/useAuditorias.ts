import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditoriaStatus = "planejada" | "em_andamento" | "concluida";
export type NaoConformidadeGravidade = "menor" | "maior" | "critica";
export type NaoConformidadeStatus = "aberta" | "em_tratamento" | "encerrada";

export interface AuditoriaInterna {
  id: string;
  organization_id: string;
  titulo: string;
  escopo: string | null;
  auditor: string;
  data_inicio: string;
  data_fim: string | null;
  status: AuditoriaStatus;
  resultado: string | null;
  created_at: string;
  updated_at: string;
}

export interface NaoConformidade {
  id: string;
  auditoria_id: string;
  descricao: string;
  gravidade: NaoConformidadeGravidade;
  acao_corretiva: string | null;
  prazo: string | null;
  status: NaoConformidadeStatus;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<AuditoriaStatus, string> = {
  planejada:    "Planejada",
  em_andamento: "Em Andamento",
  concluida:    "Concluída",
};

export const STATUS_COR: Record<AuditoriaStatus, string> = {
  planejada:    "bg-slate-100 text-slate-700 border-slate-300",
  em_andamento: "bg-blue-100 text-blue-800 border-blue-300",
  concluida:    "bg-green-100 text-green-800 border-green-300",
};

export const GRAVIDADE_LABEL: Record<NaoConformidadeGravidade, string> = {
  menor:   "Menor",
  maior:   "Maior",
  critica: "Crítica",
};

export const GRAVIDADE_COR: Record<NaoConformidadeGravidade, string> = {
  menor:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  maior:   "bg-orange-100 text-orange-800 border-orange-300",
  critica: "bg-red-100 text-red-800 border-red-300",
};

export const NC_STATUS_LABEL: Record<NaoConformidadeStatus, string> = {
  aberta:        "Aberta",
  em_tratamento: "Em Tratamento",
  encerrada:     "Encerrada",
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAuditorias(organizacaoId?: string) {
  return useQuery({
    queryKey: ["auditorias", organizacaoId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("auditorias_internas")
        .select("*")
        .order("data_inicio", { ascending: false });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as AuditoriaInterna[];
    },
  });
}

export function useNaoConformidades(auditoriaId: string) {
  return useQuery({
    queryKey: ["nao-conformidades", auditoriaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("nao_conformidades")
        .select("*")
        .eq("auditoria_id", auditoriaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as NaoConformidade[];
    },
    enabled: !!auditoriaId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCriarAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      titulo: string;
      auditor: string;
      data_inicio: string;
      escopo?: string | null;
      data_fim?: string | null;
      resultado?: string | null;
    }) => {
      const { data, error } = await (supabase as any)
        .from("auditorias_internas")
        .insert({ ...payload, status: "planejada" })
        .select()
        .single();
      if (error) throw error;
      return data as AuditoriaInterna;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      toast.success("Auditoria criada com sucesso!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao criar auditoria");
    },
  });
}

export function useAtualizarAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<AuditoriaInterna, "id" | "created_at" | "updated_at">> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("auditorias_internas")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      toast.success("Auditoria atualizada!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao atualizar auditoria");
    },
  });
}

export function useCriarNaoConformidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      auditoria_id: string;
      descricao: string;
      gravidade: NaoConformidadeGravidade;
      acao_corretiva?: string | null;
      prazo?: string | null;
    }) => {
      const { data, error } = await (supabase as any)
        .from("nao_conformidades")
        .insert({ ...payload, status: "aberta" })
        .select()
        .single();
      if (error) throw error;
      return data as NaoConformidade;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["nao-conformidades", vars.auditoria_id] });
      toast.success("Não conformidade registrada!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao registrar não conformidade");
    },
  });
}

export function useAtualizarNaoConformidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      auditoria_id,
      ...payload
    }: Partial<Omit<NaoConformidade, "id" | "created_at" | "updated_at">> & {
      id: string;
      auditoria_id: string;
    }) => {
      const { error } = await (supabase as any)
        .from("nao_conformidades")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      return auditoria_id;
    },
    onSuccess: (auditoriaId: string) => {
      queryClient.invalidateQueries({ queryKey: ["nao-conformidades", auditoriaId] });
      toast.success("Não conformidade atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar não conformidade"),
  });
}
