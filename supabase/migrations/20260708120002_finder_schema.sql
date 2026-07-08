-- Módulo Finder (prospecção B2B) — schema core.
-- Convenção do projeto: tabelas/colunas em português, RLS habilitado na mesma migration.
-- `categoria` e `origem` são texto livre validado em TS (não travado em CHECK) — ver
-- CAVENDISH_PROSPECCAO_BLUEPRINT.md §0.1/§0.2 para a razão (evitar migration a cada nova
-- categoria/fonte de lead).

-- ── prospeccao_leads (entidade principal) ────────────────────────────────────
CREATE TABLE public.prospeccao_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                text NOT NULL,
  cnpj                text,
  telefone            text,
  email               text,
  website             text,
  linkedin            text,
  endereco            text,
  cidade              text,
  estado              text,
  setor               text,
  porte_estimado      text CHECK (porte_estimado IN ('pequena','media','grande')),
  categoria           text NOT NULL,
  origem              text NOT NULL DEFAULT 'manual',
  status              text NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo','contatado','qualificando','qualificado','proposta_enviada',
    'negociando','convertido','perdido','sem_resposta'
  )),
  funil_id            uuid,
  funil_etapa_id      uuid,
  busca_id            uuid,
  importacao_id       uuid,
  google_place_id     text,
  organizacao_id      uuid REFERENCES public.organizacoes(id) ON DELETE SET NULL,
  ai_resumo           text,
  ai_score            integer CHECK (ai_score BETWEEN 0 AND 100),
  ai_enriquecimento   jsonb NOT NULL DEFAULT '{}',
  modo_humano         boolean NOT NULL DEFAULT false,
  ultimo_contato_em   timestamptz,
  proximo_followup_em timestamptz,
  etapa_followup      integer NOT NULL DEFAULT 0,
  tags                text[] NOT NULL DEFAULT '{}',
  observacoes         text,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_prospeccao_leads_telefone
  ON public.prospeccao_leads(responsavel_id, telefone) WHERE telefone IS NOT NULL;
