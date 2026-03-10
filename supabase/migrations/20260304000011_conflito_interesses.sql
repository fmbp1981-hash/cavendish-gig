-- Declaração de Conflito de Interesses
CREATE TABLE public.conflito_interesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  declarante_id UUID NOT NULL REFERENCES auth.users(id),
  ano_referencia INT NOT NULL,
  tem_conflito BOOLEAN NOT NULL DEFAULT false,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','analisado')),
  analisado_por UUID REFERENCES auth.users(id),
  analisado_em TIMESTAMPTZ,
  observacao_analise TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, declarante_id, ano_referencia)
);

CREATE INDEX idx_conflito_organization ON public.conflito_interesses(organization_id);
CREATE INDEX idx_conflito_declarante ON public.conflito_interesses(declarante_id);

ALTER TABLE public.conflito_interesses ENABLE ROW LEVEL SECURITY;

-- Cliente pode ver e criar suas próprias declarações
CREATE POLICY "conflito_select" ON public.conflito_interesses FOR SELECT USING (
  declarante_id = auth.uid()
  OR (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "conflito_insert" ON public.conflito_interesses FOR INSERT WITH CHECK (
  declarante_id = auth.uid()
);
CREATE POLICY "conflito_update" ON public.conflito_interesses FOR UPDATE USING (
  declarante_id = auth.uid()
  OR (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_conflito_updated_at
  BEFORE UPDATE ON public.conflito_interesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
