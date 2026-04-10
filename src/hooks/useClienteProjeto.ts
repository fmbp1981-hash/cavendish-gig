import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Projeto, Organizacao } from "@/types/database";

interface ProjetoComOrganizacao extends Projeto {
  organizacao?: Organizacao;
}

export interface DocumentoArquivoProjeto {
  id: string;
  nome: string;
  url: string | null;
  storage_path: string | null;
  drive_file_id: string | null;
  tipo: string | null;
  tamanho_bytes: number | null;
  created_at: string;
}

export function useClienteProjeto() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cliente-projeto", user?.id],
    queryFn: async (): Promise<ProjetoComOrganizacao | null> => {
      if (!user) return null;

      // Get organization membership
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organizacao_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership?.organizacao_id) return null;

      // Get organization details
      const { data: organizacao } = await supabase
        .from("organizacoes")
        .select("*")
        .eq("id", membership.organizacao_id)
        .maybeSingle();

      // Get active project
      const { data: projeto } = await supabase
        .from("projetos")
        .select("*")
        .eq("organizacao_id", membership.organizacao_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!projeto) return null;

      return {
        ...projeto,
        organizacao: organizacao || undefined,
      } as unknown as ProjetoComOrganizacao;
    },
    enabled: !!user,
  });
}

export function useDocumentosRequeridosProjeto(projetoId: string | undefined, organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["documentos-requeridos-projeto", projetoId],
    queryFn: async () => {
      if (!projetoId || !organizacaoId) return [];

      // Get required documents for the project
      const { data: documentos, error: docError } = await supabase
        .from("documentos_requeridos")
        .select("*")
        .eq("projeto_id", projetoId)
        .order("fase")
        .order("ordem", { ascending: true });

      if (docError) throw docError;

      // Get status for each document (separate queries to avoid PostgREST FK join issues)
      const docIds = documentos?.map((d: any) => d.id) || [];
      if (docIds.length === 0) {
        return (documentos || []).map((doc: any) => ({ ...doc, status: null }));
      }

      const { data: statusList, error: statusError } = await supabase
        .from("documentos_requeridos_status")
        .select("*")
        .in("documento_requerido_id", docIds);

      if (statusError) console.error("Status fetch error:", statusError);

      // Fetch uploaded documents separately
      const uploadedDocIds = (statusList || []).map((s: any) => s.documento_id).filter(Boolean);
      let docsMap = new Map();
      if (uploadedDocIds.length > 0) {
        const { data: uploadedDocs } = await supabase
          .from("documentos")
          .select("id, nome, url, storage_path, drive_file_id, tipo, tamanho_bytes, created_at")
          .in("id", uploadedDocIds);
        docsMap = new Map((uploadedDocs || []).map((d: any) => [d.id, d]));
      }

      // Map status + uploaded docs to required documents
      const statusMap = new Map((statusList || []).map((s: any) => [
        s.documento_requerido_id,
        { ...s, documentos: s.documento_id ? docsMap.get(s.documento_id) || null : null }
      ]));

      return (documentos || []).map((doc: any) => ({
        ...doc,
        status: statusMap.get(doc.id) || null,
      }));
    },
    enabled: !!projetoId && !!organizacaoId,
  });
}
