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
      // 1. Fetch status records (separate queries to avoid PostgREST FK join issues)
      const { data: statusData, error: statusErr } = await supabase
        .from("documentos_requeridos_status")
        .select("*")
        .in("status", ["enviado", "em_analise"])
        .order("updated_at", { ascending: false });

      if (statusErr) throw statusErr;
      if (!statusData || statusData.length === 0) return [];

      // 2. Fetch related documentos_requeridos
      const reqIds = [...new Set(statusData.map((s: any) => s.documento_requerido_id).filter(Boolean))];
      let reqMap = new Map();
      if (reqIds.length > 0) {
        const { data: reqDocs } = await supabase
          .from("documentos_requeridos")
          .select("id, nome, descricao, fase, projeto_id")
          .in("id", reqIds);
        reqMap = new Map((reqDocs || []).map((d: any) => [d.id, d]));
      }

      // 3. Fetch related projetos
      const projetoIds = [...new Set([...reqMap.values()].map((r: any) => r.projeto_id).filter(Boolean))];
      let projetoMap = new Map();
      if (projetoIds.length > 0) {
        const { data: projetos } = await supabase
          .from("projetos")
          .select("id, nome, organizacao_id")
          .in("id", projetoIds);
        projetoMap = new Map((projetos || []).map((p: any) => [p.id, p]));
      }

      // 4. Fetch related organizacoes
      const orgIds = [...new Set([...projetoMap.values()].map((p: any) => p.organizacao_id).filter(Boolean))];
      let orgMap = new Map();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizacoes")
          .select("id, nome")
          .in("id", orgIds);
        orgMap = new Map((orgs || []).map((o: any) => [o.id, o]));
      }

      // 5. Fetch uploaded documentos
      const docIds = [...new Set(statusData.map((s: any) => s.documento_id).filter(Boolean))];
      let docMap = new Map();
      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from("documentos")
          .select("id, nome, url, storage_path, drive_file_id")
          .in("id", docIds);
        docMap = new Map((docs || []).map((d: any) => [d.id, d]));
      }

      // 6. Combine in JS (reconstruct nested structure)
      return statusData.map((s: any) => {
        const req = reqMap.get(s.documento_requerido_id) || null;
        const projeto = req ? projetoMap.get(req.projeto_id) || null : null;
        const org = projeto ? orgMap.get(projeto.organizacao_id) || null : null;
        return {
          ...s,
          documentos_requeridos: req ? {
            ...req,
            projetos: projeto ? { ...projeto, organizacoes: org } : null,
          } : null,
          documentos: s.documento_id ? docMap.get(s.documento_id) || null : null,
        };
      });
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