CREATE UNIQUE INDEX idx_prospeccao_leads_place
  ON public.prospeccao_leads(responsavel_id, google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX idx_prospeccao_leads_status ON public.prospeccao_leads(status);
CREATE INDEX idx_prospeccao_leads_categoria ON public.prospeccao_leads(categoria);
CREATE INDEX idx_prospeccao_leads_responsavel ON public.prospeccao_leads(responsavel_id);

-- ── prospeccao_funis / prospeccao_funil_etapas ───────────────────────────────
CREATE TABLE public.prospeccao_funis (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  categoria    text NOT NULL,
  descricao    text,
  cor          text NOT NULL DEFAULT '#0EA5E9',
  ativo        boolean NOT NULL DEFAULT true,
  padrao       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prospeccao_funil_etapas (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id                  uuid NOT NULL REFERENCES public.prospeccao_funis(id) ON DELETE CASCADE,
  nome                      text NOT NULL,
  posicao                   integer NOT NULL,
  cor                       text,
  followup_automatico_horas integer,
  is_terminal               boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_funil_etapas_funil ON public.prospeccao_funil_etapas(funil_id);

ALTER TABLE public.prospeccao_leads
  ADD CONSTRAINT prospeccao_leads_funil_id_fkey
    FOREIGN KEY (funil_id) REFERENCES public.prospeccao_funis(id) ON DELETE SET NULL,
  ADD CONSTRAINT prospeccao_leads_funil_etapa_id_fkey
    FOREIGN KEY (funil_etapa_id) REFERENCES public.prospeccao_funil_etapas(id) ON DELETE SET NULL;

-- ── prospeccao_buscas (histórico de buscas externas) ─────────────────────────
CREATE TABLE public.prospeccao_buscas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  termo             text NOT NULL,
  localizacao       text NOT NULL,
  categoria         text NOT NULL,
  total_resultados  integer NOT NULL DEFAULT 0,
  total_importados  integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_buscas_responsavel ON public.prospeccao_buscas(responsavel_id);

-- ── prospeccao_importacoes (importação CSV/XLSX) ─────────────────────────────
CREATE TABLE public.prospeccao_importacoes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_arquivo     text NOT NULL,
  formato          text NOT NULL CHECK (formato IN ('csv','xlsx')),
  total_linhas     integer NOT NULL DEFAULT 0,
  total_importados integer NOT NULL DEFAULT 0,
  total_falhas     integer NOT NULL DEFAULT 0,
  total_duplicados integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'processando' CHECK (status IN ('processando','concluido','falhou','parcial')),
  log_erros        jsonb NOT NULL DEFAULT '[]',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_importacoes_responsavel ON public.prospeccao_importacoes(responsavel_id);

ALTER TABLE public.prospeccao_leads
  ADD CONSTRAINT prospeccao_leads_busca_id_fkey
    FOREIGN KEY (busca_id) REFERENCES public.prospeccao_buscas(id) ON DELETE SET NULL,
  ADD CONSTRAINT prospeccao_leads_importacao_id_fkey
    FOREIGN KEY (importacao_id) REFERENCES public.prospeccao_importacoes(id) ON DELETE SET NULL;

-- ── prospeccao_agent_configs (1 agente ativo por categoria, global ao sistema) ─
-- Sem responsavel_id: a Cavendish opera como consultoria única, não multi-tenant no nível
-- "reseller" — ver blueprint §3, nota da tabela.
CREATE TABLE public.prospeccao_agent_configs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria                text NOT NULL,
  nome                     text NOT NULL,
  system_prompt            text NOT NULL,
  ai_provider              text NOT NULL DEFAULT 'gemini',
  temperatura              numeric NOT NULL DEFAULT 0.7,
  max_iteracoes            integer NOT NULL DEFAULT 5,
  usa_rag                  boolean NOT NULL DEFAULT false,
  rag_top_k                integer NOT NULL DEFAULT 5,
  rag_similarity_threshold numeric NOT NULL DEFAULT 0.75,
  ativo                    boolean NOT NULL DEFAULT true,
  metadata                 jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_prospeccao_agent_configs_ativo
  ON public.prospeccao_agent_configs(categoria) WHERE ativo = true;

-- ── prospeccao_fila_followup ──────────────────────────────────────────────────
CREATE TABLE public.prospeccao_fila_followup (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES public.prospeccao_leads(id) ON DELETE CASCADE,
  enviar_em   timestamptz NOT NULL,
  status      text NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente','processando','enviado','cancelado','falhou','ignorado'
  )),
  mensagem    text,
  enviado_em  timestamptz,
  erro        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_followup_pendente
  ON public.prospeccao_fila_followup(enviar_em) WHERE status = 'pendente';
CREATE INDEX idx_prospeccao_fila_followup_lead ON public.prospeccao_fila_followup(lead_id);

-- ── prospeccao_campanhas / prospeccao_campanha_leads ─────────────────────────
CREATE TABLE public.prospeccao_campanhas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome           text NOT NULL,
  categoria      text,
  funil_etapa_id uuid REFERENCES public.prospeccao_funil_etapas(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'rascunho' CHECK (status IN (
    'rascunho','agendada','executando','pausada','concluida','falhou'
  )),
  total_leads     integer NOT NULL DEFAULT 0,
  total_enviados  integer NOT NULL DEFAULT 0,
  total_respostas integer NOT NULL DEFAULT 0,
  agendada_para   timestamptz,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_campanhas_responsavel ON public.prospeccao_campanhas(responsavel_id);

CREATE TABLE public.prospeccao_campanha_leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.prospeccao_campanhas(id) ON DELETE CASCADE,
  lead_id     uuid NOT NULL REFERENCES public.prospeccao_leads(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente','enviado','respondido','transferido','falhou'
  )),
  enviado_em  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, lead_id)
);

CREATE INDEX idx_prospeccao_campanha_leads_campanha ON public.prospeccao_campanha_leads(campanha_id);
CREATE INDEX idx_prospeccao_campanha_leads_lead ON public.prospeccao_campanha_leads(lead_id);

-- ── prospeccao_conversas (histórico de mensagens WhatsApp) ────────────────────
CREATE TABLE public.prospeccao_conversas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        uuid NOT NULL REFERENCES public.prospeccao_leads(id) ON DELETE CASCADE,
  role           text NOT NULL CHECK (role IN ('user','assistant','system')),
  conteudo       text NOT NULL,
  tipo           text NOT NULL DEFAULT 'texto',
  tokens_entrada integer,
  tokens_saida   integer,
  custo_usd      numeric,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_conversas_lead ON public.prospeccao_conversas(lead_id, created_at);

