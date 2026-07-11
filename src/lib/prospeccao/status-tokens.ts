// Tokens de status semântico (sucesso/alerta/perigo/info/neutro) usados em badges e pílulas do
// módulo Finder. Existem hoje pra parar de reinventar a mesma paleta em lugares diferentes (ex:
// score do lead em lead-card.tsx, badge de origem em clientes-view.tsx, badge de resultado em
// busca-historico.tsx cada um escolhendo seu próprio emerald/sky/amber "à mão"). Categorias de
// negócio (PROSPECCAO_CATEGORIA_INFO em categorias.ts) e etapas do funil (funil-etapa-cores.ts)
// continuam com paleta própria — são categóricas, não status semântico, não fazem sentido aqui.
export type StatusTom = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusClasses {
  /** Badge outline (usa `border`) — para status secundários ao lado de outros badges. */
  badge: string;
  /** Pílula preenchida — para indicadores compactos como o score do lead. */
  pill: string;
}

export const STATUS_TOKENS: Record<StatusTom, StatusClasses> = {
  success: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  warning: {
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  danger: {
    badge: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  },
  info: {
    badge: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    pill: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
  neutral: {
    badge: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
    pill: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
};

/** Score de IA do lead (0-100) → tom de status. Mesmo corte usado desde o redesign do kanban. */
export function scoreParaTom(score: number): StatusTom {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}
