-- Fase 3: ESG Dashboard + Board Reporting

-- ─── ESG Indicadores ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.esg_indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  pilar TEXT NOT NULL CHECK (pilar IN ('ambiental','social','governanca')),
  nome TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'número',
  meta NUMERIC,
  valor_atual NUMERIC,
  periodo_referencia TEXT,
  fonte TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esg_ind_org ON public.esg_indicadores(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_esg_ind_pilar ON public.esg_indicadores(pilar);

ALTER TABLE public.esg_indicadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esg_indicadores_rw" ON public.esg_indicadores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

CREATE TRIGGER set_esg_ind_updated_at
  BEFORE UPDATE ON public.esg_indicadores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Board Snapshots ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  periodo_referencia TEXT NOT NULL,
  conteudo JSONB NOT NULL DEFAULT '{}',
  gerado_por UUID REFERENCES auth.users(id),
  link_publico_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expira_em TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_snap_org ON public.board_snapshots(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_board_snap_token ON public.board_snapshots(link_publico_token);

ALTER TABLE public.board_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_snap_rw" ON public.board_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

-- Leitura pública por token (para link compartilhado sem auth)
CREATE POLICY "board_snap_public_read" ON public.board_snapshots FOR SELECT USING (
  expira_em > now()
);
