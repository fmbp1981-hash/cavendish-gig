-- Item 3: Múltiplos Arquivos por Campo de Documento
-- Nova tabela de junção: 1 documento_requerido → N anexos

CREATE TABLE public.documentos_requeridos_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_requerido_id UUID NOT NULL REFERENCES public.documentos_requeridos(id) ON DELETE CASCADE,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  status public.status_documento DEFAULT 'enviado',
  ordem INTEGER DEFAULT 0,
  observacao_rejeicao TEXT,
  analisado_por UUID REFERENCES auth.users(id),
  analisado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(documento_requerido_id, documento_id)
);

CREATE INDEX idx_anexos_requerido ON public.documentos_requeridos_anexos(documento_requerido_id);
CREATE INDEX idx_anexos_status ON public.documentos_requeridos_anexos(status);

-- Migrar dados existentes de documentos_requeridos_status
INSERT INTO public.documentos_requeridos_anexos
  (documento_requerido_id, documento_id, status, analisado_por, analisado_em, created_at, updated_at)
SELECT
  documento_requerido_id, documento_id, status, analisado_por, analisado_em, created_at, updated_at
FROM public.documentos_requeridos_status
WHERE documento_id IS NOT NULL;

ALTER TABLE public.documentos_requeridos_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all anexos"
ON public.documentos_requeridos_anexos FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Members view org anexos"
ON public.documentos_requeridos_anexos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documentos_requeridos dr
    JOIN public.projetos p ON p.id = dr.projeto_id
    JOIN public.organization_members om ON om.organizacao_id = p.organizacao_id
    WHERE dr.id = documentos_requeridos_anexos.documento_requerido_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Members insert anexos for own org"
ON public.documentos_requeridos_anexos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documentos_requeridos dr
    JOIN public.projetos p ON p.id = dr.projeto_id
    JOIN public.organization_members om ON om.organizacao_id = p.organizacao_id
    WHERE dr.id = documentos_requeridos_anexos.documento_requerido_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Allocated consultors view and manage anexos"
ON public.documentos_requeridos_anexos FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'consultor')
  AND EXISTS (
    SELECT 1 FROM public.documentos_requeridos dr
    JOIN public.projetos p ON p.id = dr.projeto_id
    JOIN public.consultor_organizacoes co ON co.organizacao_id = p.organizacao_id
    WHERE dr.id = documentos_requeridos_anexos.documento_requerido_id
      AND co.consultor_id = auth.uid()
  )
);

-- Trigger updated_at
CREATE TRIGGER set_anexos_updated_at
  BEFORE UPDATE ON public.documentos_requeridos_anexos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para recalcular status consolidado em documentos_requeridos_status
CREATE OR REPLACE FUNCTION public.recalc_documento_requerido_status(req_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status public.status_documento;
BEGIN
  SELECT CASE
    WHEN COUNT(*) = 0 THEN 'pendente'::public.status_documento
    WHEN COUNT(*) FILTER (WHERE status = 'rejeitado') > 0 THEN 'rejeitado'::public.status_documento
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'aprovado') THEN 'aprovado'::public.status_documento
    WHEN COUNT(*) FILTER (WHERE status = 'em_analise') > 0 THEN 'em_analise'::public.status_documento
    WHEN COUNT(*) FILTER (WHERE status = 'enviado') > 0 THEN 'enviado'::public.status_documento
    ELSE 'pendente'::public.status_documento
  END INTO v_status
  FROM public.documentos_requeridos_anexos
  WHERE documento_requerido_id = req_id;

  INSERT INTO public.documentos_requeridos_status (documento_requerido_id, status, updated_at)
  VALUES (req_id, v_status, NOW())
  ON CONFLICT (documento_requerido_id)
  DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
END;
$$;

-- Trigger automático ao inserir/atualizar/deletar anexo
CREATE OR REPLACE FUNCTION public.trigger_recalc_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.recalc_documento_requerido_status(
    COALESCE(NEW.documento_requerido_id, OLD.documento_requerido_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER recalc_status_on_anexo_change
AFTER INSERT OR UPDATE OR DELETE ON public.documentos_requeridos_anexos
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_status();
