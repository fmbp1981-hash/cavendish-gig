import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRepresentantes } from "./useRepresentantes";
import type { ProspeccaoStatus } from "@/types/prospeccao";

const db = supabase as any;

function boundsDoMes(periodoMes: string): { inicio: string; fim: string } {
  const [ano, mes] = periodoMes.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, mes - 1, 1)).toISOString();
  const fim = new Date(Date.UTC(mes === 12 ? ano + 1 : ano, mes === 12 ? 0 : mes, 1)).toISOString();
  return { inicio, fim };
}

export interface DashboardTotaisMes {
  leadsProspectados: number;
  responderam: number;
  convertidos: number;
  taxaConversao: number;
}

export interface RankingRepresentanteLinha {
  representanteId: string;
  nome: string;
  leads: number;
  contatados: number;
  convertidos: number;
  taxaConversao: number;
  metaLeadsContatados: number | null;
  metaConversoes: number | null;
}

/** Agregações do dashboard do Finder, calculadas no client sobre uma janela de um mês (sem
 * embedded joins, convenção do projeto). Duas limitações conhecidas, documentadas aqui em vez de
 * inventar migration/RPC nova pra elas: `convertidos`/`taxaConversao` usam `updated_at` como
 * proxy de "quando converteu" (o schema não tem um `convertido_em` dedicado); `contatados` usa
 * `status !== 'novo'` como proxy de "já foi contatado" (não existe timestamp de primeiro
 * contato). `responderam` reaproveita o mesmo sinal já usado pela fórmula de ai_score (Fase 5):
 * pelo menos uma mensagem `role='user'` em prospeccao_conversas dentro do mês. */
export function useProspeccaoDashboardMes(periodoMes: string) {
  const { data: representantes } = useRepresentantes();

  return useQuery({
    queryKey: ["prospeccao_dashboard_mes", periodoMes, representantes?.map((r) => r.id).join(",")],
    enabled: !!representantes,
    queryFn: async () => {
      const { inicio, fim } = boundsDoMes(periodoMes);

      const [
        { data: leadsDoMes, error: erroLeads },
        { data: convertidosDoMes, error: erroConvertidos },
        { data: respostas, error: erroRespostas },
        { data: metas, error: erroMetas },
      ] = await Promise.all([
        db.from("prospeccao_leads").select("id, responsavel_id, status").gte("created_at", inicio).lt("created_at", fim),
        db.from("prospeccao_leads").select("id, responsavel_id").eq("status", "convertido").gte("updated_at", inicio).lt("updated_at", fim),
        db.from("prospeccao_conversas").select("lead_id").eq("role", "user").gte("created_at", inicio).lt("created_at", fim),
        db.from("prospeccao_metas_representante").select("*").eq("periodo_mes", `${periodoMes}-01`),
      ]);
      if (erroLeads) throw erroLeads;
      if (erroConvertidos) throw erroConvertidos;
      if (erroRespostas) throw erroRespostas;
      if (erroMetas) throw erroMetas;

      const leads = (leadsDoMes ?? []) as { id: string; responsavel_id: string; status: ProspeccaoStatus }[];
      const convertidos = (convertidosDoMes ?? []) as { id: string; responsavel_id: string }[];
      const responderamSet = new Set((respostas ?? []).map((r: { lead_id: string }) => r.lead_id));

      const totais: DashboardTotaisMes = {
        leadsProspectados: leads.length,
        responderam: responderamSet.size,
        convertidos: convertidos.length,
        taxaConversao: leads.length > 0 ? Math.round((convertidos.length / leads.length) * 1000) / 10 : 0,
      };

      const ranking: RankingRepresentanteLinha[] = (representantes ?? [])
        .map((rep) => {
          const leadsDoRep = leads.filter((l) => l.responsavel_id === rep.id);
          const contatadosDoRep = leadsDoRep.filter((l) => l.status !== "novo");
          const convertidosDoRep = convertidos.filter((c) => c.responsavel_id === rep.id);
          const meta = (metas ?? []).find((m: any) => m.representante_id === rep.id);
          return {
            representanteId: rep.id,
            nome: rep.nome || rep.email,
            leads: leadsDoRep.length,
            contatados: contatadosDoRep.length,
            convertidos: convertidosDoRep.length,
            taxaConversao: leadsDoRep.length > 0 ? Math.round((convertidosDoRep.length / leadsDoRep.length) * 1000) / 10 : 0,
            metaLeadsContatados: meta?.meta_leads_contatados ?? null,
            metaConversoes: meta?.meta_conversoes ?? null,
          };
        })
        .sort((a, b) => b.convertidos - a.convertidos || b.leads - a.leads);

      return { totais, ranking };
    },
  });
}

