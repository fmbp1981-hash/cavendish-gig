import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProspeccaoCampanha, ProspeccaoCategoria, ProspeccaoStatus } from "@/types/prospeccao";

const db = supabase as any;

export function useProspeccaoCampanhas(responsavelId?: string) {
  return useQuery({
    queryKey: ["prospeccao_campanhas", responsavelId],
    queryFn: async () => {
      let query = db.from("prospeccao_campanhas").select("*").order("created_at", { ascending: false });
      if (responsavelId) query = query.eq("responsavel_id", responsavelId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ProspeccaoCampanha[];
    },
  });
}

interface NovaCampanhaInput {
  responsavelId: string;
  nome: string;
  mensagem: string;
  categoria?: ProspeccaoCategoria;
  statusFiltro?: ProspeccaoStatus;
}

/** Cria a campanha e já popula prospeccao_campanha_leads com os leads que casam com o filtro
 * (categoria/status), no escopo do responsável — evita uma etapa separada de "adicionar leads". */
export function useCreateCampanha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NovaCampanhaInput) => {
      let leadsQuery = db.from("prospeccao_leads").select("id").eq("responsavel_id", input.responsavelId);
      if (input.categoria) leadsQuery = leadsQuery.eq("categoria", input.categoria);
      if (input.statusFiltro) leadsQuery = leadsQuery.eq("status", input.statusFiltro);
      const { data: leads, error: erroLeads } = await leadsQuery;
      if (erroLeads) throw erroLeads;

      const { data: campanha, error: erroCampanha } = await db
        .from("prospeccao_campanhas")
        .insert({
          responsavel_id: input.responsavelId,
          nome: input.nome,
          categoria: input.categoria ?? null,
          total_leads: leads?.length ?? 0,
          metadata: { mensagem: input.mensagem },
        })
        .select()
        .single();
      if (erroCampanha) throw erroCampanha;

      if (leads && leads.length > 0) {
        const rows = leads.map((l: { id: string }) => ({ campanha_id: campanha.id, lead_id: l.id }));
        const { error: erroInsert } = await db.from("prospeccao_campanha_leads").insert(rows);
        if (erroInsert) throw erroInsert;
      }

      return campanha as ProspeccaoCampanha;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_campanhas"] });
      toast.success("Campanha criada");
    },
    onError: (err: Error) => toast.error("Erro ao criar campanha", { description: err.message }),
  });
}

export function useDispararCampanha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campanhaId: string) => {
      const { data, error } = await supabase.functions.invoke("prospeccao-campaign-dispatch", { body: { campanhaId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; totalAlvos: number; enviados: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_campanhas"] });
      toast.success("Campanha disparada", { description: `${data.enviados} de ${data.totalAlvos} mensagens enviadas.` });
    },
    onError: (err: Error) => toast.error("Erro ao disparar campanha", { description: err.message }),
  });
}
