import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrganizacoes() {
  return useQuery({
    queryKey: ["organizacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizacoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useProjetosAll() {
  return useQuery({
    queryKey: ["projetos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select(`
          *,
          organizacoes (
            id,
            nome,
            cnpj
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDocumentosPendentes() {
  return useQuery({
    queryKey: ["documentos-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_requeridos_status")
        .select(`
          *,
          documentos_requeridos (
            id,
            nome,
            descricao,
            fase,
            projeto_id,
            projetos (
              id,
              nome,
              organizacoes (
                id,
                nome
              )
            )
          ),
          documentos (
            id,
            nome,
            url,
            storage_path
          )
        `)
        .in("status", ["enviado", "em_analise"])
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useConsultorStats() {
  return useQuery({
    queryKey: ["consultor-stats"],
    queryFn: async () => {
      const [orgsResult, projetosResult, pendentesResult] = await Promise.all([
        supabase.from("organizacoes").select("id", { count: "exact" }),
        supabase.from("projetos").select("id", { count: "exact" }),
        supabase
          .from("documentos_requeridos_status")
          .select("id", { count: "exact" })
          .in("status", ["enviado", "em_analise"]),
      ]);

      return {
        totalOrganizacoes: orgsResult.count || 0,
        totalProjetos: projetosResult.count || 0,
        documentosPendentes: pendentesResult.count || 0,
      };
    },
  });
}

export function useOrganizacaoDetalhes(organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["organizacao", organizacaoId],
    queryFn: async () => {
      if (!organizacaoId) return null;

      const { data, error } = await supabase
        .from("organizacoes")
        .select(`
          *,
          projetos (
            *
          ),
          organization_members (
            *,
            profiles:user_id (
              id,
              nome,
              email
            )
          )
        `)
        .eq("id", organizacaoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!organizacaoId,
  });
}
