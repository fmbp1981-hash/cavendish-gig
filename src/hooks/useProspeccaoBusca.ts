import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buscarGooglePlaces, type BuscarGooglePlacesInput } from "@/lib/prospeccao/google-places-client";
import type { ProspeccaoBusca } from "@/types/prospeccao";

const db = supabase as any;

export function useHistoricoBusca(responsavelId?: string) {
  return useQuery({
    queryKey: ["prospeccao_buscas", responsavelId],
    queryFn: async () => {
      let query = db.from("prospeccao_buscas").select("*").order("created_at", { ascending: false }).limit(20);
      if (responsavelId) query = query.eq("responsavel_id", responsavelId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ProspeccaoBusca[];
    },
  });
}

export function useBuscarGooglePlaces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BuscarGooglePlacesInput) => buscarGooglePlaces(input),
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      queryClient.invalidateQueries({ queryKey: ["prospeccao_buscas"] });
      toast.success("Busca concluída", {
        description: `${resultado.totalImportados} leads importados, ${resultado.totalDuplicados} duplicados de ${resultado.totalResultados} resultados.`,
      });
    },
    onError: (err: Error) => toast.error("Erro na busca", { description: err.message }),
  });
}