export interface FunilAgregadoItem {
  status: ProspeccaoStatus;
  total: number;
}

/** Snapshot atual do funil (todas categorias) — estado presente dos leads, não uma janela de
 * tempo (por isso não recebe `periodoMes`). */
export function useFunilAgregado() {
  return useQuery<FunilAgregadoItem[]>({
    queryKey: ["prospeccao_funil_agregado"],
    queryFn: async () => {
      const { data, error } = await db.from("prospeccao_leads").select("status");
      if (error) throw error;
      const contagem = new Map<string, number>();
      for (const row of (data ?? []) as { status: ProspeccaoStatus }[]) {
        contagem.set(row.status, (contagem.get(row.status) ?? 0) + 1);
      }
      return Array.from(contagem.entries()).map(([status, total]) => ({ status, total })) as FunilAgregadoItem[];
    },
  });
}

export interface ReuniaoFechamentoProxima {
  id: string;
  titulo: string;
  dataInicio: string;
  leadNome: string | null;
  representanteNome: string | null;
}

/** Reuniões de fechamento com o Alberto agendadas para os próximos 7 dias. Sem embedded joins:
 * busca as reuniões primeiro, depois resolve nomes de lead/representante em queries separadas. */
export function useReunioesFechamentoProximas() {
  return useQuery<ReuniaoFechamentoProxima[]>({
    queryKey: ["prospeccao_reunioes_fechamento_proximas"],
    queryFn: async () => {
      const agora = new Date();
      const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { data: reunioes, error } = await db
        .from("reunioes")
        .select("id, titulo, data_inicio, lead_id, representante_id")
        .eq("tipo", "fechamento_comercial")
        .eq("status", "agendada")
        .gte("data_inicio", agora.toISOString())
        .lte("data_inicio", em7dias.toISOString())
        .order("data_inicio", { ascending: true });
      if (error) throw error;

      const lista = (reunioes ?? []) as {
        id: string;
        titulo: string;
        data_inicio: string;
        lead_id: string | null;
        representante_id: string | null;
      }[];
      if (lista.length === 0) return [] as ReuniaoFechamentoProxima[];

      const leadIds = [...new Set(lista.map((r) => r.lead_id).filter((id): id is string => !!id))];
      const repIds = [...new Set(lista.map((r) => r.representante_id).filter((id): id is string => !!id))];

      const [{ data: leadsData }, { data: perfisData }] = await Promise.all([
        leadIds.length > 0 ? db.from("prospeccao_leads").select("id, nome").in("id", leadIds) : Promise.resolve({ data: [] }),
        repIds.length > 0 ? db.from("profiles").select("id, nome").in("id", repIds) : Promise.resolve({ data: [] }),
      ]);
      const leadsMap = new Map<string, string | null>((leadsData ?? []).map((l: any) => [l.id, l.nome]));
      const perfisMap = new Map<string, string | null>((perfisData ?? []).map((p: any) => [p.id, p.nome]));

      const resultado: ReuniaoFechamentoProxima[] = lista.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        dataInicio: r.data_inicio,
        leadNome: r.lead_id ? (leadsMap.get(r.lead_id) ?? null) : null,
        representanteNome: r.representante_id ? (perfisMap.get(r.representante_id) ?? null) : null,
      }));
      return resultado;
    },
  });
}
