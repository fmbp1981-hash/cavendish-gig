import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RelatorioRegTipo = "CGU" | "CVM" | "BACEN" | "ANPD" | "TCU" | "CADE";
export type RelatorioRegStatus = "rascunho" | "revisao" | "entregue";

export interface RelatorioRegulatorio {
  id: string;
  organization_id: string;
  tipo: RelatorioRegTipo;
  periodo_referencia: string;
  status: RelatorioRegStatus;
  prazo_entrega: string | null;
  entregue_em: string | null;
  protocolo: string | null;
  documento_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const TIPO_LABEL: Record<RelatorioRegTipo, string> = {
  CGU:  "CGU",
  CVM:  "CVM",
  BACEN:"BACEN",
  ANPD: "ANPD",
  TCU:  "TCU",
  CADE: "CADE",
};

export const TIPO_COR: Record<RelatorioRegTipo, string> = {
  CGU:  "bg-blue-100 text-blue-800 border-blue-300",
  CVM:  "bg-violet-100 text-violet-800 border-violet-300",
  BACEN:"bg-green-100 text-green-800 border-green-300",
  ANPD: "bg-orange-100 text-orange-800 border-orange-300",
  TCU:  "bg-slate-100 text-slate-700 border-slate-300",
  CADE: "bg-red-100 text-red-800 border-red-300",
};

export const STATUS_LABEL: Record<RelatorioRegStatus, string> = {
  rascunho: "Rascunho",
  revisao:  "Em Revisão",
  entregue: "Entregue",
};

export const STATUS_COR: Record<RelatorioRegStatus, string> = {
  rascunho: "bg-slate-100 text-slate-700 border-slate-300",
  revisao:  "bg-amber-100 text-amber-800 border-amber-300",
  entregue: "bg-green-100 text-green-800 border-green-300",
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useRelatoriosRegulatorios(organizacaoId?: string) {
  return useQuery({
    queryKey: ["relatorios-reg", organizacaoId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("relatorios_regulatorios")
        .select("*")
        .order("prazo_entrega", { ascending: true, nullsFirst: false });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as RelatorioRegulatorio[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCriarRelatorioReg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      tipo: RelatorioRegTipo;
      periodo_referencia: string;
      prazo_entrega?: string | null;
      protocolo?: string | null;
    }) => {
      const { data, error } = await (supabase as any)
        .from("relatorios_regulatorios")
        .insert({ ...payload, status: "rascunho" })
        .select()
        .single();
      if (error) throw error;
      return data as RelatorioRegulatorio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relatorios-reg"] });
      toast.success("Relatório criado com sucesso!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao criar relatório");
    },
  });
}

export function useAtualizarRelatorioReg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<RelatorioRegulatorio, "id" | "created_at" | "updated_at">> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("relatorios_regulatorios")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relatorios-reg"] });
      toast.success("Relatório atualizado!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao atualizar relatório");
    },
  });
}
