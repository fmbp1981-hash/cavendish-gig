-- Gestão Formal de Riscos
CREATE TABLE public.riscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('legal','financeiro','reputacional','operacional','ambiental')),
  probabilidade INT CHECK (probabilidade BETWEEN 1 AND 5),
  impacto INT CHECK (impacto BETWEEN 1 AND 5),
  nivel_risco INT GENERATED ALWAYS AS (COALESCE(probabilidade,0) * COALESCE(impacto,0)) STORED,
  status TEXT NOT NULL DEFAULT 'identificado' CHECK (status IN ('identificado','mitigando','mitigado','aceito')),
  responsavel_id UUID REFERENCES auth.users(id),
  plano_acao TEXT,
  prazo DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_riscos_organization ON public.riscos(organization_id);
CREATE INDEX idx_riscos_status ON public.riscos(status);

ALTER TABLE public.riscos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "riscos_select" ON public.riscos FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "riscos_insert" ON public.riscos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "riscos_update" ON public.riscos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "riscos_delete" ON public.riscos FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

CREATE TRIGGER set_riscos_updated_at
  BEFORE UPDATE ON public.riscos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
