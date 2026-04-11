-- =============================================
-- Migration: Adiciona SECURITY DEFINER nas funções trigger de documento_versoes
-- Problema: Trigger tentava INSERT em documento_versoes sem permissão do usuário
--           (tabela tem RLS ativo mas zero política de INSERT), causando 403
-- Solução: SECURITY DEFINER faz o trigger rodar como owner (bypassa RLS)
-- =============================================

CREATE OR REPLACE FUNCTION create_initial_document_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.documento_versoes (
    documento_id, version_number, nome, descricao, tipo, url,
    tamanho, mime_type, drive_file_id, organizacao_id, projeto_id,
    uploaded_by, change_type, change_description, created_by
  ) VALUES (
    NEW.id, 1, NEW.nome, NEW.descricao,
    COALESCE(NEW.tipo, 'application/octet-stream'), NEW.url,
    NEW.tamanho_bytes, NULL,
    NEW.drive_file_id, NEW.organizacao_id, NEW.projeto_id,
    NEW.uploaded_by, 'create', 'Versão inicial do documento', NEW.uploaded_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_document_version_on_update()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
  v_changed_fields JSONB := '[]'::jsonb;
  v_change_description TEXT := '';
BEGIN
  v_version_number := get_next_version_number(NEW.id);

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

  IF v_changed_fields::text != '[]' THEN
    INSERT INTO public.documento_versoes (
      documento_id, version_number, nome, descricao, tipo, url,
      tamanho, mime_type, drive_file_id, organizacao_id, projeto_id,
      uploaded_by, change_type, change_description, changed_fields, created_by
    ) VALUES (
      NEW.id, v_version_number, OLD.nome, OLD.descricao, OLD.tipo, OLD.url,
      OLD.tamanho_bytes, NULL,
      OLD.drive_file_id, OLD.organizacao_id, OLD.projeto_id,
      OLD.uploaded_by, 'update',
      TRIM(TRAILING '; ' FROM v_change_description),
      v_changed_fields, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
