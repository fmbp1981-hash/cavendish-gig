import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInvestigacoes } from "@/hooks/useInvestigacoes";

export interface Denuncia {
  id: string;
  ticket_id: string;
  categoria: string;
  descricao: string;
  data_ocorrido: string | null;
  envolvidos: string | null;
  status: string;
  observacoes_internas: string | null;
  analisado_por: string | null;
  analisado_em: string | null;
  created_at: string;
}

export function useDenuncias() {
  return useQuery({
    queryKey: ["denuncias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("denuncias")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Denuncia[];
    },
  });
}

export function useAtualizarDenuncia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      observacoes_internas,
    }: {
      id: string;
      status: string;
      observacoes_internas?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("denuncias")
        .update({
          status,
          observacoes_internas,
          analisado_por: user?.id,
          analisado_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["denuncias"] });
    },
  });
}

export interface DenunciasKPIs {
  total: number;
  emInvestigacao: number;
  resolvidas: number;
  semInvestigacao: number;
}

export function useDenunciasKPIs(): { data: DenunciasKPIs | undefined; isLoading: boolean } {
  const { data: denuncias, isLoading: loadDenuncias } = useDenuncias();
  const { data: investigacoes, isLoading: loadInv } = useInvestigacoes();

  const isLoading = loadDenuncias || loadInv;

  if (!denuncias || !investigacoes) {
    return { data: undefined, isLoading };
  }

  const total = denuncias.length;

  // Set of denuncia_ids that have an investigação
  const invByDenuncia = new Map(investigacoes.map(i => [i.denuncia_id, i]));

  const emInvestigacao = investigacoes.filter(
    i => i.status === "em_analise" || i.status === "investigando"
  ).length;

  const resolvidas = investigacoes.filter(
    i => i.status === "concluida" || i.status === "arquivada"
  ).length;

  const semInvestigacao = denuncias.filter(d => !invByDenuncia.has(d.id)).length;

  return {
    data: { total, emInvestigacao, resolvidas, semInvestigacao },
    isLoading,
  };
}

export async function enviarDenunciaAnonima(data: {
  categoria: string;
  descricao: string;
  data_ocorrido?: string;
  envolvidos?: string;
}): Promise<{ success: boolean; ticket_id?: string; ticket_secret?: string; error?: string }> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        process.env.VITE_SUPABASE_URL
      }/functions/v1/denuncias`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "Erro ao enviar denúncia" };
    }

    return { success: true, ticket_id: result.ticket_id, ticket_secret: result.ticket_secret };
  } catch (error) {
    console.error("Erro ao enviar denúncia:", error);
    return { success: false, error: "Erro de conexão. Tente novamente." };
  }
}
