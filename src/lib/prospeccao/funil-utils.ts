import type { ProspeccaoFunilEtapa, ProspeccaoStatus } from "@/types/prospeccao";

const PERDIDO_KEYWORDS = ["perdid", "desist", "recusa", "sem retorno", "não avançou", "nao avancou"];

/**
 * Deriva o `status` genérico do lead ao entrar numa etapa terminal do funil. Etapas não-terminais
 * não alteram o status. Etapas terminais de PERDA são reconhecidas por palavra-chave no nome —
 * etapas terminais de FECHAMENTO (ex.: "Negócio Fechado") não viram 'convertido' automaticamente
 * aqui: a conversão em organização é uma ação explícita (ver CAVENDISH_PROSPECCAO_BLUEPRINT.md §9),
 * não um efeito colateral de arrastar o card no kanban.
 */
export function deriveTerminalStatus(etapa: ProspeccaoFunilEtapa, currentStatus: ProspeccaoStatus): ProspeccaoStatus {
  if (!etapa.is_terminal) return currentStatus;
  const nome = etapa.nome.toLowerCase();
  if (PERDIDO_KEYWORDS.some((k) => nome.includes(k))) return "perdido";
  return currentStatus;
}

export function shouldScheduleFollowUp(etapa: ProspeccaoFunilEtapa): boolean {
  return !etapa.is_terminal && typeof etapa.followup_automatico_horas === "number" && etapa.followup_automatico_horas > 0;
}
