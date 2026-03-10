import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConflitosStatus = "pendente" | "enviado" | "analisado";

export interface ConflitosInteresse {
  id: string;
  organization_id: string;
  declarante_id: string;
  ano_referencia: number;
  tem_conflito: boolean;
  descricao: string | null;
  status: ConflitosStatus;
  analisado_por: string | null;
  analisado_em: string | null;
  observacao_analise: string | null;
  created_at: string;
  updated_at: string;
  profiles_declarante?: { nome: string | null; email: string | null } | null;
  profiles_analista?: { nome: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<ConflitosStatus, string> = {
  pendente: "Pendente",
  enviado:  "Enviado",
  analisado:"Analisado",
};

export const STATUS_COR: Record<ConflitosStatus, string> = {
  pendente:  "bg-slate-100 text-slate-700 border-slate-300",
  enviado:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  analisado: "bg-green-100 text-green-800 border-green-300",
};

// ─── Queries ──────────────────────────────────────────────────────────────────

// Para consultores: todas as declarações de uma organização
export function useDeclaracoesPorOrg(organizacaoId?: string, anoRef?: number) {
  return useQuery({
    queryKey: ["conflitos", organizacaoId, anoRef],
    queryFn: async () => {
      let q = supabase
        .from("conflito_interesses")
        .select(`
          *,
          profiles_declarante:declarante_id(nome, email),
          profiles_analista:analisado_por(nome)
        `)
        .order("created_at", { ascending: false });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);
      if (anoRef) q = q.eq("ano_referencia", anoRef);

      const { data, error } = await q;
      if (error) throw error;
      return data as ConflitosInteresse[];
    },
  });
}

// Para cliente: sua própria declaração no ano corrente
export function useMinhaDeclaracao(organizacaoId: string, anoRef: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["minha-declaracao", organizacaoId, anoRef, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("conflito_interesses")
        .select("*")
        .eq("organization_id", organizacaoId)
        .eq("declarante_id", user.id)
        .eq("ano_referencia", anoRef)
        .maybeSingle();
      return data as ConflitosInteresse | null;
    },
    enabled: !!user?.id && !!organizacaoId,
  });
}

// Para consultores: usuários que ainda NÃO declararam no ano
export function usePendentesDeclaracao(organizacaoId: string, anoRef: number) {
  return useQuery({
    queryKey: ["conflitos-pendentes", organizacaoId, anoRef],
    queryFn: async () => {
      // Busca membros da org
      const { data: membros, error: err1 } = await supabase
        .from("organization_members")
        .select("user_id, profiles:user_id(nome, email)")
        .eq("organizacao_id", organizacaoId);
      if (err1) throw err1;

      // Busca quem já declarou
      const { data: declararam, error: err2 } = await supabase
        .from("conflito_interesses")
        .select("declarante_id")
        .eq("organization_id", organizacaoId)
        .eq("ano_referencia", anoRef);
      if (err2) throw err2;

      const declaramIds = new Set((declararam ?? []).map((d: any) => d.declarante_id));
      return (membros ?? []).filter((m: any) => !declaramIds.has(m.user_id)) as Array<{
        user_id: string;
        profiles: { nome: string | null; email: string | null } | null;
      }>;
    },
    enabled: !!organizacaoId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useEnviarDeclaracao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      organizacaoId,
      anoReferencia,
      temConflito,
      descricao,
    }: {
      organizacaoId: string;
      anoReferencia: number;
      temConflito: boolean;
      descricao?: string;
    }) => {
      if (!user?.id) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("conflito_interesses")
        .upsert(
          {
            organization_id: organizacaoId,
            declarante_id: user.id,
            ano_referencia: anoReferencia,
            tem_conflito: temConflito,
            descricao: descricao ?? null,
            status: "enviado",
          },
          { onConflict: "organization_id,declarante_id,ano_referencia" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conflitos"] });
      queryClient.invalidateQueries({ queryKey: ["minha-declaracao"] });
      queryClient.invalidateQueries({ queryKey: ["conflitos-pendentes"] });
      toast.success("Declaração enviada com sucesso!");
    },
    onError: () => toast.error("Erro ao enviar declaração"),
  });
}

export function useAnalisarDeclaracao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      observacao,
    }: {
      id: string;
      observacao?: string;
    }) => {
      const { error } = await supabase
        .from("conflito_interesses")
        .update({
          status: "analisado",
          analisado_por: user?.id,
          analisado_em: new Date().toISOString(),
          observacao_analise: observacao ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conflitos"] });
      toast.success("Declaração analisada!");
    },
    onError: () => toast.error("Erro ao analisar declaração"),
  });
}
