// Re-export types from Supabase generated types for backwards compatibility
// This file serves as a bridge to maintain existing imports while using the official Supabase types

export type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/integrations/supabase/types';

// Convenient type aliases
import type { Database, Tables } from '@/integrations/supabase/types';

// Enum types
export type AppRole = Database['public']['Enums']['app_role'];
export type FaseProjeto = Database['public']['Enums']['fase_projeto'];
export type TipoProjeto = Database['public']['Enums']['tipo_projeto'];
export type StatusDocumento = Database['public']['Enums']['status_documento'];

// Table row types
export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;
export type Organizacao = Tables<'organizacoes'>;
export type OrganizationMember = Tables<'organization_members'>;
export type Projeto = Tables<'projetos'>;
export type Documento = Tables<'documentos'>;
export type DocumentoCatalogo = Tables<'documentos_catalogo'>;
export type DocumentoRequerido = Tables<'documentos_requeridos'>;
export type DocumentoRequeridoStatus = Tables<'documentos_requeridos_status'>;
export type Notificacao = Tables<'notificacoes'>;
export type Tarefa = Tables<'tarefas'>;
export type Denuncia = Tables<'denuncias'>;
export type Diagnostico = Tables<'diagnosticos'>;
export type DiagnosticoPergunta = Tables<'diagnostico_perguntas'>;
export type DiagnosticoResposta = Tables<'diagnostico_respostas'>;
export type Treinamento = Tables<'treinamentos'>;
export type TreinamentoConteudo = Tables<'treinamento_conteudos'>;
export type TreinamentoQuiz = Tables<'treinamento_quiz'>;
export type TreinamentoInscricao = Tables<'treinamento_inscricoes'>;
export type TreinamentoCertificado = Tables<'treinamento_certificados'>;
export type CodigoEticaVersao = Tables<'codigo_etica_versoes'>;
export type CodigoEticaAdesao = Tables<'codigo_etica_adesoes'>;
export type ConsultorOrganizacao = Tables<'consultor_organizacoes'>;
export type AIGeneration = Tables<'ai_generations'>;

// Extended types with relations (for components that need joined data)
export interface DocumentoRequeridoComStatus extends DocumentoRequerido {
  status?: DocumentoRequeridoStatus;
}

export interface ProjetoComOrganizacao extends Projeto {
  organizacao?: Organizacao;
}

export interface TarefaComResponsavel extends Tarefa {
  responsavel?: Profile;
}
