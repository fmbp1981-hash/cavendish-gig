import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvestigacaoStatus =
  | "aberta" | "em_analise" | "investigando" | "concluida" | "arquivada";
export type NivelRisco = "baixo" | "medio" | "alto" | "critico";

export interface Investigacao {
  id: string;
  denuncia_id: string;
  organizacao_id: string | null;
  status: InvestigacaoStatus;
  responsavel_id: string | null;
  prazo_resposta: string | null;
  categoria_triagem: string | null;
  nivel_risco: NivelRisco | null;
  conclusao: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string | null; email: string | null } | null;
  denuncias?: { ticket_id: string; categoria: string; descricao: string } | null;
}

export interface InvestigacaoNota {
  id: string;
  investigacao_id: string;
  nota: string;
  criado_por: string | null;
  created_at: string;
  profiles?: { nome: string | null } | null;
}

export interface InvestigacaoEvidencia {
  id: string;
  investigacao_id: string;
  descricao: string;
  arquivo_url: string | null;
  adicionado_por: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<InvestigacaoStatus, string> = {
  aberta:       "Aberta",
  em_analise:   "Em análise",
  investigando: "Investigando",
  concluida:    "Concluída",
  arquivada:    "Arquivada",
};

export const STATUS_COR: Record<InvestigacaoStatus, string> = {
  aberta:       "bg-blue-100 text-blue-800 border-blue-300",
  em_analise:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  investigando: "bg-orange-100 text-orange-800 border-orange-300",
  concluida:    "bg-green-100 text-green-800 border-green-300",
  arquivada:    "bg-slate-100 text-slate-700 border-slate-300",
};

export const NIVEL_COR: Record<NivelRisco, string> = {
  baixo:   "bg-green-100 text-green-800",
  medio:   "bg-yellow-100 text-yellow-800",
  alto:    "bg-orange-100 text-orange-800",
  critico: "bg-red-100 text-red-800",
};

const WORKFLOW: InvestigacaoStatus[] = [
  "aberta", "em_analise", "investigando", "concluida",
];

export function proximoStatus(s: InvestigacaoStatus): InvestigacaoStatus | null {
  const idx = WORKFLOW.indexOf(s);
  return idx >= 0 && idx < WORKFLOW.length - 1 ? WORKFLOW[idx + 1] : null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useInvestigacoes(organizacaoId?: string) {
  return useQuery({
    queryKey: ["investigacoes", organizacaoId],
    queryFn: async () => {
      let q = supabase
        .from("investigacoes")
        .select(`
          *,
          profiles:responsavel_id(nome, email),
          denuncias:denuncia_id(ticket_id, categoria, descricao)
        `)
        .order("created_at", { ascending: false });

      if (organizacaoId) q = q.eq("organizacao_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as Investigacao[];
    },
  });
}

export function useInvestigacaoPorDenuncia(denunciaId: string) {
  return useQuery({
    queryKey: ["investigacao-denuncia", denunciaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("investigacoes")
        .select("*")
        .eq("denuncia_id", denunciaId)
        .maybeSingle();
      return data as Investigacao | null;
    },
    enabled: !!denunciaId,
  });
}

export function useInvestigacaoNotas(investigacaoId: string) {
  return useQuery({
    queryKey: ["investigacao-notas", investigacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investigacoes_notas")
        .select(`*, profiles:criado_por(nome)`)
        .eq("investigacao_id", investigacaoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as InvestigacaoNota[];
    },
    enabled: !!investigacaoId,
  });
}

export function useInvestigacaoEvidencias(investigacaoId: string) {
  return useQuery({
    queryKey: ["investigacao-evidencias", investigacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investigacoes_evidencias")
        .select("*")
        .eq("investigacao_id", investigacaoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as InvestigacaoEvidencia[];
    },
    enabled: !!investigacaoId,
  });
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function useKPIsDenuncias() {
  return useQuery({
    queryKey: ["kpis-denuncias"],
    queryFn: async () => {
      const { data: denuncias, error } = await supabase
        .from("denuncias")
        .select("status, created_at, analisado_em");
      if (error) throw error;

      const total = denuncias?.length ?? 0;
      const anonimas = 0; // denúncias anônimas não têm user_id linkado
      const abertas = denuncias?.filter(d =>
        d.status === "nova" || d.status === "em_analise"
      ).length ?? 0;

      // Tempo médio de resolução (em dias)
      const resolvidas = denuncias?.filter(d => d.analisado_em) ?? [];
      const tempoMedio = resolvidas.length > 0
        ? Math.round(
            resolvidas.reduce((sum, d) => {
              const diff =
                (new Date(d.analisado_em!).getTime() - new Date(d.created_at).getTime()) /
                (1000 * 60 * 60 * 24);
              return sum + diff;
            }, 0) / resolvidas.length
          )
        : null;

      const porCategoria: Record<string, number> = {};
      denuncias?.forEach(d => {
        const key = (d as any).categoria ?? "outros";
        porCategoria[key] = (porCategoria[key] ?? 0) + 1;
      });

      return { total, abertas, tempoMedio, porCategoria };
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAbrirInvestigacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      denunciaId,
      organizacaoId,
      prazoResposta,
    }: {
      denunciaId: string;
      organizacaoId?: string;
      prazoResposta?: string;
    }) => {
      const { data, error } = await supabase
        .from("investigacoes")
        .insert({
          denuncia_id: denunciaId,
          organizacao_id: organizacaoId ?? null,
          responsavel_id: user?.id,
          prazo_resposta: prazoResposta ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigacoes"] });
      queryClient.invalidateQueries({ queryKey: ["investigacao-denuncia"] });
      toast.success("Investigação aberta!");
    },
    onError: (e: any) => {
      if (e?.code === "23505") toast.error("Já existe uma investigação para esta denúncia.");
      else toast.error("Erro ao abrir investigação");
    },
  });
}

export function useAvancarInvestigacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      conclusao,
    }: {
      id: string;
      status: InvestigacaoStatus;
      conclusao?: string;
    }) => {
      const payload: Record<string, unknown> = { status };
      if (conclusao !== undefined) payload.conclusao = conclusao;
      const { error } = await (supabase as any).from("investigacoes").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investigacoes"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });
}

export function useAdicionarNota() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      investigacaoId,
      nota,
    }: {
      investigacaoId: string;
      nota: string;
    }) => {
      const { error } = await supabase
        .from("investigacoes_notas")
        .insert({ investigacao_id: investigacaoId, nota, criado_por: user?.id });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["investigacao-notas", vars.investigacaoId] });
    },
    onError: () => toast.error("Erro ao salvar nota"),
  });
}

export function useAdicionarEvidencia() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      investigacaoId,
      descricao,
      arquivoUrl,
    }: {
      investigacaoId: string;
      descricao: string;
      arquivoUrl?: string;
    }) => {
      const { error } = await supabase
        .from("investigacoes_evidencias")
        .insert({
          investigacao_id: investigacaoId,
          descricao,
          arquivo_url: arquivoUrl ?? null,
          adicionado_por: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["investigacao-evidencias", vars.investigacaoId],
      });
      toast.success("Evidência adicionada!");
    },
    onError: () => toast.error("Erro ao adicionar evidência"),
  });
}
