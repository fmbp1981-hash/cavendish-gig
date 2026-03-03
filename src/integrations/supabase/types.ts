export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          created_at: string
          duracao_ms: number | null
          error_message: string | null
          id: string
          input_data: Json
          modelo: string
          organizacao_id: string | null
          output_text: string | null
          projeto_id: string | null
          status: string
          tipo: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duracao_ms?: number | null
          error_message?: string | null
          id?: string
          input_data: Json
          modelo?: string
          organizacao_id?: string | null
          output_text?: string | null
          projeto_id?: string | null
          status?: string
          tipo: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duracao_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json
          modelo?: string
          organizacao_id?: string | null
          output_text?: string | null
          projeto_id?: string | null
          status?: string
          tipo?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          checksum: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          organizacao_id: string | null
          record_id: string | null
          table_name: string
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          checksum?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organizacao_id?: string | null
          record_id?: string | null
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          checksum?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organizacao_id?: string | null
          record_id?: string | null
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      codigo_etica_adesoes: {
        Row: {
          aceito_em: string
          id: string
          ip_address: string | null
          organizacao_id: string
          user_agent: string | null
          user_id: string
          versao_id: string
        }
        Insert: {
          aceito_em?: string
          id?: string
          ip_address?: string | null
          organizacao_id: string
          user_agent?: string | null
          user_id: string
          versao_id: string
        }
        Update: {
          aceito_em?: string
          id?: string
          ip_address?: string | null
          organizacao_id?: string
          user_agent?: string | null
          user_id?: string
          versao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codigo_etica_adesoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codigo_etica_adesoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codigo_etica_adesoes_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "codigo_etica_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      codigo_etica_versoes: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          titulo: string
          versao: string
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          titulo: string
          versao: string
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          titulo?: string
          versao?: string
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "codigo_etica_versoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_pre_registrations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          nome: string | null
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          nome?: string | null
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          nome?: string | null
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      consultor_organizacoes: {
        Row: {
          consultor_id: string
          created_at: string
          id: string
          organizacao_id: string
        }
        Insert: {
          consultor_id: string
          created_at?: string
          id?: string
          organizacao_id: string
        }
        Update: {
          consultor_id?: string
          created_at?: string
          id?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultor_organizacoes_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultor_organizacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      denuncias: {
        Row: {
          analisado_em: string | null
          analisado_por: string | null
          categoria: string
          created_at: string
          data_ocorrido: string | null
          descricao: string
          envolvidos: string | null
          id: string
          observacoes_internas: string | null
          organizacao_id: string | null
          status: string
          ticket_id: string
          ticket_secret: string
        }
        Insert: {
          analisado_em?: string | null
          analisado_por?: string | null
          categoria: string
          created_at?: string
          data_ocorrido?: string | null
          descricao: string
          envolvidos?: string | null
          id?: string
          observacoes_internas?: string | null
          organizacao_id?: string | null
          status?: string
          ticket_id?: string
          ticket_secret?: string
        }
        Update: {
          analisado_em?: string | null
          analisado_por?: string | null
          categoria?: string
          created_at?: string
          data_ocorrido?: string | null
          descricao?: string
          envolvidos?: string | null
          id?: string
          observacoes_internas?: string | null
          organizacao_id?: string | null
          status?: string
          ticket_id?: string
          ticket_secret?: string
        }
        Relationships: [
          {
            foreignKeyName: "denuncias_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_perguntas: {
        Row: {
          created_at: string
          descricao: string | null
          dimensao: string
          id: string
          ordem: number
          pergunta: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          dimensao: string
          id?: string
          ordem?: number
          pergunta: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          dimensao?: string
          id?: string
          ordem?: number
          pergunta?: string
        }
        Relationships: []
      }
      diagnostico_respostas: {
        Row: {
          created_at: string
          diagnostico_id: string
          id: string
          pergunta_id: string
          resposta: string
          valor: number
        }
        Insert: {
          created_at?: string
          diagnostico_id: string
          id?: string
          pergunta_id: string
          resposta: string
          valor: number
        }
        Update: {
          created_at?: string
          diagnostico_id?: string
          id?: string
          pergunta_id?: string
          resposta?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_respostas_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostico_respostas_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_perguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          concluido_em: string | null
          created_at: string
          etapa_atual: number
          id: string
          nivel_maturidade: string | null
          organizacao_id: string
          pontos_atencao: string[] | null
          pontos_fortes: string[] | null
          projeto_id: string
          score_compliance: number | null
          score_estrutura_societaria: number | null
          score_geral: number | null
          score_gestao: number | null
          score_governanca: number | null
          score_planejamento: number | null
          status: string
          updated_at: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          etapa_atual?: number
          id?: string
          nivel_maturidade?: string | null
          organizacao_id: string
          pontos_atencao?: string[] | null
          pontos_fortes?: string[] | null
          projeto_id: string
          score_compliance?: number | null
          score_estrutura_societaria?: number | null
          score_geral?: number | null
          score_gestao?: number | null
          score_governanca?: number | null
          score_planejamento?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          etapa_atual?: number
          id?: string
          nivel_maturidade?: string | null
          organizacao_id?: string
          pontos_atencao?: string[] | null
          pontos_fortes?: string[] | null
          projeto_id?: string
          score_compliance?: number | null
          score_estrutura_societaria?: number | null
          score_geral?: number | null
          score_gestao?: number | null
          score_governanca?: number | null
          score_planejamento?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_comentarios: {
        Row: {
          comentario: string
          created_at: string | null
          documento_id: string
          id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comentario: string
          created_at?: string | null
          documento_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comentario?: string
          created_at?: string | null
          documento_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_comentarios_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documento_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_versoes: {
        Row: {
          change_description: string | null
          change_type: string
          changed_fields: Json | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          documento_id: string
          drive_file_id: string | null
          id: string
          mime_type: string | null
          nome: string
          organizacao_id: string | null
          projeto_id: string | null
          tamanho: number | null
          tipo: string
          uploaded_by: string | null
          url: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          change_type?: string
          changed_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          documento_id: string
          drive_file_id?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          organizacao_id?: string | null
          projeto_id?: string | null
          tamanho?: number | null
          tipo: string
          uploaded_by?: string | null
          url: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          change_type?: string
          changed_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          documento_id?: string
          drive_file_id?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          organizacao_id?: string | null
          projeto_id?: string | null
          tamanho?: number | null
          tipo?: string
          uploaded_by?: string | null
          url?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "documento_versoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string
          descricao: string | null
          drive_file_id: string | null
          id: string
          nome: string
          organizacao_id: string | null
          projeto_id: string | null
          storage_path: string | null
          tamanho_bytes: number | null
          tipo: string | null
          updated_at: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          drive_file_id?: string | null
          id?: string
          nome: string
          organizacao_id?: string | null
          projeto_id?: string | null
          storage_path?: string | null
          tamanho_bytes?: number | null
          tipo?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          drive_file_id?: string | null
          id?: string
          nome?: string
          organizacao_id?: string | null
          projeto_id?: string | null
          storage_path?: string | null
          tamanho_bytes?: number | null
          tipo?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_catalogo: {
        Row: {
          created_at: string
          criterios_aceitacao: string | null
          descricao: string | null
          fase: Database["public"]["Enums"]["fase_projeto"]
          formatos_aceitos: string[] | null
          id: string
          nome: string
          obrigatorio: boolean
          ordem: number | null
          tamanho_maximo_mb: number | null
          template_url: string | null
          tipo_projeto: Database["public"]["Enums"]["tipo_projeto"]
        }
        Insert: {
          created_at?: string
          criterios_aceitacao?: string | null
          descricao?: string | null
          fase: Database["public"]["Enums"]["fase_projeto"]
          formatos_aceitos?: string[] | null
          id?: string
          nome: string
          obrigatorio?: boolean
          ordem?: number | null
          tamanho_maximo_mb?: number | null
          template_url?: string | null
          tipo_projeto?: Database["public"]["Enums"]["tipo_projeto"]
        }
        Update: {
          created_at?: string
          criterios_aceitacao?: string | null
          descricao?: string | null
          fase?: Database["public"]["Enums"]["fase_projeto"]
          formatos_aceitos?: string[] | null
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number | null
          tamanho_maximo_mb?: number | null
          template_url?: string | null
          tipo_projeto?: Database["public"]["Enums"]["tipo_projeto"]
        }
        Relationships: []
      }
      documentos_gerados: {
        Row: {
          documento_id: string | null
          gerado_em: string | null
          gerado_por: string | null
          id: string
          organizacao_id: string | null
          template_id: string
          variaveis_utilizadas: Json
        }
        Insert: {
          documento_id?: string | null
          gerado_em?: string | null
          gerado_por?: string | null
          id?: string
          organizacao_id?: string | null
          template_id: string
          variaveis_utilizadas: Json
        }
        Update: {
          documento_id?: string | null
          gerado_em?: string | null
          gerado_por?: string | null
          id?: string
          organizacao_id?: string | null
          template_id?: string
          variaveis_utilizadas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "documentos_gerados_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_gerados_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_populares"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_requeridos: {
        Row: {
          catalogo_id: string
          created_at: string
          criterios_aceitacao: string | null
          descricao: string | null
          fase: Database["public"]["Enums"]["fase_projeto"]
          formatos_aceitos: string[] | null
          id: string
          nome: string
          obrigatorio: boolean
          projeto_id: string
          tamanho_maximo_mb: number | null
          template_url: string | null
        }
        Insert: {
          catalogo_id: string
          created_at?: string
          criterios_aceitacao?: string | null
          descricao?: string | null
          fase: Database["public"]["Enums"]["fase_projeto"]
          formatos_aceitos?: string[] | null
          id?: string
          nome: string
          obrigatorio?: boolean
          projeto_id: string
          tamanho_maximo_mb?: number | null
          template_url?: string | null
        }
        Update: {
          catalogo_id?: string
          created_at?: string
          criterios_aceitacao?: string | null
          descricao?: string | null
          fase?: Database["public"]["Enums"]["fase_projeto"]
          formatos_aceitos?: string[] | null
          id?: string
          nome?: string
          obrigatorio?: boolean
          projeto_id?: string
          tamanho_maximo_mb?: number | null
          template_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_requeridos_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "documentos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_requeridos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_requeridos_status: {
        Row: {
          analisado_em: string | null
          analisado_por: string | null
          created_at: string
          documento_id: string | null
          documento_requerido_id: string
          id: string
          observacao_rejeicao: string | null
          status: Database["public"]["Enums"]["status_documento"]
          updated_at: string
        }
        Insert: {
          analisado_em?: string | null
          analisado_por?: string | null
          created_at?: string
          documento_id?: string | null
          documento_requerido_id: string
          id?: string
          observacao_rejeicao?: string | null
          status?: Database["public"]["Enums"]["status_documento"]
          updated_at?: string
        }
        Update: {
          analisado_em?: string | null
          analisado_por?: string | null
          created_at?: string
          documento_id?: string | null
          documento_requerido_id?: string
          id?: string
          observacao_rejeicao?: string | null
          status?: Database["public"]["Enums"]["status_documento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_requeridos_status_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_requeridos_status_documento_requerido_id_fkey"
            columns: ["documento_requerido_id"]
            isOneToOne: true
            referencedRelation: "documentos_requeridos"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          external_id: string
          external_url: string | null
          id: string
          integration_type: string
          last_synced_at: string
          organizacao_id: string | null
          sync_direction: string | null
          sync_errors: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          external_id: string
          external_url?: string | null
          id?: string
          integration_type: string
          last_synced_at?: string
          organizacao_id?: string | null
          sync_direction?: string | null
          sync_errors?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          external_id?: string
          external_url?: string | null
          id?: string
          integration_type?: string
          last_synced_at?: string
          organizacao_id?: string | null
          sync_direction?: string | null
          sync_errors?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          organizacao_id: string | null
          provider: string
          scope: string
          secrets_encrypted: string | null
          secrets_version: number
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          organizacao_id?: string | null
          provider: string
          scope?: string
          secrets_encrypted?: string | null
          secrets_version?: number
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          organizacao_id?: string | null
          provider?: string
          scope?: string
          secrets_encrypted?: string | null
          secrets_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          service: string | null
          tenant_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          service?: string | null
          tenant_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          service?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string | null
          metadata: Json | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          metadata?: Json | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          metadata?: Json | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      organizacoes: {
        Row: {
          cnpj: string | null
          created_at: string
          drive_folder_id: string | null
          drive_folder_url: string | null
          id: string
          nome: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          plano_fim: string | null
          plano_inicio: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          id?: string
          nome: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          plano_fim?: string | null
          plano_inicio?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          id?: string
          nome?: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          plano_fim?: string | null
          plano_inicio?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organizacao_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizacao_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizacao_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_config: {
        Row: {
          created_at: string
          descricao: string | null
          feat_api_webhooks: boolean
          feat_canal_denuncias: boolean
          feat_certificados: boolean
          feat_codigo_etica: boolean
          feat_diagnostico: boolean
          feat_integracao_calendar: boolean
          feat_integracao_clickup: boolean
          feat_integracao_drive: boolean
          feat_integracao_fireflies: boolean
          feat_integracao_trello: boolean
          feat_relatorios_mensais: boolean
          feat_suporte_prioritario: boolean
          feat_treinamentos: boolean
          feat_whatsapp_notifications: boolean
          feat_white_label: boolean
          id: string
          limit_ai_generations_mes: number | null
          limit_documentos_mes: number | null
          limit_storage_gb: number | null
          limit_treinamentos: number | null
          limit_usuarios: number | null
          nome_exibicao: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          preco_mensal: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          feat_api_webhooks?: boolean
          feat_canal_denuncias?: boolean
          feat_certificados?: boolean
          feat_codigo_etica?: boolean
          feat_diagnostico?: boolean
          feat_integracao_calendar?: boolean
          feat_integracao_clickup?: boolean
          feat_integracao_drive?: boolean
          feat_integracao_fireflies?: boolean
          feat_integracao_trello?: boolean
          feat_relatorios_mensais?: boolean
          feat_suporte_prioritario?: boolean
          feat_treinamentos?: boolean
          feat_whatsapp_notifications?: boolean
          feat_white_label?: boolean
          id?: string
          limit_ai_generations_mes?: number | null
          limit_documentos_mes?: number | null
          limit_storage_gb?: number | null
          limit_treinamentos?: number | null
          limit_usuarios?: number | null
          nome_exibicao: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          preco_mensal?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          feat_api_webhooks?: boolean
          feat_canal_denuncias?: boolean
          feat_certificados?: boolean
          feat_codigo_etica?: boolean
          feat_diagnostico?: boolean
          feat_integracao_calendar?: boolean
          feat_integracao_clickup?: boolean
          feat_integracao_drive?: boolean
          feat_integracao_fireflies?: boolean
          feat_integracao_trello?: boolean
          feat_relatorios_mensais?: boolean
          feat_suporte_prioritario?: boolean
          feat_treinamentos?: boolean
          feat_whatsapp_notifications?: boolean
          feat_white_label?: boolean
          id?: string
          limit_ai_generations_mes?: number | null
          limit_documentos_mes?: number | null
          limit_storage_gb?: number | null
          limit_treinamentos?: number | null
          limit_usuarios?: number | null
          nome_exibicao?: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          preco_mensal?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          created_at: string
          data_fim_prevista: string | null
          data_inicio: string | null
          fase_atual: Database["public"]["Enums"]["fase_projeto"]
          id: string
          nome: string
          organizacao_id: string
          tipo: Database["public"]["Enums"]["tipo_projeto"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim_prevista?: string | null
          data_inicio?: string | null
          fase_atual?: Database["public"]["Enums"]["fase_projeto"]
          id?: string
          nome: string
          organizacao_id: string
          tipo?: Database["public"]["Enums"]["tipo_projeto"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim_prevista?: string | null
          data_inicio?: string | null
          fase_atual?: Database["public"]["Enums"]["fase_projeto"]
          id?: string
          nome?: string
          organizacao_id?: string
          tipo?: Database["public"]["Enums"]["tipo_projeto"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_envios: {
        Row: {
          ano_referencia: number
          assunto: string
          created_at: string | null
          created_by: string | null
          documentos_aprovados: number | null
          documentos_pendentes: number | null
          email_copia: string[] | null
          email_destinatario: string
          enviado_em: string | null
          id: string
          max_tentativas: number | null
          mes_referencia: number
          organizacao_id: string
          periodo_fim: string
          periodo_inicio: string
          progresso_projeto: number | null
          projeto_id: string | null
          relatorio_html: string | null
          relatorio_pdf_url: string | null
          status: Database["public"]["Enums"]["relatorio_envio_status"]
          tarefas_concluidas: number | null
          tentativas: number | null
          total_documentos: number | null
          total_tarefas: number | null
          ultimo_erro: string | null
          updated_at: string | null
        }
        Insert: {
          ano_referencia: number
          assunto: string
          created_at?: string | null
          created_by?: string | null
          documentos_aprovados?: number | null
          documentos_pendentes?: number | null
          email_copia?: string[] | null
          email_destinatario: string
          enviado_em?: string | null
          id?: string
          max_tentativas?: number | null
          mes_referencia: number
          organizacao_id: string
          periodo_fim: string
          periodo_inicio: string
          progresso_projeto?: number | null
          projeto_id?: string | null
          relatorio_html?: string | null
          relatorio_pdf_url?: string | null
          status?: Database["public"]["Enums"]["relatorio_envio_status"]
          tarefas_concluidas?: number | null
          tentativas?: number | null
          total_documentos?: number | null
          total_tarefas?: number | null
          ultimo_erro?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_referencia?: number
          assunto?: string
          created_at?: string | null
          created_by?: string | null
          documentos_aprovados?: number | null
          documentos_pendentes?: number | null
          email_copia?: string[] | null
          email_destinatario?: string
          enviado_em?: string | null
          id?: string
          max_tentativas?: number | null
          mes_referencia?: number
          organizacao_id?: string
          periodo_fim?: string
          periodo_inicio?: string
          progresso_projeto?: number | null
          projeto_id?: string | null
          relatorio_html?: string | null
          relatorio_pdf_url?: string | null
          status?: Database["public"]["Enums"]["relatorio_envio_status"]
          tarefas_concluidas?: number | null
          tentativas?: number | null
          total_documentos?: number | null
          total_tarefas?: number | null
          ultimo_erro?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_envios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_envios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorio_envios_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          details: Json | null
          function_name: string | null
          id: string
          level: string
          message: string
          organizacao_id: string | null
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          function_name?: string | null
          id?: string
          level: string
          message: string
          organizacao_id?: string | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          function_name?: string | null
          id?: string
          level?: string
          message?: string
          organizacao_id?: string | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          concluido_em: string | null
          created_at: string
          descricao: string | null
          id: string
          kanban_order: number
          organizacao_id: string | null
          prazo: string | null
          prioridade: string
          projeto_id: string | null
          responsavel_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          kanban_order?: number
          organizacao_id?: string | null
          prazo?: string | null
          prioridade?: string
          projeto_id?: string | null
          responsavel_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          kanban_order?: number
          organizacao_id?: string | null
          prazo?: string | null
          prioridade?: string
          projeto_id?: string | null
          responsavel_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versoes: {
        Row: {
          change_description: string | null
          conteudo: string
          created_at: string | null
          created_by: string | null
          formato: string
          id: string
          template_id: string
          variaveis_disponiveis: Json | null
          versao: number
        }
        Insert: {
          change_description?: string | null
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          formato: string
          id?: string
          template_id: string
          variaveis_disponiveis?: Json | null
          versao: number
        }
        Update: {
          change_description?: string | null
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          formato?: string
          id?: string
          template_id?: string
          variaveis_disponiveis?: Json | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_versoes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_versoes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_populares"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          categoria: Database["public"]["Enums"]["template_categoria"]
          conteudo: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          formato: string
          id: string
          is_publico: boolean | null
          nome: string
          status: Database["public"]["Enums"]["template_status"]
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          usado_count: number | null
          variaveis_disponiveis: Json | null
          versao: number
        }
        Insert: {
          categoria: Database["public"]["Enums"]["template_categoria"]
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          formato?: string
          id?: string
          is_publico?: boolean | null
          nome: string
          status?: Database["public"]["Enums"]["template_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usado_count?: number | null
          variaveis_disponiveis?: Json | null
          versao?: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["template_categoria"]
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          formato?: string
          id?: string
          is_publico?: boolean | null
          nome?: string
          status?: Database["public"]["Enums"]["template_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usado_count?: number | null
          variaveis_disponiveis?: Json | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          accent_hsl: string
          company_name: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          logo_url: string | null
          organizacao_id: string
          primary_hsl: string
          secondary_hsl: string
          updated_at: string
        }
        Insert: {
          accent_hsl?: string
          company_name?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          logo_url?: string | null
          organizacao_id: string
          primary_hsl?: string
          secondary_hsl?: string
          updated_at?: string
        }
        Update: {
          accent_hsl?: string
          company_name?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          logo_url?: string | null
          organizacao_id?: string
          primary_hsl?: string
          secondary_hsl?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_certificados: {
        Row: {
          codigo_validacao: string
          emitido_em: string
          id: string
          inscricao_id: string
          nome_completo: string
          nota_final: number
          treinamento_id: string
          user_id: string
        }
        Insert: {
          codigo_validacao?: string
          emitido_em?: string
          id?: string
          inscricao_id: string
          nome_completo: string
          nota_final: number
          treinamento_id: string
          user_id: string
        }
        Update: {
          codigo_validacao?: string
          emitido_em?: string
          id?: string
          inscricao_id?: string
          nome_completo?: string
          nota_final?: number
          treinamento_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_certificados_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "treinamento_inscricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_certificados_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_conteudos: {
        Row: {
          conteudo: string | null
          created_at: string
          duracao_minutos: number | null
          id: string
          ordem: number
          tipo: string
          titulo: string
          treinamento_id: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          tipo?: string
          titulo: string
          treinamento_id: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          tipo?: string
          titulo?: string
          treinamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_conteudos_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_inscricoes: {
        Row: {
          concluido_em: string | null
          created_at: string
          id: string
          iniciado_em: string | null
          organizacao_id: string
          progresso_conteudo: Json | null
          quiz_aprovado: boolean | null
          quiz_nota: number | null
          quiz_tentativas: number | null
          status: string
          treinamento_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          id?: string
          iniciado_em?: string | null
          organizacao_id: string
          progresso_conteudo?: Json | null
          quiz_aprovado?: boolean | null
          quiz_nota?: number | null
          quiz_tentativas?: number | null
          status?: string
          treinamento_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          id?: string
          iniciado_em?: string | null
          organizacao_id?: string
          progresso_conteudo?: Json | null
          quiz_aprovado?: boolean | null
          quiz_nota?: number | null
          quiz_tentativas?: number | null
          status?: string
          treinamento_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_inscricoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamento_inscricoes_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamento_quiz: {
        Row: {
          alternativas: Json
          created_at: string
          id: string
          ordem: number
          pergunta: string
          treinamento_id: string
        }
        Insert: {
          alternativas: Json
          created_at?: string
          id?: string
          ordem?: number
          pergunta: string
          treinamento_id: string
        }
        Update: {
          alternativas?: Json
          created_at?: string
          id?: string
          ordem?: number
          pergunta?: string
          treinamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinamento_quiz_treinamento_id_fkey"
            columns: ["treinamento_id"]
            isOneToOne: false
            referencedRelation: "treinamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          ativo: boolean
          carga_horaria_minutos: number
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          obrigatorio: boolean
          ordem: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          carga_horaria_minutos?: number
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          obrigatorio?: boolean
          ordem?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          carga_horaria_minutos?: number
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tutorial_progress: {
        Row: {
          completed_steps: Json | null
          created_at: string | null
          current_step: number | null
          id: string
          is_completed: boolean | null
          last_seen_at: string | null
          tutorial_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          last_seen_at?: string | null
          tutorial_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          last_seen_at?: string | null
          tutorial_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          clinic_name: string
          created_at: string | null
          email: string
          id: string
          name: string
          password: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_name: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          password: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinic_name?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      audit_logs_view: {
        Row: {
          action: string | null
          id: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          organizacao_nome: string | null
          record_id: string | null
          table_name: string | null
          timestamp: string | null
          user_email: string | null
          user_role: string | null
        }
        Relationships: []
      }
      documento_versoes_resumo: {
        Row: {
          change_description: string | null
          change_type: string | null
          created_at: string | null
          created_by: string | null
          created_by_avatar: string | null
          created_by_name: string | null
          documento_atual_nome: string | null
          documento_id: string | null
          id: string | null
          nome: string | null
          version_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documento_versoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorio_envios_recentes: {
        Row: {
          ano_referencia: number | null
          created_at: string | null
          email_destinatario: string | null
          enviado_em: string | null
          id: string | null
          mes_referencia: number | null
          organizacao_id: string | null
          organizacao_nome: string | null
          progresso_projeto: number | null
          status: Database["public"]["Enums"]["relatorio_envio_status"] | null
          tentativas: number | null
          ultimo_erro: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_envios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_populares: {
        Row: {
          categoria: Database["public"]["Enums"]["template_categoria"] | null
          created_by_name: string | null
          descricao: string | null
          documentos_gerados_count: number | null
          id: string | null
          nome: string | null
          tags: string[] | null
          usado_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_scores_diagnostico: {
        Args: { p_diagnostico_id: string }
        Returns: Json
      }
      create_client_onboarding: {
        Args: {
          p_cnpj: string
          p_nome_organizacao: string
          p_tipo_projeto: Database["public"]["Enums"]["tipo_projeto"]
          p_user_id: string
        }
        Returns: Json
      }
      create_document_notification: {
        Args: {
          p_mensagem: string
          p_metadata?: Json
          p_tipo: string
          p_titulo: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_relatorio_agendamento: {
        Args: {
          p_ano: number
          p_email: string
          p_mes: number
          p_organizacao_id: string
        }
        Returns: string
      }
      extract_template_variables: {
        Args: { p_conteudo: string }
        Returns: string[]
      }
      get_next_version_number: {
        Args: { p_documento_id: string }
        Returns: number
      }
      get_project_stats: { Args: { p_projeto_id: string }; Returns: Json }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      get_version_diff: {
        Args: {
          p_documento_id: string
          p_version_from: number
          p_version_to: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_organizacao_id?: string
          p_record_id?: string
          p_table_name?: string
        }
        Returns: string
      }
      mark_relatorio_enviado: {
        Args: { p_metricas?: Json; p_pdf_url?: string; p_relatorio_id: string }
        Returns: boolean
      }
      mark_relatorio_failed: {
        Args: { p_erro: string; p_relatorio_id: string }
        Returns: boolean
      }
      org_check_quota: {
        Args: {
          p_current_usage?: number
          p_organizacao_id: string
          p_quota_type: string
        }
        Returns: Json
      }
      org_get_limit: {
        Args: { p_limit_name: string; p_organizacao_id: string }
        Returns: number
      }
      org_get_plan_info: { Args: { p_organizacao_id: string }; Returns: Json }
      org_has_feature: {
        Args: { p_feature: string; p_organizacao_id: string }
        Returns: boolean
      }
      render_template: {
        Args: { p_template_id: string; p_variaveis: Json }
        Returns: string
      }
      restore_document_version: {
        Args: { p_documento_id: string; p_version_number: number }
        Returns: boolean
      }
      schedule_monthly_reports: {
        Args: never
        Returns: {
          ano: number
          email: string
          mes: number
          organizacao_id: string
          organizacao_nome: string
        }[]
      }
      validate_template: { Args: { p_template_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "consultor" | "cliente" | "parceiro"
      fase_projeto: "diagnostico" | "implementacao" | "recorrencia"
      plano_tipo: "essencial" | "executivo" | "premium"
      relatorio_envio_status: "pending" | "sending" | "sent" | "failed"
      status_documento:
        | "pendente"
        | "enviado"
        | "em_analise"
        | "aprovado"
        | "rejeitado"
      template_categoria:
        | "codigo_etica"
        | "politica"
        | "procedimento"
        | "manual"
        | "relatorio"
        | "contrato"
        | "termo"
        | "outro"
      template_status: "rascunho" | "ativo" | "arquivado"
      tipo_projeto: "gig_completo" | "gig_modular" | "consultoria_pontual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "consultor", "cliente", "parceiro"],
      fase_projeto: ["diagnostico", "implementacao", "recorrencia"],
      plano_tipo: ["essencial", "executivo", "premium"],
      relatorio_envio_status: ["pending", "sending", "sent", "failed"],
      status_documento: [
        "pendente",
        "enviado",
        "em_analise",
        "aprovado",
        "rejeitado",
      ],
      template_categoria: [
        "codigo_etica",
        "politica",
        "procedimento",
        "manual",
        "relatorio",
        "contrato",
        "termo",
        "outro",
      ],
      template_status: ["rascunho", "ativo", "arquivado"],
      tipo_projeto: ["gig_completo", "gig_modular", "consultoria_pontual"],
    },
  },
} as const
