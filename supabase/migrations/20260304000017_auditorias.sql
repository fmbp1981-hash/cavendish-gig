-- Auditoria Interna + Não Conformidades
CREATE TABLE public.auditorias_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  escopo TEXT,
  auditor TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','em_andamento','concluida')),
  resultado TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.nao_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id UUID NOT NULL REFERENCES auditorias_internas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  gravidade TEXT NOT NULL DEFAULT 'menor' CHECK (gravidade IN ('menor','maior','critica')),
  acao_corretiva TEXT,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_tratamento','encerrada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_auditorias_organization ON public.auditorias_internas(organization_id);
CREATE INDEX idx_nao_conformidades_auditoria ON public.nao_conformidades(auditoria_id);

ALTER TABLE public.auditorias_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditorias_select" ON public.auditorias_internas FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "auditorias_insert" ON public.auditorias_internas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "auditorias_update" ON public.auditorias_internas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "auditorias_delete" ON public.auditorias_internas FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

CREATE POLICY "nao_conformidades_select" ON public.nao_conformidades FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auditorias_internas a
    JOIN profiles p ON p.id = auth.uid() AND p.role IN ('admin','consultor')
    WHERE a.id = nao_conformidades.auditoria_id
  )
);
CREATE POLICY "nao_conformidades_insert" ON public.nao_conformidades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "nao_conformidades_update" ON public.nao_conformidades FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "nao_conformidades_delete" ON public.nao_conformidades FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

CREATE TRIGGER set_auditorias_updated_at
  BEFORE UPDATE ON public.auditorias_internas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_nao_conformidades_updated_at
  BEFORE UPDATE ON public.nao_conformidades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
