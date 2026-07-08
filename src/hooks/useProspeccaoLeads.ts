import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProspeccaoLead, ProspeccaoCategoria, ProspeccaoStatus } from "@/types/prospeccao";

// Tabelas do módulo Finder ainda não estão no types.ts gerado — mesmo padrão de useESG.ts/
// useFornecedores.ts (tabelas novas do projeto) até uma regeneração dos tipos do Supabase.
const db = supabase as any;

export interface ProspeccaoLeadFiltros {
  categoria?: ProspeccaoCategoria;
  status?: ProspeccaoStatus;
  /** Escopo do representante — quando omitido, RLS já restringe para o próprio usuário; admin vê todos. */
  responsavelId?: string;
}

export function useProspeccaoLeads(filtros?: ProspeccaoLeadFiltros) {
  return useQuery({
    queryKey: ["prospeccao_leads", filtros],
    queryFn: async () => {
      let query = db
        .from("prospeccao_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (filtros?.categoria) query = query.eq("categoria", filtros.categoria);
      if (filtros?.status) query = query.eq("status", filtros.status);
      if (filtros?.responsavelId) query = query.eq("responsavel_id", filtros.responsavelId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProspeccaoLead[];
    },
  });
}

export function useProspeccaoLead(id?: string) {
  return useQuery({
    queryKey: ["prospeccao_leads", "detalhe", id],
    queryFn: async () => {
      const { data, error } = await db.from("prospeccao_leads").select("*").eq("id", id).single();
      if (error) throw error;
      return data as ProspeccaoLead;
    },
    enabled: !!id,
  });
}

export interface NovoProspeccaoLead {
  responsavel_id: string;
  nome: string;
  categoria: ProspeccaoCategoria;
  cnpj?: string;
  telefone?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  setor?: string;
  origem?: string;
  observacoes?: string;
}

export function useCreateProspeccaoLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: NovoProspeccaoLead) => {
      // Entra direto na primeira etapa do funil padrão da categoria, se existir, para já aparecer
      // no kanban sem precisar de um passo manual de "adicionar ao funil".
      const { data: funil } = await db
        .from("prospeccao_funis")
        .select("id")
        .eq("categoria", lead.categoria)
        .eq("padrao", true)
        .maybeSingle();

      let primeiraEtapaId: string | null = null;
      if (funil) {
        const { data: etapa } = await db
          .from("prospeccao_funil_etapas")
          .select("id")
          .eq("funil_id", funil.id)
          .order("posicao", { ascending: true })
          .limit(1)
          .maybeSingle();
        primeiraEtapaId = etapa?.id ?? null;
      }

      const { data, error } = await db
        .from("prospeccao_leads")
        .insert({ ...lead, funil_id: funil?.id ?? null, funil_etapa_id: primeiraEtapaId })
        .select()
        .single();
      if (error) throw error;
      return data as ProspeccaoLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      toast.success("Lead cadastrado");
    },
    onError: (err: Error) => toast.error("Erro ao cadastrar lead", { description: err.message }),
  });
}

export function useUpdateProspeccaoLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<ProspeccaoLead>) => {
      const { error } = await db.from("prospeccao_leads").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
    },
    onError: (err: Error) => toast.error("Erro ao atualizar lead", { description: err.message }),
  });
}

export function useDeleteProspeccaoLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("prospeccao_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      toast.success("Lead removido");
    },
    onError: (err: Error) => toast.error("Erro ao remover lead", { description: err.message }),
  });
}
