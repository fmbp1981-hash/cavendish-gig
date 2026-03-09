-- KPIs de Compliance
CREATE TABLE public.kpis_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT '%',
  meta NUMERIC NOT NULL,
  valor_atual NUMERIC,
  periodicidade TEXT NOT NULL DEFAULT 'mensal' CHECK (periodicidade IN ('semanal','mensal','trimestral','anual')),
  responsavel_id UUID REFERENCES auth.users(id),
  ultima_atualizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kpis_organization ON public.kpis_compliance(organization_id);

ALTER TABLE public.kpis_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpis_select" ON public.kpis_compliance FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "kpis_insert" ON public.kpis_compliance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "kpis_update" ON public.kpis_compliance FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "kpis_delete" ON public.kpis_compliance FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
