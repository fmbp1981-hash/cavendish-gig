// Ferramentas (function-calling) do agente de IA do Finder — ver
// CAVENDISH_PROSPECCAO_BLUEPRINT.md §8.1. `converter_lead_organizacao`/`converter_lead_parceiro`
// ficam para a Fase 7 (não implementadas ainda) — de propósito não declaradas aqui ainda, pra não
// oferecer ao modelo uma tool que não faz nada de verdade.

export interface ToolDef {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

const STATUS_VALIDOS = [
  "novo", "contatado", "qualificando", "qualificado", "proposta_enviada",
  "negociando", "convertido", "perdido", "sem_resposta",
];

export const PROSPECCAO_TOOLS: ToolDef[] = [
  {
    name: "mover_etapa_funil",
    description:
      "Move o lead para uma nova etapa do funil de vendas quando a conversa avança para uma nova fase de qualificação.",
    parameters: {
      type: "object",
      properties: {
        nome_etapa: {
          type: "string",
          description: "Nome exato da etapa de destino (deve corresponder a uma etapa existente do funil da categoria do lead).",
        },
      },
      required: ["nome_etapa"],
    },
  },
  {
    name: "atualizar_lead",
    description: "Atualiza campos do lead com base no que foi descoberto durante a conversa.",
    parameters: {
      type: "object",
      properties: {
        ai_score: { type: "number", description: "Nota de 0 a 100 de quão qualificado está o lead." },
        observacoes: { type: "string", description: "Anotação curta sobre o que foi descoberto na conversa." },
        status: { type: "string", description: "Novo status do lead.", enum: STATUS_VALIDOS },
      },
      required: [],
    },
  },
  {
    name: "transferir_para_humano",
    description:
      "Transfere a conversa para um representante humano — use quando o lead pedir para falar com uma pessoa, fizer uma pergunta que a IA não deve responder sozinha, ou estiver pronto para negociar.",
    parameters: {
      type: "object",
      properties: { motivo: { type: "string", description: "Por que está transferindo." } },
      required: ["motivo"],
    },
  },
  {
    name: "agendar_followup",
    description: "Agenda uma mensagem de follow-up automática para mais tarde, quando o lead não responde ou pede para falar depois.",
    parameters: {
      type: "object",
      properties: {
        horas: { type: "number", description: "Em quantas horas a partir de agora enviar o follow-up." },
        mensagem: { type: "string", description: "Mensagem a enviar no follow-up." },
      },
      required: ["horas"],
    },
  },
];

/** Mesma regra de src/lib/prospeccao/funil-utils.ts (deriveTerminalStatus), duplicada porque
 * Edge Functions (Deno) não importam de src/ (runtime diferente do frontend). */
function deriveTerminalStatus(etapa: { is_terminal: boolean; nome: string }, statusAtual: string): string {
  if (!etapa.is_terminal) return statusAtual;
  const nome = etapa.nome.toLowerCase();
  const perdidoKeywords = ["perdid", "desist", "recusa", "sem retorno", "não avançou", "nao avancou"];
  if (perdidoKeywords.some((k) => nome.includes(k))) return "perdido";
  return statusAtual;
}

export interface ToolResultado {
  success: boolean;
  error?: string;
}

export async function executarTool(
  service: any,
  lead: Record<string, any>,
  toolName: string,
  args: Record<string, any>,
): Promise<ToolResultado> {
  switch (toolName) {
    case "mover_etapa_funil": {
      if (!lead.funil_id) return { success: false, error: "Lead não está associado a nenhum funil" };
      const { data: etapa } = await service
        .from("prospeccao_funil_etapas")
        .select("id, nome, is_terminal")
        .eq("funil_id", lead.funil_id)
        .ilike("nome", args.nome_etapa)
        .maybeSingle();
      if (!etapa) return { success: false, error: `Etapa "${args.nome_etapa}" não encontrada no funil deste lead` };
      const status = deriveTerminalStatus(etapa, lead.status);
      const { error } = await service.from("prospeccao_leads").update({ funil_etapa_id: etapa.id, status }).eq("id", lead.id);
      if (error) return { success: false, error: error.message };
      lead.funil_etapa_id = etapa.id;
      lead.status = status;
      return { success: true };
    }

    case "atualizar_lead": {
      const update: Record<string, unknown> = {};
      if (typeof args.ai_score === "number") update.ai_score = Math.max(0, Math.min(100, Math.round(args.ai_score)));
      if (typeof args.observacoes === "string" && args.observacoes.trim()) update.observacoes = args.observacoes.trim();
      if (typeof args.status === "string" && STATUS_VALIDOS.includes(args.status)) update.status = args.status;
      if (Object.keys(update).length === 0) return { success: true };
      const { error } = await service.from("prospeccao_leads").update(update).eq("id", lead.id);
      if (error) return { success: false, error: error.message };
      Object.assign(lead, update);
      return { success: true };
    }

    case "transferir_para_humano": {
      const { error } = await service.from("prospeccao_leads").update({ modo_humano: true }).eq("id", lead.id);
      if (error) return { success: false, error: error.message };
      await service
        .from("prospeccao_fila_followup")
        .update({ status: "cancelado" })
        .eq("lead_id", lead.id)
        .eq("status", "pendente");
      lead.modo_humano = true;
      return { success: true };
    }

    case "agendar_followup": {
      const horas = typeof args.horas === "number" && args.horas > 0 ? args.horas : 24;
      const enviarEm = new Date(Date.now() + horas * 3_600_000).toISOString();
      const { error } = await service.from("prospeccao_fila_followup").insert({
        lead_id: lead.id,
        enviar_em: enviarEm,
        mensagem: typeof args.mensagem === "string" ? args.mensagem : null,
      });
      if (error) return { success: false, error: error.message };
      await service.from("prospeccao_leads").update({ proximo_followup_em: enviarEm }).eq("id", lead.id);
      return { success: true };
    }

    default:
      return { success: false, error: `Tool desconhecida: ${toolName}` };
  }
}
