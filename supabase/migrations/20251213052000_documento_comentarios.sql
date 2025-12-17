-- =============================================
-- Sistema de Comentários em Documentos
-- =============================================

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS public.documento_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  parent_id UUID REFERENCES public.documento_comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_doc_comentarios_documento_id
ON public.documento_comentarios(documento_id);

CREATE INDEX IF NOT EXISTS idx_doc_comentarios_user_id
ON public.documento_comentarios(user_id);

CREATE INDEX IF NOT EXISTS idx_doc_comentarios_parent_id
ON public.documento_comentarios(parent_id)
WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doc_comentarios_created_at
ON public.documento_comentarios(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_documento_comentarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documento_comentarios_updated_at
  BEFORE UPDATE ON public.documento_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION update_documento_comentarios_updated_at();

-- RLS Policies
ALTER TABLE public.documento_comentarios ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver comentários de documentos que têm acesso
CREATE POLICY "Users can view comments on accessible documents"
ON public.documento_comentarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = documento_comentarios.documento_id
    AND (
      -- Admin/Consultor vê tudo
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'consultor')
      )
      OR
      -- Cliente vê comentários de documentos da sua organização
      d.organizacao_id IN (
        SELECT organizacao_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  )
);

-- Policy: Usuários autenticados podem criar comentários
CREATE POLICY "Authenticated users can create comments"
ON public.documento_comentarios
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = documento_comentarios.documento_id
    AND (
      -- Admin/Consultor pode comentar em qualquer documento
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'consultor')
      )
      OR
      -- Cliente pode comentar em documentos da sua organização
      d.organizacao_id IN (
        SELECT organizacao_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  )
);

-- Policy: Usuários podem atualizar seus próprios comentários
CREATE POLICY "Users can update own comments"
ON public.documento_comentarios
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios comentários
CREATE POLICY "Users can delete own comments"
ON public.documento_comentarios
FOR DELETE
USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.documento_comentarios IS 'Comentários e discussões sobre documentos';
COMMENT ON COLUMN public.documento_comentarios.parent_id IS 'ID do comentário pai para criar threads/respostas';

-- ANALYZE
ANALYZE public.documento_comentarios;
