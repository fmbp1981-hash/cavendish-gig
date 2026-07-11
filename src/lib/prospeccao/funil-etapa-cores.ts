// Paleta de cores por etapa do funil do Finder — mapeada pelo nome normalizado das 7 etapas
// padrão (ver 20260709030000_finder_funil_stages_prospect_pulse.sql). Etapas de um funil
// customizado que não batam com nenhum nome conhecido caem no fallback por posição/is_terminal,
// pra nunca ficar sem cor mesmo se o admin renomear etapas no futuro (tela de config de funis
// ainda não existe — ver docs/FINDER_SPEC.md).
export interface EtapaCores {
  dot: string;
  bar: string;
  headerText: string;
  badge: string;
  ring: string;
  tint: string;
}

const NOVO_LEAD: EtapaCores = {
  dot: "bg-sky-500",
  bar: "bg-sky-500",
  headerText: "text-sky-700 dark:text-sky-400",
  badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  ring: "ring-sky-300 dark:ring-sky-500/40",
  tint: "bg-sky-50/70 dark:bg-sky-500/5",
};

const CONTATO_INICIAL: EtapaCores = {
  dot: "bg-cyan-500",
  bar: "bg-cyan-500",
  headerText: "text-cyan-700 dark:text-cyan-400",
  badge: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
  ring: "ring-cyan-300 dark:ring-cyan-500/40",
  tint: "bg-cyan-50/70 dark:bg-cyan-500/5",
};

const QUALIFICACAO: EtapaCores = {
  dot: "bg-amber-500",
  bar: "bg-amber-500",
  headerText: "text-amber-700 dark:text-amber-400",
  badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  ring: "ring-amber-300 dark:ring-amber-500/40",
  tint: "bg-amber-50/70 dark:bg-amber-500/5",
};

const TRANSFERIDO: EtapaCores = {
  dot: "bg-violet-500",
  bar: "bg-violet-500",
  headerText: "text-violet-700 dark:text-violet-400",
  badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
  ring: "ring-violet-300 dark:ring-violet-500/40",
  tint: "bg-violet-50/70 dark:bg-violet-500/5",
};

const FECHADO_GANHO: EtapaCores = {
  dot: "bg-emerald-500",
  bar: "bg-emerald-500",
  headerText: "text-emerald-700 dark:text-emerald-400",
  badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  ring: "ring-emerald-300 dark:ring-emerald-500/40",
  tint: "bg-emerald-50/70 dark:bg-emerald-500/5",
};

const FECHADO_PERDIDO: EtapaCores = {
  dot: "bg-rose-500",
  bar: "bg-rose-500",
  headerText: "text-rose-700 dark:text-rose-400",
  badge: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  ring: "ring-rose-300 dark:ring-rose-500/40",
  tint: "bg-rose-50/70 dark:bg-rose-500/5",
};

const FOLLOW_UP: EtapaCores = {
  dot: "bg-slate-400",
  bar: "bg-slate-400",
  headerText: "text-slate-600 dark:text-slate-300",
  badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
  ring: "ring-slate-300 dark:ring-slate-500/40",
  tint: "bg-slate-50/70 dark:bg-slate-500/5",
};

const CORES_POR_NOME: Record<string, EtapaCores> = {
  "novo lead": NOVO_LEAD,
  "contato inicial": CONTATO_INICIAL,
  "qualificação": QUALIFICACAO,
  "qualificacao": QUALIFICACAO,
  "transferido para consultor": TRANSFERIDO,
  "fechado ganho": FECHADO_GANHO,
  "fechado perdido": FECHADO_PERDIDO,
  "follow-up": FOLLOW_UP,
  "followup": FOLLOW_UP,
};

const FALLBACK_PALETTE: EtapaCores[] = [NOVO_LEAD, CONTATO_INICIAL, QUALIFICACAO, TRANSFERIDO, FOLLOW_UP];

export function getEtapaCores(nome: string, posicao = 1, isTerminal = false): EtapaCores {
  const chave = nome.trim().toLowerCase();
  if (CORES_POR_NOME[chave]) return CORES_POR_NOME[chave];
  if (isTerminal) return /perdid/.test(chave) ? FECHADO_PERDIDO : FECHADO_GANHO;
  return FALLBACK_PALETTE[Math.max(0, posicao - 1) % FALLBACK_PALETTE.length];
}
