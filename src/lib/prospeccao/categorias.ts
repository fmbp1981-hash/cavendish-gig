import type { ProspeccaoCategoria } from "@/types/prospeccao";

interface CategoriaInfo {
  label: string;
  /** Classes Tailwind para o badge (bg + texto), mesmo estilo usado em outros badges do projeto. */
  className: string;
}

// Ver CAVENDISH_PROSPECCAO_BLUEPRINT.md §0.1 para a origem de negócio de cada categoria.
export const PROSPECCAO_CATEGORIA_INFO: Record<ProspeccaoCategoria, CategoriaInfo> = {
  sem_compliance_formal: {
    label: "Sem compliance formal",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  licitacao_publica: {
    label: "Licitação pública",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  acesso_credito_investimento: {
    label: "Crédito/Investimento",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  fusao_aquisicao: {
    label: "Fusão/Aquisição",
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  certificacao_iso: {
    label: "Certificação ISO",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  grupo_empresarial: {
    label: "Grupo empresarial",
    className: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
  parceiro_indicador: {
    label: "Parceiro indicador",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

export function getCategoriaLabel(categoria: ProspeccaoCategoria): string {
  return PROSPECCAO_CATEGORIA_INFO[categoria]?.label ?? categoria;
}
