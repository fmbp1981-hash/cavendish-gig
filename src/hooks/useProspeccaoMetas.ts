import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProspeccaoMetaRepresentante } from "@/types/prospeccao";

const db = supabase as any;

export function useProspeccaoMetas(periodoMes: string) {
  return useQuery({
    queryKey: ["prospeccao_metas", periodoMes],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospeccao_metas_representante")
        .select("*")
        .eq("periodo_mes", `${periodoMes}-01`);
      if (error) throw error;
      return data as ProspeccaoMetaRepresentante[];
    },
  });
}

interface UpsertMetaInput {
  representanteId: string;
  /** YYYY-MM — convertido para o primeiro dia do mês antes de gravar. */
  periodoMes: string;
  metaLeadsContatados: number;
  metaConversoes: number;
}

export function useUpsertMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertMetaInput) => {
      const { error } = await db.from("prospeccao_metas_representante").upsert(
        {
          representante_id: input.representanteId,
          periodo_mes: `${input.periodoMes}-01`,
          meta_leads_contatados: input.metaLeadsContatados,
          meta_conversoes: input.metaConversoes,
        },
        { onConflict: "representante_id,periodo_mes" },
      );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_metas", variables.periodoMes] });
      queryClient.invalidateQueries({ queryKey: ["prospeccao_dashboard_mes"] });
      toast.success("Meta salva");
    },
    onError: (err: Error) => toast.error("Erro ao salvar meta", { description: err.message }),
  });
}
