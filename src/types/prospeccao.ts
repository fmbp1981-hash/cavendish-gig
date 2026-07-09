// Tipos de domínio do módulo Finder (prospecção B2B). Centralizados aqui — desvio deliberado
// da convenção "tipo inline no hook" do resto do projeto, justificado pelo volume de hooks
// que compartilham os mesmos tipos (ver CAVENDISH_PROSPECCAO_BLUEPRINT.md §2/§5).
//
// `categoria` e `origem` são texto livre no banco (sem CHECK) — a validação de negócio vive
// só aqui, em TypeScript, para não exigir migration a cada categoria/fonte de lead nova.

export const PROSPECCAO_CATEGORIAS = [
  "sem_compliance_formal",
  "licitacao_publica",
  "acesso_credito_investimento",
  "fusao_aquisicao",
  "certificacao_iso",
  "grupo_empresarial",
  "parceiro_indicador",
] as const;

export type ProspeccaoCategoria = (typeof PROSPECCAO_CATEGORIAS)[number];

export const PROSPECCAO_ORIGENS = ["google_places", "import_csv", "import_xlsx", "manual"] as const;

/** Texto livre no banco — outras fontes (licitação pública, CNPJ aberto) podem ser plugadas
 * sem migration; esta lista cobre só as fontes já suportadas pela v1. */
export type ProspeccaoOrigem = (typeof PROSPECCAO_ORIGENS)[number] | (string & {});

export type ProspeccaoStatus =
  | "novo"
  | "contatado"
  | "qualificando"
  | "qualificado"
  | "proposta_enviada"
  | "negociando"
  | "convertido"
  | "perdido"
  | "sem_resposta";

export type ProspeccaoPorte = "pequena" | "media" | "grande";

export interface ProspeccaoLead {
  id: string;
  responsavel_id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  setor: string | null;
  porte_estimado: ProspeccaoPorte | null;
  categoria: ProspeccaoCategoria;
  origem: ProspeccaoOrigem;
  status: ProspeccaoStatus;
  funil_id: string | null;
  funil_etapa_id: string | null;
  busca_id: string | null;
  importacao_id: string | null;
  google_place_id: string | null;
  organizacao_id: string | null;
  reuniao_fechamento_id: string | null;
  ai_resumo: string | null;
  ai_score: number | null;
  ai_enriquecimento: Record<string, unknown>;
  modo_humano: boolean;
  ultimo_contato_em: string | null;
  proximo_followup_em: string | null;
  etapa_followup: number;
  tags: string[];
  observacoes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProspeccaoFunil {
  id: string;
  nome: string;
  categoria: ProspeccaoCategoria;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  padrao: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspeccaoFunilEtapa {
  id: string;
  funil_id: string;
  nome: string;
  posicao: number;
  cor: string | null;
  followup_automatico_horas: number | null;
  is_terminal: boolean;
  created_at: string;
}

export interface ProspeccaoBusca {
  id: string;
  responsavel_id: string;
  termo: string;
  localizacao: string;
  categoria: ProspeccaoCategoria;
  total_resultados: number;
  total_importados: number;
  created_at: string;
}

export type ProspeccaoImportacaoFormato = "csv" | "xlsx";
export type ProspeccaoImportacaoStatus = "processando" | "concluido" | "falhou" | "parcial";

export interface ProspeccaoImportacaoErro {
  linha: number;
  motivo: string;
}

export interface ProspeccaoImportacao {
  id: string;
  responsavel_id: string;
  nome_arquivo: string;
  formato: ProspeccaoImportacaoFormato;
  total_linhas: number;
  total_importados: number;
  total_falhas: number;
  total_duplicados: number;
  status: ProspeccaoImportacaoStatus;
  log_erros: ProspeccaoImportacaoErro[];
  created_at: string;
}

/** Deve bater com os providers aceitos pela Edge Function `ai-generate`. */
export type ProspeccaoAiProvider = "gemini" | "openai" | "claude";

export interface ProspeccaoAgentConfig {
  id: string;
  categoria: ProspeccaoCategoria;
  nome: string;
  system_prompt: string;
  ai_provider: ProspeccaoAiProvider;
  temperatura: number;
  max_iteracoes: number;
  usa_rag: boolean;
  rag_top_k: number;
  rag_similarity_threshold: number;
  ativo: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Chunk da base de conhecimento do RAG (Fase 10, opcional) — `embedding` não é exposto aqui
 * (vive só no banco como `vector(768)`, nunca precisa trafegar até o client). */
export interface ProspeccaoAgentKnowledge {
  id: string;
  categoria: ProspeccaoCategoria;
  titulo: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

export type ProspeccaoFollowupStatus =
  | "pendente"
  | "processando"
  | "enviado"
  | "cancelado"
  | "falhou"
  | "ignorado";

export interface ProspeccaoFilaFollowup {
  id: string;
  lead_id: string;
  enviar_em: string;
  status: ProspeccaoFollowupStatus;
  mensagem: string | null;
  enviado_em: string | null;
  erro: string | null;
  created_at: string;
}

export type ProspeccaoCampanhaStatus =
  | "rascunho"
  | "agendada"
  | "executando"
  | "pausada"
  | "concluida"
  | "falhou";

export interface ProspeccaoCampanha {
  id: string;
  responsavel_id: string;
  nome: string;
  categoria: ProspeccaoCategoria | null;
  funil_etapa_id: string | null;
  status: ProspeccaoCampanhaStatus;
  total_leads: number;
  total_enviados: number;
  total_respostas: number;
  agendada_para: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ProspeccaoCampanhaLeadStatus = "pendente" | "enviado" | "respondido" | "transferido" | "falhou";

export interface ProspeccaoCampanhaLead {
  id: string;
  campanha_id: string;
  lead_id: string;
  status: ProspeccaoCampanhaLeadStatus;
  enviado_em: string | null;
  created_at: string;
}

export type ProspeccaoConversaRole = "user" | "assistant" | "system";

export interface ProspeccaoConversa {
  id: string;
  lead_id: string;
  role: ProspeccaoConversaRole;
  conteudo: string;
  tipo: string;
  tokens_entrada: number | null;
  tokens_saida: number | null;
  custo_usd: number | null;
  created_at: string;
}

export interface ProspeccaoMetaRepresentante {
  id: string;
  representante_id: string;
  /** Primeiro dia do mês de referência (YYYY-MM-DD). */
  periodo_mes: string;
  meta_leads_contatados: number;
  meta_conversoes: number;
  created_at: string;
  updated_at: string;
}
