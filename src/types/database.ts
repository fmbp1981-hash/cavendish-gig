export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 'admin' | 'consultor' | 'parceiro' | 'cliente';
export type FaseProjeto = 'diagnostico' | 'implementacao' | 'recorrencia';
export type TipoProjeto = 'diagnostico_inicial' | 'gig_completo' | 'compliance_avulso' | 'treinamento_avulso';
export type StatusDocumento = 'pendente' | 'enviado' | 'em_analise' | 'aprovado' | 'rejeitado';

export interface Database {
  public: {
    Tables: {
      organizacoes: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          nome: string | null
          email: string | null
          avatar_url: string | null
          telefone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome?: string | null
          email?: string | null
          avatar_url?: string | null
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string | null
          email?: string | null
          avatar_url?: string | null
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: AppRole
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: AppRole
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: AppRole
          created_at?: string
        }
      }
      projetos: {
        Row: {
          id: string
          organizacao_id: string
          nome: string
          tipo: TipoProjeto
          fase_atual: FaseProjeto
          data_inicio: string | null
          data_fim_prevista: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizacao_id: string
          nome: string
          tipo?: TipoProjeto
          fase_atual?: FaseProjeto
          data_inicio?: string | null
          data_fim_prevista?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizacao_id?: string
          nome?: string
          tipo?: TipoProjeto
          fase_atual?: FaseProjeto
          data_inicio?: string | null
          data_fim_prevista?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documentos: {
        Row: {
          id: string
          organizacao_id: string
          nome: string
          url: string | null
          tipo: string | null
          tamanho_bytes: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organizacao_id: string
          nome: string
          url?: string | null
          tipo?: string | null
          tamanho_bytes?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organizacao_id?: string
          nome?: string
          url?: string | null
          tipo?: string | null
          tamanho_bytes?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      documentos_requeridos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          fase: FaseProjeto
          tipo_projeto: TipoProjeto | null
          obrigatorio: boolean
          ordem: number
          template_url: string | null
          formatos_aceitos: string
          tamanho_maximo_mb: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          fase: FaseProjeto
          tipo_projeto?: TipoProjeto | null
          obrigatorio?: boolean
          ordem?: number
          template_url?: string | null
          formatos_aceitos?: string
          tamanho_maximo_mb?: number
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          fase?: FaseProjeto
          tipo_projeto?: TipoProjeto | null
          obrigatorio?: boolean
          ordem?: number
          template_url?: string | null
          formatos_aceitos?: string
          tamanho_maximo_mb?: number
          ativo?: boolean
          created_at?: string
        }
      }
      documentos_requeridos_status: {
        Row: {
          id: string
          documento_requerido_id: string
          projeto_id: string
          organizacao_id: string
          status: StatusDocumento
          documento_id: string | null
          observacao_rejeicao: string | null
          enviado_por_id: string | null
          enviado_em: string | null
          analisado_por_id: string | null
          analisado_em: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          documento_requerido_id: string
          projeto_id: string
          organizacao_id: string
          status?: StatusDocumento
          documento_id?: string | null
          observacao_rejeicao?: string | null
          enviado_por_id?: string | null
          enviado_em?: string | null
          analisado_por_id?: string | null
          analisado_em?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          documento_requerido_id?: string
          projeto_id?: string
          organizacao_id?: string
          status?: StatusDocumento
          documento_id?: string | null
          observacao_rejeicao?: string | null
          enviado_por_id?: string | null
          enviado_em?: string | null
          analisado_por_id?: string | null
          analisado_em?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notificacoes: {
        Row: {
          id: string
          user_id: string
          tipo: string
          titulo: string
          mensagem: string | null
          lida: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: string
          titulo: string
          mensagem?: string | null
          lida?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo?: string
          titulo?: string
          mensagem?: string | null
          lida?: boolean
          link?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole }
        Returns: boolean
      }
    }
    Enums: {
      app_role: AppRole
      fase_projeto: FaseProjeto
      tipo_projeto: TipoProjeto
      status_documento: StatusDocumento
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Organizacao = Tables<'organizacoes'>
export type Profile = Tables<'profiles'>
export type UserRole = Tables<'user_roles'>
export type Projeto = Tables<'projetos'>
export type Documento = Tables<'documentos'>
export type DocumentoRequerido = Tables<'documentos_requeridos'>
export type DocumentoRequeridoStatus = Tables<'documentos_requeridos_status'>
export type Notificacao = Tables<'notificacoes'>

// Extended types with relations
export interface DocumentoRequeridoComStatus extends DocumentoRequerido {
  status?: DocumentoRequeridoStatus
}
