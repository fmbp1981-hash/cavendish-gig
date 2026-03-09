-- Gestão de Incidentes
CREATE TABLE public.incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('vazamento_dados','fraude','corrupcao','assedio','outro')),
  severidade TEXT NOT NULL DEFAULT 'media' CHECK (severidade IN ('baixa','media','alta','critica')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','investigando','resolvido','encerrado')),
  data_ocorrencia TIMESTAMPTZ NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id),
  plano_corretivo TEXT,
  licoes_aprendidas TEXT,
  notificacao_anpd BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_incidentes_organization ON public.incidentes(organization_id);
CREATE INDEX idx_incidentes_status ON public.incidentes(status);
CREATE INDEX idx_incidentes_severidade ON public.incidentes(severidade);

ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incidentes_select" ON public.incidentes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "incidentes_insert" ON public.incidentes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "incidentes_update" ON public.incidentes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);
CREATE POLICY "incidentes_delete" ON public.incidentes FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

CREATE TRIGGER set_incidentes_updated_at
  BEFORE UPDATE ON public.incidentes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
