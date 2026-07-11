import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

const db = supabase as any;

export type OrigemCliente = "finder" | "direto";

export interface ClienteGeral {
  organizacaoId: string;
  nome: string;
  cnpj: string | null;
  createdAt: string;
  origem: OrigemCliente;
  /** Só preenchido quando `origem === "finder"`. */
  categoriaProspeccao: ProspeccaoCategoria | null;
  /** Só preenchido quando `origem === "finder"`. */
  representanteNome: string | null;
}

/** Todos os clientes (organizações) do sistema, com a origem de cada um. "finder" é
 * determinável com segurança (existe um `prospeccao_leads.organizacao_id` real apontando pra
 * essa organização, criado só por `converter_lead_organizacao`); tudo o que não tem esse vínculo
 * cai em "direto" — cadastro manual pelo admin (`AdminOrganizacoes.tsx`) ou onboarding
 * self-service do próprio cliente (`create_client_onboarding`). Não dá pra distinguir essas duas
 * sub-origens com o schema atual (nenhuma delas grava uma marca de origem em `organizacoes`) —
 * inventar uma heurística pra separar seria mais enganoso do que agrupar como "direto". */
export function useClientesGeral() {
  return useQuery({
    queryKey: ["clientes_geral"],
    queryFn: async () => {
      const { data: orgs, error: erroOrgs } = await db
        .from("organizacoes")
        .select("id, nome, cnpj, created_at")
        .order("created_at", { ascending: false });
      if (erroOrgs) throw erroOrgs;
      if (!orgs || orgs.length === 0) return [] as ClienteGeral[];

      const { data: leads, error: erroLeads } = await db
        .from("prospeccao_leads")
        .select("organizacao_id, categoria, responsavel_id")
        .not("organizacao_id", "is", null);
      if (erroLeads) throw erroLeads;

      const repIds = [...new Set((leads ?? []).map((l: any) => l.responsavel_id))];
      const { data: perfis } = repIds.length > 0
        ? await db.from("profiles").select("id, nome").in("id", repIds)
        : { data: [] };
      const perfisMap = new Map<string, string>((perfis ?? []).map((p: any) => [p.id, p.nome]));

      const leadsPorOrg = new Map<string, { categoria: ProspeccaoCategoria; representanteNome: string }>();
      for (const l of leads ?? []) {
        if (!leadsPorOrg.has(l.organizacao_id)) {
          leadsPorOrg.set(l.organizacao_id, {
            categoria: l.categoria,
            representanteNome: perfisMap.get(l.responsavel_id) ?? "—",
          });
        }
      }

      return orgs.map((o: any): ClienteGeral => {
        const origemFinder = leadsPorOrg.get(o.id);
        return {
          organizacaoId: o.id,
          nome: o.nome,
          cnpj: o.cnpj,
          createdAt: o.created_at,
          origem: origemFinder ? "finder" : "direto",
          categoriaProspeccao: origemFinder?.categoria ?? null,
          representanteNome: origemFinder?.representanteNome ?? null,
        };
      });
    },
  });
}
