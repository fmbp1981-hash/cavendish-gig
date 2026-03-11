import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInBusinessDays, parseISO } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BaseLegal =
  | "consentimento" | "contrato" | "obrigacao_legal" | "interesse_legitimo" | "outro";

export type DSRTipo =
  | "acesso" | "correcao" | "exclusao" | "portabilidade" | "revogacao_consentimento";

export type DSRStatus = "recebida" | "em_analise" | "concluida" | "negada";

export interface LGPDInventario {
  id: string;
  organization_id: string;
  processo: string;
  finalidade: string;
  base_legal: BaseLegal;
  dados_coletados: string[] | null;
  titulares: string[] | null;
  operador: string | null;
  retencao_meses: number | null;
  medidas_seguranca: string | null;
  created_at: string;
  updated_at: string;
}

export interface LGPDSolicitacao {
  id: string;
  organization_id: string;
  tipo: DSRTipo;
  solicitante_nome: string;
  solicitante_email: string;
  descricao: string | null;
  status: DSRStatus;
  prazo_resposta: string | null;
  resposta: string | null;
  respondido_por: string | null;
  respondido_em: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const BASE_LEGAL_LABEL: Record<BaseLegal, string> = {
  consentimento:       "Consentimento",
  contrato:            "Execução de contrato",
  obrigacao_legal:     "Obrigação legal",
  interesse_legitimo:  "Interesse legítimo",
  outro:               "Outro",
};

export const DSR_TIPO_LABEL: Record<DSRTipo, string> = {
  acesso:                 "Acesso aos dados",
  correcao:               "Correção de dados",
  exclusao:               "Exclusão/anonimização",
  portabilidade:          "Portabilidade",
  revogacao_consentimento:"Revogação de consentimento",
};

export const DSR_STATUS_LABEL: Record<DSRStatus, string> = {
  recebida:   "Recebida",
  em_analise: "Em análise",
  concluida:  "Concluída",
  negada:     "Negada",
};

export const DSR_STATUS_COR: Record<DSRStatus, string> = {
  recebida:   "bg-blue-100 text-blue-800 border-blue-300",
  em_analise: "bg-yellow-100 text-yellow-800 border-yellow-300",
  concluida:  "bg-green-100 text-green-800 border-green-300",
  negada:     "bg-red-100 text-red-800 border-red-300",
};

// Prazo ANPD: 15 dias úteis. Retorna dias restantes (negativo = vencido)
export function diasRestantesDSR(createdAt: string): number {
  const hoje = new Date();
  const criado = parseISO(createdAt);
  const diasPassados = differenceInBusinessDays(hoje, criado);
  return 15 - diasPassados;
}

// ─── Inventário (ROPA) ────────────────────────────────────────────────────────

export function useLGPDInventario(organizacaoId?: string) {
  return useQuery({
    queryKey: ["lgpd-inventario", organizacaoId],
    queryFn: async () => {
      let q = supabase
        .from("lgpd_inventario")
        .select("*")
        .order("processo", { ascending: true });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as LGPDInventario[];
    },
  });
}

export function useCriarInventario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      processo: string;
      finalidade: string;
      base_legal: BaseLegal;
      dados_coletados?: string[];
      titulares?: string[];
      operador?: string;
      retencao_meses?: number;
      medidas_seguranca?: string;
    }) => {
      const { data, error } = await supabase
        .from("lgpd_inventario")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-inventario"] });
      toast.success("Processo cadastrado no inventário!");
    },
    onError: () => toast.error("Erro ao cadastrar processo"),
  });
}

export function useAtualizarInventario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<LGPDInventario> & { id: string }) => {
      const { error } = await (supabase as any).from("lgpd_inventario").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-inventario"] });
      toast.success("Processo atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar processo"),
  });
}

export function useExcluirInventario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("lgpd_inventario").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-inventario"] });
      toast.success("Processo removido do inventário.");
    },
    onError: () => toast.error("Erro ao remover processo"),
  });
}

// ─── DSR (Solicitações de Titulares) ──────────────────────────────────────────

export function useLGPDSolicitacoes(organizacaoId?: string) {
  return useQuery({
    queryKey: ["lgpd-solicitacoes", organizacaoId],
    queryFn: async () => {
      let q = supabase
        .from("lgpd_solicitacoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (organizacaoId) q = q.eq("organization_id", organizacaoId);

      const { data, error } = await q;
      if (error) throw error;
      return data as LGPDSolicitacao[];
    },
  });
}

export function useCriarSolicitacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      tipo: DSRTipo;
      solicitante_nome: string;
      solicitante_email: string;
      descricao?: string;
    }) => {
      // Prazo: 15 dias úteis ≈ 21 dias corridos (estimativa conservadora)
      const prazo = new Date();
      prazo.setDate(prazo.getDate() + 21);

      const { data, error } = await supabase
        .from("lgpd_solicitacoes")
        .insert({ ...payload, prazo_resposta: prazo.toISOString().split("T")[0] })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-solicitacoes"] });
      toast.success("Solicitação registrada!");
    },
    onError: () => toast.error("Erro ao registrar solicitação"),
  });
}

export function useResponderDSR() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      resposta,
    }: {
      id: string;
      status: DSRStatus;
      resposta?: string;
    }) => {
      const { error } = await supabase
        .from("lgpd_solicitacoes")
        .update({
          status,
          resposta: resposta ?? null,
          respondido_por: user?.id,
          respondido_em: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-solicitacoes"] });
      toast.success("DSR respondida!");
    },
    onError: () => toast.error("Erro ao responder DSR"),
  });
}
