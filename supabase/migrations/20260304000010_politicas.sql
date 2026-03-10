-- Gestão de Políticas Corporativas
CREATE TABLE public.politicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('anticorrupcao','privacidade','risco','conduta','outro')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','revisao','aprovado','publicado','revogado')),
  versao TEXT NOT NULL DEFAULT '1.0',
  conteudo TEXT,
  documento_url TEXT,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_politicas_organization ON public.politicas(organization_id);
CREATE INDEX idx_politicas_status ON public.politicas(status);

ALTER TABLE public.politicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "politicas_select" ON public.politicas FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organizacao_id = politicas.organization_id AND om.user_id = auth.uid())
  OR (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "politicas_insert" ON public.politicas FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "politicas_update" ON public.politicas FOR UPDATE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "politicas_delete" ON public.politicas FOR DELETE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_politicas_updated_at
  BEFORE UPDATE ON public.politicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
