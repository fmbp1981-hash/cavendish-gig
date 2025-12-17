-- =============================================
-- Migration: Sistema de Versionamento de Documentos
-- Descrição: Mantém histórico completo de versões com rastreabilidade
-- =============================================

-- 1. Criar tabela de versões
CREATE TABLE IF NOT EXISTS public.documento_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot dos dados do documento naquele momento
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  url TEXT NOT NULL,
  tamanho BIGINT,
  mime_type TEXT,
  drive_file_id TEXT,

  -- Metadados da versão
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Mudanças realizadas
  change_type TEXT NOT NULL DEFAULT 'update', -- 'create', 'update', 'metadata_change'
  change_description TEXT,
  changed_fields JSONB, -- Array de campos que foram alterados

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Constraint: version_number único por documento
  UNIQUE(documento_id, version_number)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_doc_versoes_documento_id
ON public.documento_versoes(documento_id);

CREATE INDEX IF NOT EXISTS idx_doc_versoes_created_at
ON public.documento_versoes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doc_versoes_created_by
ON public.documento_versoes(created_by);

CREATE INDEX IF NOT EXISTS idx_doc_versoes_version_number
ON public.documento_versoes(documento_id, version_number DESC);

-- 3. Função para obter próximo número de versão
CREATE OR REPLACE FUNCTION get_next_version_number(p_documento_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_max_version
  FROM public.documento_versoes
  WHERE documento_id = p_documento_id;

  RETURN v_max_version;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para criar versão inicial (quando documento é criado)
CREATE OR REPLACE FUNCTION create_initial_document_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.documento_versoes (
    documento_id,
    version_number,
    nome,
    descricao,
    tipo,
    url,
    tamanho,
    mime_type,
    drive_file_id,
    organizacao_id,
    projeto_id,
    uploaded_by,
    change_type,
    change_description,
    created_by
  ) VALUES (
    NEW.id,
    1,
    NEW.nome,
    NEW.descricao,
    NEW.tipo,
    NEW.url,
    NEW.tamanho,
    NEW.mime_type,
    NEW.drive_file_id,
    NEW.organizacao_id,
    NEW.projeto_id,
    NEW.uploaded_by,
    'create',
    'Versão inicial do documento',
    NEW.uploaded_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para criar nova versão (quando documento é atualizado)
CREATE OR REPLACE FUNCTION create_document_version_on_update()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
  v_changed_fields JSONB := '[]'::jsonb;
  v_change_description TEXT := '';
BEGIN
  -- Obter próximo número de versão
  v_version_number := get_next_version_number(NEW.id);

  -- Detectar campos alterados
  IF OLD.nome != NEW.nome THEN
    v_changed_fields := v_changed_fields || '["nome"]'::jsonb;
    v_change_description := v_change_description || 'Nome alterado; ';
  END IF;

  IF OLD.descricao IS DISTINCT FROM NEW.descricao THEN
    v_changed_fields := v_changed_fields || '["descricao"]'::jsonb;
    v_change_description := v_change_description || 'Descrição alterada; ';
  END IF;

  IF OLD.url != NEW.url THEN
    v_changed_fields := v_changed_fields || '["url"]'::jsonb;
    v_change_description := v_change_description || 'Arquivo substituído; ';
  END IF;

  IF OLD.tipo IS DISTINCT FROM NEW.tipo THEN
    v_changed_fields := v_changed_fields || '["tipo"]'::jsonb;
    v_change_description := v_change_description || 'Tipo alterado; ';
  END IF;

  -- Se algum campo mudou, criar nova versão
  IF v_changed_fields::text != '[]' THEN
    INSERT INTO public.documento_versoes (
      documento_id,
      version_number,
      nome,
      descricao,
      tipo,
      url,
      tamanho,
      mime_type,
      drive_file_id,
      organizacao_id,
      projeto_id,
      uploaded_by,
      change_type,
      change_description,
      changed_fields,
      created_by
    ) VALUES (
      NEW.id,
      v_version_number,
      OLD.nome,  -- Salvamos o estado ANTERIOR
      OLD.descricao,
      OLD.tipo,
      OLD.url,
      OLD.tamanho,
      OLD.mime_type,
      OLD.drive_file_id,
      OLD.organizacao_id,
      OLD.projeto_id,
      OLD.uploaded_by,
      'update',
      TRIM(TRAILING '; ' FROM v_change_description),
      v_changed_fields,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para restaurar versão anterior
CREATE OR REPLACE FUNCTION restore_document_version(
  p_documento_id UUID,
  p_version_number INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_version RECORD;
BEGIN
  -- Buscar a versão específica
  SELECT * INTO v_version
  FROM public.documento_versoes
  WHERE documento_id = p_documento_id
    AND version_number = p_version_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versão não encontrada';
  END IF;

  -- Restaurar os dados da versão
  UPDATE public.documentos
  SET
    nome = v_version.nome,
    descricao = v_version.descricao,
    tipo = v_version.tipo,
    url = v_version.url,
    tamanho = v_version.tamanho,
    mime_type = v_version.mime_type,
    drive_file_id = v_version.drive_file_id,
    updated_at = now()
  WHERE id = p_documento_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Triggers
-- Criar versão inicial quando documento é criado
DROP TRIGGER IF EXISTS trigger_create_initial_version ON public.documentos;
CREATE TRIGGER trigger_create_initial_version
  AFTER INSERT ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_document_version();

-- Criar nova versão quando documento é atualizado
DROP TRIGGER IF EXISTS trigger_create_version_on_update ON public.documentos;
CREATE TRIGGER trigger_create_version_on_update
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version_on_update();

-- 8. RLS Policies
ALTER TABLE public.documento_versoes ENABLE ROW LEVEL SECURITY;

-- Policy: Ver versões de documentos que o usuário tem acesso
DROP POLICY IF EXISTS "Users can view versions of accessible documents" ON public.documento_versoes;
CREATE POLICY "Users can view versions of accessible documents"
ON public.documento_versoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documentos d
    WHERE d.id = documento_versoes.documento_id
    AND (
      -- Admin/Consultor vê tudo
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'consultor')
      )
      OR
      -- Cliente vê versões de documentos da sua organização
      d.organizacao_id IN (
        SELECT organizacao_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  )
);

-- Policy: Apenas sistema pode inserir versões (via trigger)
-- Usuários não inserem diretamente

-- 9. Comentários para documentação
COMMENT ON TABLE public.documento_versoes IS 'Histórico completo de versões de todos os documentos do sistema';
COMMENT ON COLUMN public.documento_versoes.version_number IS 'Número sequencial da versão (1, 2, 3...)';
COMMENT ON COLUMN public.documento_versoes.change_type IS 'Tipo de mudança: create, update, metadata_change';
COMMENT ON COLUMN public.documento_versoes.changed_fields IS 'Array JSON dos campos que foram alterados';
COMMENT ON FUNCTION restore_document_version IS 'Restaura um documento para uma versão anterior específica';

-- 10. View helper para facilitar queries
CREATE OR REPLACE VIEW public.documento_versoes_resumo AS
SELECT
  dv.id,
  dv.documento_id,
  dv.version_number,
  dv.nome,
  dv.change_type,
  dv.change_description,
  dv.created_at,
  dv.created_by,
  p.nome as created_by_name,
  p.avatar_url as created_by_avatar,
  d.nome as documento_atual_nome
FROM public.documento_versoes dv
LEFT JOIN public.profiles p ON p.id = dv.created_by
LEFT JOIN public.documentos d ON d.id = dv.documento_id
ORDER BY dv.created_at DESC;

-- Grant permissions on view
GRANT SELECT ON public.documento_versoes_resumo TO authenticated;

-- 11. Função para obter diferenças entre versões
CREATE OR REPLACE FUNCTION get_version_diff(
  p_documento_id UUID,
  p_version_from INTEGER,
  p_version_to INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_from RECORD;
  v_to RECORD;
  v_diff JSONB := '{}'::jsonb;
BEGIN
  -- Buscar versão origem
  SELECT * INTO v_from
  FROM public.documento_versoes
  WHERE documento_id = p_documento_id AND version_number = p_version_from;

  -- Buscar versão destino
  SELECT * INTO v_to
  FROM public.documento_versoes
  WHERE documento_id = p_documento_id AND version_number = p_version_to;

  -- Comparar campos
  IF v_from.nome != v_to.nome THEN
    v_diff := v_diff || jsonb_build_object('nome', jsonb_build_object('from', v_from.nome, 'to', v_to.nome));
  END IF;

  IF v_from.descricao IS DISTINCT FROM v_to.descricao THEN
    v_diff := v_diff || jsonb_build_object('descricao', jsonb_build_object('from', v_from.descricao, 'to', v_to.descricao));
  END IF;

  IF v_from.url != v_to.url THEN
    v_diff := v_diff || jsonb_build_object('arquivo', jsonb_build_object('changed', true));
  END IF;

  RETURN v_diff;
END;
$$ LANGUAGE plpgsql;

-- 12. ANALYZE
ANALYZE public.documento_versoes;

-- Success message
SELECT '✅ Sistema de versionamento de documentos criado com sucesso!' AS status;
