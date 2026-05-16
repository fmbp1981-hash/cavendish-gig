import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Diagnostico } from "./useDiagnostico";

export type SetorType = 'varejo' | 'financeiro' | 'saude' | 'industria' | 'servicos' | 'agronegocio';

export const SETOR_LABELS: Record<SetorType, string> = {
  varejo: 'Varejo',
  financeiro: 'Financeiro',
  saude: 'Saúde',
  industria: 'Indústria',
  servicos: 'Serviços',
  agronegocio: 'Agronegócio',
};

export const SETORES = Object.entries(SETOR_LABELS) as [SetorType, string][];

// Each diagnostic dimension maps to one or more benchmark pillars (averaged when >1)
const DIMENSAO_PILAR_MAP: Record<string, string[]> = {
  estrutura_societaria: ['liderança'],
  governanca:           ['auditoria'],
  compliance:           ['politicas', 'denuncia'],
  gestao:               ['treinamento'],
  planejamento:         ['canais'],
};

const DIMENSAO_LABELS: Record<string, string> = {
  estrutura_societaria: 'Estrutura Societária',
  governanca:           'Governança',
  compliance:           'Compliance',
  gestao:               'Gestão',
  planejamento:         'Planejamento',
};

export interface BenchmarkPonto {
  dimensao: string;
  label: string;
  scoreCliente: number;
  scoreMedio: number;
  percentil75: number;
  percentil25: number;
  nEmpresas: number;
}

function avg(vals: number[]): number {
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function useBenchmarkSetorial(
  setor: string | null | undefined,
  diagnostico: Diagnostico | null | undefined
) {
  const setorFinal = (setor as SetorType) || 'servicos';

  const { data: benchmarks, isLoading } = useQuery({
    queryKey: ['benchmark-setorial', setorFinal],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostico_benchmarks')
        .select('*')
        .eq('setor', setorFinal);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pontos: BenchmarkPonto[] = Object.entries(DIMENSAO_PILAR_MAP).map(([dimensao, pilares]) => {
    const rows = (benchmarks ?? []).filter(b => pilares.includes(b.pilar));

    const scoreMedio   = avg(rows.map(r => r.score_medio));
    const percentil75  = avg(rows.map(r => r.percentil_75 ?? r.score_medio));
    const percentil25  = avg(rows.map(r => r.percentil_25 ?? r.score_medio));
    const nEmpresas    = rows[0]?.n_empresas ?? 0;

    const scoreKey = `score_${dimensao}` as keyof Diagnostico;
    const scoreCliente = diagnostico ? Math.round((diagnostico[scoreKey] as number | null) ?? 0) : 0;

    return {
      dimensao,
      label: DIMENSAO_LABELS[dimensao],
      scoreCliente,
      scoreMedio,
      percentil75,
      percentil25,
      nEmpresas,
    };
  });

  return { pontos, isLoading, setor: setorFinal };
}
