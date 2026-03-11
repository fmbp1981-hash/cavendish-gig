-- Complemento do módulo de Riscos: avaliações periódicas e ações de mitigação

-- Corrigir FK da tabela riscos para referenciar organizacoes (padrão do codebase)
-- (a migration original usou organizations — esta garante a versão correta)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'riscos' AND column_name = 'organizacao_id'
  ) THEN
    ALTER TABLE public.riscos ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE;
    UPDATE public.riscos SET organizacao_id = organization_id WHERE organizacao_id IS NULL;
  END IF;
END $$;

-- Histórico de reavaliações periódicas de risco
CREATE TABLE IF NOT EXISTS public.riscos_avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risco_id UUID NOT NULL REFERENCES public.riscos(id) ON DELETE CASCADE,
  avaliado_por UUID REFERENCES auth.users(id),
  probabilidade_anterior INT,
  impacto_anterior INT,
  probabilidade_nova INT NOT NULL CHECK (probabilidade_nova BETWEEN 1 AND 5),
  impacto_nova INT NOT NULL CHECK (impacto_nova BETWEEN 1 AND 5),
  justificativa TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riscos_avaliacoes_risco ON public.riscos_avaliacoes(risco_id);

ALTER TABLE public.riscos_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riscos_avaliacoes_select" ON public.riscos_avaliacoes FOR SELECT USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "riscos_avaliacoes_insert" ON public.riscos_avaliacoes FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

-- Ações de mitigação vinculadas a riscos
CREATE TABLE IF NOT EXISTS public.riscos_mitigacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risco_id UUID NOT NULL REFERENCES public.riscos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id),
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riscos_mitigacao_risco ON public.riscos_mitigacao(risco_id);
CREATE INDEX IF NOT EXISTS idx_riscos_mitigacao_status ON public.riscos_mitigacao(status);

ALTER TABLE public.riscos_mitigacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riscos_mitigacao_select" ON public.riscos_mitigacao FOR SELECT USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "riscos_mitigacao_insert" ON public.riscos_mitigacao FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "riscos_mitigacao_update" ON public.riscos_mitigacao FOR UPDATE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "riscos_mitigacao_delete" ON public.riscos_mitigacao FOR DELETE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_riscos_mitigacao_updated_at
  BEFORE UPDATE ON public.riscos_mitigacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
