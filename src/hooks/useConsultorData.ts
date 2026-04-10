import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Projeto, Organizacao, Profile, AppRole } from "@/types/database";

type ProjetoComOrg = Projeto & {
  organizacoes: Pick<Organizacao, "id" | "nome" | "cnpj"> | null;
};
type OrgMember = {
  id: string; organizacao_id: string; user_id: string; role: AppRole; created_at: string;
};
type OrgMemberComProfile = OrgMember & {
  profiles: Pick<Profile, "id" | "nome" | "email"> | null;
};
type OrgDetalhes = Organizacao & {
  projetos: Projeto[];
  organization_members: OrgMemberComProfile[];
};

export function useOrganizacoes() {
  return useQuery({
    queryKey: ["organizacoes"],
    queryFn: async (): Promise<Organizacao[]> => {
      const { data, error } = await supabase
        .from("organizacoes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjetosAll() {
  return useQuery({
    queryKey: ["projetos-all"],
    queryFn: async (): Promise<ProjetoComOrg[]> => {
      // 1. Fetch projetos — separate queries to avoid PostgREST FK join issues
      const { data: projetos, error } = await supabase
        .from("projetos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (!projetos || projetos.length === 0) return [];
      // 2. Fetch organizacoes relacionadas
      const orgIds = [...new Set(projetos.map((p) => p.organizacao_id).filter(Boolean))];
      const orgMap = new Map<string, Pick<Organizacao, "id" | "nome" | "cnpj">>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizacoes").select("id, nome, cnpj").in("id", orgIds);
        (orgs ?? []).forEach((o) => orgMap.set(o.id, { id: o.id, nome: o.nome, cnpj: o.cnpj }));
      }
      // 3. Combinar em JS
      return projetos.map((p) => ({ ...p, organizacoes: orgMap.get(p.organizacao_id) ?? null }));
    },
  });
}

export function useDocumentosPendentes() {
  return useQuery({
    queryKey: ["documentos-pendentes"],
    queryFn: async () => {
      // 1. Fetch status records (separate queries to avoid PostgREST FK join issues)
      const { data: statusData, error: statusErr } = await supabase
        .from("documentos_requeridos_status").select("*")
        .in("status", ["enviado", "em_analise"]).order("updated_at", { ascending: false });
      if (statusErr) throw statusErr;
      if (!statusData || statusData.length === 0) return [];
      // 2. Fetch related documentos_requeridos
      const reqIds = [...new Set(statusData.map((s) => s.documento_requerido_id).filter(Boolean))] as string[];
      const reqMap = new Map<string, { id: string; nome: string; descricao: string | null; fase: string; projeto_id: string }>();
      if (reqIds.length > 0) {
        const { data: reqDocs } = await supabase
          .from("documentos_requeridos").select("id, nome, descricao, fase, projeto_id").in("id", reqIds);
        (reqDocs ?? []).forEach((d) => reqMap.set(d.id, d));
      }
      // 3. Fetch related projetos
      const projetoIds = [...new Set([...reqMap.values()].map((r) => r.projeto_id).filter(Boolean))] as string[];
      const projetoMap = new Map<string, { id: string; nome: string; organizacao_id: string }>();
      if (projetoIds.length > 0) {
        const { data: projetos } = await supabase
          .from("projetos").select("id, nome, organizacao_id").in("id", projetoIds);
        (projetos ?? []).forEach((p) => projetoMap.set(p.id, p));
      }
      // 4. Fetch related organizacoes
      const orgIds = [...new Set([...projetoMap.values()].map((p) => p.organizacao_id).filter(Boolean))] as string[];
      const orgMap = new Map<string, { id: string; nome: string }>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizacoes").select("id, nome").in("id", orgIds);
        (orgs ?? []).forEach((o) => orgMap.set(o.id, o));
      }
      // 5. Fetch uploaded documentos
      const docIds = [...new Set(statusData.map((s) => s.documento_id).filter(Boolean))] as string[];
      const docMap = new Map<string, { id: string; nome: string; url: string | null; storage_path: string | null; drive_file_id: string | null }>();
      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from("documentos").select("id, nome, url, storage_path, drive_file_id").in("id", docIds);
        (docs ?? []).forEach((d) => docMap.set(d.id, d));
      }
      // 6. Combine in JS
      return statusData.map((s) => {
        const req = reqMap.get(s.documento_requerido_id ?? "") ?? null;
        const projeto = req ? projetoMap.get(req.projeto_id) ?? null : null;
        const org = projeto ? orgMap.get(projeto.organizacao_id) ?? null : null;
        return {
          ...s,
          documentos_requeridos: req
            ? { ...req, projetos: projeto ? { ...projeto, organizacoes: org } : null }
            : null,
          documentos: s.documento_id ? docMap.get(s.documento_id) ?? null : null,
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
        supabase.from("documentos_requeridos_status").select("id", { count: "exact" })
          .in("status", ["enviado", "em_analise"]),
      ]);
      return {
        totalOrganizacoes: orgsResult.count ?? 0,
        totalProjetos: projetosResult.count ?? 0,
        documentosPendentes: pendentesResult.count ?? 0,
      };
    },
  });
}

export function useOrganizacaoDetalhes(organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["organizacao", organizacaoId],
    queryFn: async (): Promise<OrgDetalhes | null> => {
      if (!organizacaoId) return null;
      // 1. Fetch organizacao — separate queries to avoid PostgREST FK join issues
      const { data: org, error: orgErr } = await supabase
        .from("organizacoes").select("*").eq("id", organizacaoId).maybeSingle();
      if (orgErr) throw orgErr;
      if (!org) return null;
      // 2. Fetch projetos da org
      const { data: projetos } = await supabase
        .from("projetos").select("*").eq("organizacao_id", organizacaoId);
      // 3. Fetch members da org
      const { data: members } = await supabase
        .from("organization_members").select("*").eq("organizacao_id", organizacaoId);
      // 4. Fetch profiles dos members
      const typedMembers = (members ?? []) as OrgMember[];
      const userIds = typedMembers.map((m) => m.user_id).filter(Boolean);
      const profileMap = new Map<string, Pick<Profile, "id" | "nome" | "email">>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles").select("id, nome, email").in("id", userIds);
        (profiles ?? []).forEach((p) =>
          profileMap.set(p.id, { id: p.id, nome: p.nome, email: p.email })
        );
      }
      // 5. Combinar em JS
      return {
        ...org,
        projetos: (projetos ?? []) as Projeto[],
        organization_members: typedMembers.map((m) => ({
          ...m,
          profiles: profileMap.get(m.user_id) ?? null,
        })),
      };
    },
    enabled: !!organizacaoId,
  });
}