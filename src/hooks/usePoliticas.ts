import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PoliticaCategoria =
  | "conduta"
  | "anticorrupcao"
  | "lgpd"
  | "trabalhista"
  | "ambiental"
  | "financeira"
  | "seguranca"
  | "outra";

export type PoliticaStatus =
  | "rascunho"
  | "revisao"
  | "aprovado"
  | "publicado"
  | "revogado";

export interface Politica {
  id: string;
  organization_id: string;
  titulo: string;
  categoria: PoliticaCategoria;
  conteudo: string | null;
  status: PoliticaStatus;
  versao: string;
  data_vigencia_inicio: string | null;
  data_vigencia_fim: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PoliticaAceite {
  id: string;
  politica_id: string;
  user_id: string;
  aceito_em: string | null;
  ip_address: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIA_LABEL: Record<PoliticaCategoria, string> = {
  conduta:       "Código de Conduta",
  anticorrupcao: "Anticorrupção",
  lgpd:          "LGPD / Privacidade",
  trabalhista:   "Trabalhista",
  ambiental:     "Ambiental",
  financeira:    "Financeira",
  seguranca:     "Segurança da Informação",
  outra:         "Outra",
};

export const STATUS_LABEL: Record<PoliticaStatus, string> = {
  rascunho:  "Rascunho",
  revisao:   "Em Revisão",
  aprovado:  "Aprovado",
  publicado: "Publicado",
  revogado:  "Revogado",
};

export const STATUS_COR: Record<PoliticaStatus, string> = {
  rascunho:  "bg-slate-100 text-slate-700 border-slate-300",
  revisao:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  aprovado:  "bg-blue-100 text-blue-800 border-blue-300",
  publicado: "bg-green-100 text-green-800 border-green-300",
  revogado:  "bg-red-100 text-red-700 border-red-300",
};

export const PROXIMO_STATUS: Partial<Record<PoliticaStatus, PoliticaStatus>> = {
  rascunho: "revisao",
  revisao:  "aprovado",
  aprovado: "publicado",
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePoliticas(organizacaoId?: string) {
  return useQuery({
    queryKey: ["politicas", organizacaoId],
    queryFn: async () => {
      let q = supabase
        .from("politicas")
        .select("*")
        .order("created_at", { ascending: false });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as Politica[];
    },
  });
}

export function usePoliticaAceites(politicaId: string) {
  return useQuery({
    queryKey: ["politica-aceites", politicaId],
    queryFn: async () => {
      if (!politicaId) return [];

      const { data: aceites, error } = await supabase
        .from("politicas_aceites")
        .select("*")
        .eq("politica_id", politicaId)
        .order("aceito_em", { ascending: false });
      if (error) throw error;
      if (!aceites || aceites.length === 0) return [];

      // Busca perfis separadamente (sem FK direta politicas_aceites → profiles)
      const userIds = aceites.map((a) => a.user_id);
      const { data: perfis } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);

      const perfilMap = new Map((perfis ?? []).map((p) => [p.id, p]));
      return aceites.map((a) => ({
        ...a,
        profiles: perfilMap.get(a.user_id) ?? null,
      })) as (PoliticaAceite & { profiles: { nome: string | null; email: string | null } | null })[];
    },
    enabled: !!politicaId,
  });
}

export function usePoliticaAdesaoStats(politicaId: string, organizacaoId: string) {
  return useQuery({
    queryKey: ["politica-stats", politicaId, organizacaoId],
    queryFn: async () => {
      const [{ count: totalAceites }, { count: totalMembros }] = await Promise.all([
        supabase
          .from("politicas_aceites")
          .select("*", { count: "exact", head: true })
          .eq("politica_id", politicaId),
        supabase
          .from("organization_members")
          .select("*", { count: "exact", head: true })
          .eq("organizacao_id", organizacaoId),
      ]);
      const tm = totalMembros ?? 0;
      const ta = totalAceites ?? 0;
      return {
        totalAceites: ta,
        totalMembros: tm,
        percentual: tm > 0 ? Math.round((ta / tm) * 100) : 0,
      };
    },
    enabled: !!politicaId && !!organizacaoId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCriarPolitica() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      titulo: string;
      categoria: PoliticaCategoria;
      conteudo?: string;
      data_vigencia_inicio?: string;
    }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("politicas")
        .insert({ ...payload, created_by: user.id, status: "rascunho" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["politicas", vars.organization_id] });
      toast.success("Política criada!");
    },
    onError: () => toast.error("Erro ao criar política"),
  });
}

export function useAtualizarPolitica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      titulo?: string;
      categoria?: PoliticaCategoria;
      conteudo?: string | null;
    }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("politicas")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["politicas"] });
      toast.success("Política atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar política"),
  });
}

export function useAvancarStatusPolitica() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, statusAtual }: { id: string; statusAtual: PoliticaStatus }) => {
      const proximo = PROXIMO_STATUS[statusAtual];
      if (!proximo) throw new Error("Sem próximo status");

      const updates: Record<string, unknown> = { status: proximo };
      if (proximo === "aprovado") {
        updates.aprovado_por = user?.id;
        updates.aprovado_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("politicas")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["politicas"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao avançar status"),
  });
}

export function useRevogarPolitica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("politicas")
        .update({ status: "revogado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["politicas"] });
      toast.success("Política revogada.");
    },
    onError: () => toast.error("Erro ao revogar política"),
  });
}
