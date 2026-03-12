import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IncidenteTipo =
  | "vazamento_dados"
  | "fraude"
  | "corrupcao"
  | "assedio"
  | "outro";

export type IncidenteSeveridade = "baixa" | "media" | "alta" | "critica";

export type IncidenteStatus = "aberto" | "investigando" | "resolvido" | "encerrado";

export interface Incidente {
  id: string;
  organization_id: string;
  titulo: string;
  descricao: string;
  tipo: IncidenteTipo;
  severidade: IncidenteSeveridade;
  status: IncidenteStatus;
  data_ocorrencia: string;
  responsavel_id: string | null;
  plano_corretivo: string | null;
  licoes_aprendidas: string | null;
  notificacao_anpd: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const TIPO_LABEL: Record<IncidenteTipo, string> = {
  vazamento_dados: "Vazamento de Dados",
  fraude:          "Fraude",
  corrupcao:       "Corrupção",
  assedio:         "Assédio",
  outro:           "Outro",
};

export const SEVERIDADE_LABEL: Record<IncidenteSeveridade, string> = {
  baixa:   "Baixa",
  media:   "Média",
  alta:    "Alta",
  critica: "Crítica",
};

export const STATUS_LABEL: Record<IncidenteStatus, string> = {
  aberto:       "Aberto",
  investigando: "Investigando",
  resolvido:    "Resolvido",
  encerrado:    "Encerrado",
};

export const SEVERIDADE_COR: Record<IncidenteSeveridade, string> = {
  baixa:   "bg-slate-100 text-slate-700 border-slate-300",
  media:   "bg-amber-100 text-amber-800 border-amber-300",
  alta:    "bg-orange-100 text-orange-800 border-orange-300",
  critica: "bg-red-100 text-red-800 border-red-300",
};

export const STATUS_COR: Record<IncidenteStatus, string> = {
  aberto:       "bg-red-100 text-red-800 border-red-300",
  investigando: "bg-amber-100 text-amber-800 border-amber-300",
  resolvido:    "bg-green-100 text-green-800 border-green-300",
  encerrado:    "bg-slate-100 text-slate-700 border-slate-300",
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useIncidentes(organizacaoId?: string) {
  return useQuery({
    queryKey: ["incidentes", organizacaoId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("incidentes")
        .select("*")
        .order("data_ocorrencia", { ascending: false });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as Incidente[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCriarIncidente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      titulo: string;
      descricao: string;
      tipo: IncidenteTipo;
      severidade: IncidenteSeveridade;
      data_ocorrencia: string;
      plano_corretivo?: string | null;
      licoes_aprendidas?: string | null;
      notificacao_anpd?: boolean;
    }) => {
      const { data, error } = await (supabase as any)
        .from("incidentes")
        .insert({ ...payload, status: "aberto" })
        .select()
        .single();
      if (error) throw error;
      return data as Incidente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      toast.success("Incidente registrado com sucesso!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao registrar incidente");
    },
  });
}

export function useAtualizarIncidente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<Incidente, "id" | "created_at" | "updated_at">> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("incidentes")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      toast.success("Incidente atualizado!");
    },
    onError: (e: unknown) => {
      console.error(e);
      toast.error("Erro ao atualizar incidente");
    },
  });
}

export function useExcluirIncidente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("incidentes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      toast.success("Incidente removido!");
    },
    onError: () => toast.error("Erro ao remover incidente"),
  });
}
