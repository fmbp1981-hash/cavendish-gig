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
          status: string
          ticket_id: string
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
          status?: string
          ticket_id?: string
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
          status?: string
          ticket_id?: string
        }
        Relationships: []
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
      documentos: {
        Row: {
          created_at: string
          descricao: string | null
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
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
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
      tarefas: {
        Row: {
          concluido_em: string | null
          created_at: string
          descricao: string | null
          id: string
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
    }
    Views: {
      [_ in never]: never
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
      create_notification: {
        Args: {
          p_mensagem?: string
          p_metadata?: Json
          p_tipo: string
          p_titulo: string
          p_user_id: string
        }
        Returns: string
      }
      get_project_stats: { Args: { p_projeto_id: string }; Returns: Json }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "consultor" | "cliente" | "parceiro"
      fase_projeto: "diagnostico" | "implementacao" | "recorrencia"
      status_documento:
        | "pendente"
        | "enviado"
        | "em_analise"
        | "aprovado"
        | "rejeitado"
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
  public: {
    Enums: {
      app_role: ["admin", "consultor", "cliente", "parceiro"],
      fase_projeto: ["diagnostico", "implementacao", "recorrencia"],
      status_documento: [
        "pendente",
        "enviado",
        "em_analise",
        "aprovado",
        "rejeitado",
      ],
      tipo_projeto: ["gig_completo", "gig_modular", "consultoria_pontual"],
    },
  },
} as const
