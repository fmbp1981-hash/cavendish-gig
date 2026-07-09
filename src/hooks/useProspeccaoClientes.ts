import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

const db = supabase as any;

export interface ClienteConvertido {
  leadId: string;
  organizacaoId: string;
  nomeOrganizacao: string;
  cnpj: string | null;
  categoria: ProspeccaoCategoria;
  representanteNome: string;
  /** `updated_at` do lead como proxy de "quando converteu" — mesma limitação já documentada e
   * aceita no dashboard do Finder (Fase 8): não existe um `convertido_em` dedicado no schema. */
  convertidoEm: string;
}

/** Clientes que vieram da prospecção do Finder — leads que passaram pelo funil, fecharam e
 * viraram uma organização real (via `converter_lead_organizacao`). Não confundir com
 * `/admin/organizacoes`, que lista TODAS as organizações (inclusive as criadas manualmente pelo
 * admin, sem nenhuma origem de prospecção). */
export function useClientesConvertidos() {
  return useQuery({
    queryKey: ["prospeccao_clientes_convertidos"],
    queryFn: async () => {
      const { data: leads, error: erroLeads } = await db
        .from("prospeccao_leads")
        .select("id, organizacao_id, categoria, responsavel_id, updated_at")
        .eq("status", "convertido")
        .not("organizacao_id", "is", null)
        .order("updated_at", { ascending: false });
      if (erroLeads) throw erroLeads;
      if (!leads || leads.length === 0) return [] as ClienteConvertido[];

      const orgIds = [...new Set(leads.map((l: any) => l.organizacao_id))];
      const repIds = [...new Set(leads.map((l: any) => l.responsavel_id))];

      const [{ data: orgs }, { data: perfis }] = await Promise.all([
        db.from("organizacoes").select("id, nome, cnpj").in("id", orgIds),
        db.from("profiles").select("id, nome").in("id", repIds),
      ]);
      const orgsMap = new Map<string, { nome: string; cnpj: string | null }>(
        (orgs ?? []).map((o: any) => [o.id, { nome: o.nome, cnpj: o.cnpj }]),
      );
      const perfisMap = new Map<string, string>((perfis ?? []).map((p: any) => [p.id, p.nome]));

      return leads
        .filter((l: any) => orgsMap.has(l.organizacao_id))
        .map((l: any): ClienteConvertido => {
          const org = orgsMap.get(l.organizacao_id)!;
          return {
            leadId: l.id,
            organizacaoId: l.organizacao_id,
            nomeOrganizacao: org.nome,
            cnpj: org.cnpj,
            categoria: l.categoria,
            representanteNome: perfisMap.get(l.responsavel_id) ?? "—",
            convertidoEm: l.updated_at,
          };
        });
    },
  });
}