-- ── Triggers updated_at (reaproveita public.update_updated_at_column() já existente) ─
CREATE TRIGGER set_prospeccao_leads_updated_at
  BEFORE UPDATE ON public.prospeccao_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_prospeccao_funis_updated_at
  BEFORE UPDATE ON public.prospeccao_funis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_prospeccao_agent_configs_updated_at
  BEFORE UPDATE ON public.prospeccao_agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_prospeccao_campanhas_updated_at
  BEFORE UPDATE ON public.prospeccao_campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Leads não pertencem a uma organizacao ainda (são pré-clientes) — isolamento é por
-- responsavel_id, restrito a quem tem o papel representante ou admin (ver
-- FINDER_MODULE_SPEC.md §1.3). Reaproveita is_admin()/is_representante() já existentes,
-- sem redefinir lógica de role-check.

ALTER TABLE public.prospeccao_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_leads_select" ON public.prospeccao_leads
  FOR SELECT USING (responsavel_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "prospeccao_leads_insert" ON public.prospeccao_leads
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
    OR (responsavel_id = auth.uid() AND public.is_representante(auth.uid()))
  );
CREATE POLICY "prospeccao_leads_update" ON public.prospeccao_leads
  FOR UPDATE USING (
    public.is_admin(auth.uid())
    OR (responsavel_id = auth.uid() AND public.is_representante(auth.uid()))
  );
CREATE POLICY "prospeccao_leads_delete" ON public.prospeccao_leads
  FOR DELETE USING (public.is_admin(auth.uid()));

ALTER TABLE public.prospeccao_buscas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_buscas_dono_ou_admin" ON public.prospeccao_buscas
  FOR ALL USING (responsavel_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (responsavel_id = auth.uid() AND public.is_representante(auth.uid()))
  );

ALTER TABLE public.prospeccao_importacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_importacoes_dono_ou_admin" ON public.prospeccao_importacoes
  FOR ALL USING (responsavel_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (responsavel_id = auth.uid() AND public.is_representante(auth.uid()))
  );

ALTER TABLE public.prospeccao_campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_campanhas_dono_ou_admin" ON public.prospeccao_campanhas
  FOR ALL USING (responsavel_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (responsavel_id = auth.uid() AND public.is_representante(auth.uid()))
  );

ALTER TABLE public.prospeccao_campanha_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_campanha_leads_dono_ou_admin" ON public.prospeccao_campanha_leads
  FOR ALL USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.prospeccao_campanhas c
      WHERE c.id = prospeccao_campanha_leads.campanha_id AND c.responsavel_id = auth.uid()
    )
  );

ALTER TABLE public.prospeccao_conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_conversas_dono_ou_admin" ON public.prospeccao_conversas
  FOR ALL USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.prospeccao_leads l
      WHERE l.id = prospeccao_conversas.lead_id AND l.responsavel_id = auth.uid()
    )
  );

ALTER TABLE public.prospeccao_fila_followup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_fila_followup_dono_ou_admin" ON public.prospeccao_fila_followup
  FOR ALL USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.prospeccao_leads l
      WHERE l.id = prospeccao_fila_followup.lead_id AND l.responsavel_id = auth.uid()
    )
  );

-- Tabelas administrativas (afetam todas as categorias globalmente) — restritas a admin.
ALTER TABLE public.prospeccao_funis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_funis_admin" ON public.prospeccao_funis
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
-- Representantes precisam LER os funis/etapas para operar o kanban, mesmo sem poder editá-los.
CREATE POLICY "prospeccao_funis_select_representante" ON public.prospeccao_funis
  FOR SELECT USING (public.is_representante(auth.uid()));

ALTER TABLE public.prospeccao_funil_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_funil_etapas_admin" ON public.prospeccao_funil_etapas
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "prospeccao_funil_etapas_select_representante" ON public.prospeccao_funil_etapas
  FOR SELECT USING (public.is_representante(auth.uid()));

ALTER TABLE public.prospeccao_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_agent_configs_admin" ON public.prospeccao_agent_configs
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
