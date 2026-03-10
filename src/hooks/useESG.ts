import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ESGPilar = "ambiental" | "social" | "governanca";

export interface ESGIndicador {
  id: string;
  organizacao_id: string;
  pilar: ESGPilar;
  nome: string;
  descricao: string | null;
  unidade: string;
  meta: number | null;
  valor_atual: number | null;
  periodo_referencia: string | null;
  fonte: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoardSnapshot {
  id: string;
  organizacao_id: string;
  titulo: string;
  periodo_referencia: string;
  conteudo: Record<string, unknown>;
  gerado_por: string | null;
  link_publico_token: string;
  expira_em: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const PILAR_LABEL: Record<ESGPilar, string> = {
  ambiental:  "Ambiental",
  social:     "Social",
  governanca: "Governança",
};

export const PILAR_COR: Record<ESGPilar, string> = {
  ambiental:  "text-green-600 bg-green-50 border-green-200",
  social:     "text-blue-600 bg-blue-50 border-blue-200",
  governanca: "text-purple-600 bg-purple-50 border-purple-200",
};

export const PILAR_ICON: Record<ESGPilar, string> = {
  ambiental:  "🌿",
  social:     "🤝",
  governanca: "⚖️",
};

// Calcula score 0-100 para um pilar com base nos indicadores que têm meta
export function calcularScorePilar(indicadores: ESGIndicador[]): number {
  const comMeta = indicadores.filter(i => i.meta != null && i.valor_atual != null);
  if (comMeta.length === 0) return 0;
  const somaRatio = comMeta.reduce((s, i) => {
    const ratio = Math.min((i.valor_atual! / i.meta!) * 100, 100);
    return s + ratio;
  }, 0);
  return Math.round(somaRatio / comMeta.length);
}

// ─── Indicadores ──────────────────────────────────────────────────────────────

export function useESGIndicadores(organizacaoId?: string) {
  return useQuery({
    queryKey: ["esg-indicadores", organizacaoId],
    queryFn: async () => {
      let q = db.from("esg_indicadores").select("*").order("pilar").order("nome");
      if (organizacaoId) q = q.eq("organizacao_id", organizacaoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ESGIndicador[];
    },
  });
}

export function useCriarESGIndicador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      organizacao_id: string;
      pilar: ESGPilar;
      nome: string;
      descricao?: string;
      unidade?: string;
      meta?: number;
      valor_atual?: number;
      periodo_referencia?: string;
    }) => {
      const { data, error } = await db.from("esg_indicadores").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esg-indicadores"] });
      toast.success("Indicador criado!");
    },
    onError: () => toast.error("Erro ao criar indicador"),
  });
}

export function useAtualizarESGIndicador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ESGIndicador> & { id: string }) => {
      const { error } = await db.from("esg_indicadores").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esg-indicadores"] });
      toast.success("Indicador atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar indicador"),
  });
}

export function useExcluirESGIndicador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("esg_indicadores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esg-indicadores"] });
      toast.success("Indicador removido.");
    },
    onError: () => toast.error("Erro ao remover indicador"),
  });
}

// ─── Board Snapshots ──────────────────────────────────────────────────────────

export function useBoardSnapshots(organizacaoId?: string) {
  return useQuery({
    queryKey: ["board-snapshots", organizacaoId],
    queryFn: async () => {
      let q = db
        .from("board_snapshots")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (organizacaoId) q = q.eq("organizacao_id", organizacaoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as BoardSnapshot[];
    },
  });
}

export function useBoardSnapshotPublico(token: string) {
  return useQuery({
    queryKey: ["board-snapshot-publico", token],
    queryFn: async () => {
      const { data, error } = await db
        .from("board_snapshots")
        .select("*")
        .eq("link_publico_token", token)
        .gt("expira_em", new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return data as BoardSnapshot | null;
    },
    enabled: !!token,
  });
}

export function useGerarBoardSnapshot() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      organizacaoId,
      titulo,
      periodoReferencia,
      conteudo,
    }: {
      organizacaoId: string;
      titulo: string;
      periodoReferencia: string;
      conteudo: Record<string, unknown>;
    }) => {
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);

      const { data, error } = await db
        .from("board_snapshots")
        .insert({
          organizacao_id: organizacaoId,
          titulo,
          periodo_referencia: periodoReferencia,
          conteudo,
          gerado_por: user?.id,
          expira_em: expiraEm.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as BoardSnapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-snapshots"] });
      toast.success("Relatório executivo gerado!");
    },
    onError: () => toast.error("Erro ao gerar relatório"),
  });
}
