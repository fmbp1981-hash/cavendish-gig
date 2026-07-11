import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { deriveTerminalStatus } from "@/lib/prospeccao/funil-utils";
import type { ProspeccaoFunil, ProspeccaoFunilEtapa, ProspeccaoCategoria, ProspeccaoStatus } from "@/types/prospeccao";

const db = supabase as any;

export function useProspeccaoFunis(categoria?: ProspeccaoCategoria) {
  return useQuery({
    queryKey: ["prospeccao_funis", categoria],
    queryFn: async () => {
      let query = db.from("prospeccao_funis").select("*").eq("ativo", true).order("nome");
      if (categoria) query = query.eq("categoria", categoria);
      const { data, error } = await query;
      if (error) throw error;
      return data as ProspeccaoFunil[];
    },
  });
}

/** Funil padrão (`padrao = true`) de uma categoria — usado pelo kanban quando não há seleção
 * explícita de funil. Ver migration de seed (`finder_seed_funis_padrao.sql`). */
export function useProspeccaoFunilPadrao(categoria: ProspeccaoCategoria) {
  return useQuery({
    queryKey: ["prospeccao_funis", "padrao", categoria],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospeccao_funis")
        .select("*")
        .eq("categoria", categoria)
        .eq("padrao", true)
        .maybeSingle();
      if (error) throw error;
      return data as ProspeccaoFunil | null;
    },
  });
}

export function useProspeccaoFunilEtapas(funilId?: string) {
  return useQuery({
    queryKey: ["prospeccao_funil_etapas", funilId],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospeccao_funil_etapas")
        .select("*")
        .eq("funil_id", funilId)
        .order("posicao", { ascending: true });
      if (error) throw error;
      return data as ProspeccaoFunilEtapa[];
    },
    enabled: !!funilId,
  });
}

interface MoverLeadEtapaInput {
  leadId: string;
  etapa: ProspeccaoFunilEtapa;
  statusAtual: ProspeccaoStatus;
}

/** Move o lead para uma nova etapa do funil e deriva o `status` quando a etapa é terminal
 * (ver src/lib/prospeccao/funil-utils.ts para a regra). */
export function useMoverLeadEtapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, etapa, statusAtual }: MoverLeadEtapaInput) => {
      const status = deriveTerminalStatus(etapa, statusAtual);
      const { error } = await db
        .from("prospeccao_leads")
        .update({ funil_id: etapa.funil_id, funil_etapa_id: etapa.id, status })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
    },
    onError: (err: Error) => {
      toast.error("Erro ao mover lead no funil", { description: err.message });
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
    },
  });
}
