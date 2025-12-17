-- =============================================
-- Migration: Google Drive Integration + Document Notification Triggers
-- =============================================

-- 1. Add Google Drive folder fields to organizations
ALTER TABLE public.organizacoes 
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;

-- 2. Add system settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage system settings" ON public.system_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('google_drive_base_folder_id', NULL, 'ID da pasta raiz no Google Drive onde as pastas dos clientes serão criadas'),
  ('google_drive_enabled', 'false', 'Habilita a integração com Google Drive')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 3. Notification Triggers for Document Events
-- =============================================

-- Helper function to create notifications
CREATE OR REPLACE FUNCTION public.create_document_notification(
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_user_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, metadata)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_metadata);
END;
$$;

-- Trigger function for document status changes
CREATE OR REPLACE FUNCTION public.notify_on_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doc_name TEXT;
  v_org_name TEXT;
  v_org_id UUID;
  v_projeto_id UUID;
  v_user_id UUID;
  v_consultor RECORD;
  v_member RECORD;
BEGIN
  -- Get document info
  SELECT dr.nome, p.organizacao_id, p.id
  INTO v_doc_name, v_org_id, v_projeto_id
  FROM public.documentos_requeridos dr
  JOIN public.projetos p ON p.id = dr.projeto_id
  WHERE dr.id = NEW.documento_requerido_id;

  -- Get organization name
  SELECT nome INTO v_org_name FROM public.organizacoes WHERE id = v_org_id;

  -- On document sent (INSERT with status 'enviado' or UPDATE to 'enviado')
  IF (TG_OP = 'INSERT' AND NEW.status = 'enviado') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'enviado' AND OLD.status != 'enviado') THEN
    
    -- Notify all consultants and admins
    FOR v_consultor IN 
      SELECT DISTINCT ur.user_id 
      FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'consultor')
    LOOP
      PERFORM create_document_notification(
        'documento_enviado',
        'Novo documento enviado',
        'O documento "' || v_doc_name || '" foi enviado pela empresa ' || v_org_name,
        v_consultor.user_id,
        jsonb_build_object(
          'status_id', NEW.id,
          'documento_nome', v_doc_name,
          'organizacao_id', v_org_id,
          'organizacao_nome', v_org_name
        )
      );
    END LOOP;
  END IF;

  -- On document approved
  IF TG_OP = 'UPDATE' AND NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    -- Notify all members of the organization
    FOR v_member IN 
      SELECT om.user_id 
      FROM public.organization_members om 
      WHERE om.organizacao_id = v_org_id
    LOOP
      PERFORM create_document_notification(
        'documento_aprovado',
        'Documento aprovado',
        'O documento "' || v_doc_name || '" foi aprovado pelo consultor.',
        v_member.user_id,
        jsonb_build_object(
          'status_id', NEW.id,
          'documento_nome', v_doc_name
        )
      );
    END LOOP;
  END IF;

  -- On document rejected
  IF TG_OP = 'UPDATE' AND NEW.status = 'rejeitado' AND OLD.status != 'rejeitado' THEN
    -- Notify all members of the organization
    FOR v_member IN 
      SELECT om.user_id 
      FROM public.organization_members om 
      WHERE om.organizacao_id = v_org_id
    LOOP
      PERFORM create_document_notification(
        'documento_rejeitado',
        'Documento rejeitado',
        'O documento "' || v_doc_name || '" precisa de correção. Motivo: ' || COALESCE(NEW.observacao_rejeicao, 'Não informado'),
        v_member.user_id,
        jsonb_build_object(
          'status_id', NEW.id,
          'documento_nome', v_doc_name,
          'motivo', NEW.observacao_rejeicao
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers (drop first if exists to recreate)
DROP TRIGGER IF EXISTS on_document_status_insert ON public.documentos_requeridos_status;
DROP TRIGGER IF EXISTS on_document_status_update ON public.documentos_requeridos_status;

CREATE TRIGGER on_document_status_insert
  AFTER INSERT ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_status_change();

CREATE TRIGGER on_document_status_update
  AFTER UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_status_change();

-- =============================================
-- 4. Enhanced onboarding to include Drive folder creation
-- =============================================

-- Update the create_client_onboarding function to return drive info
CREATE OR REPLACE FUNCTION public.create_client_onboarding(
  p_nome_organizacao TEXT,
  p_cnpj TEXT,
  p_tipo_projeto tipo_projeto,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_projeto_id UUID;
  v_drive_enabled BOOLEAN;
BEGIN
  -- Check if Drive integration is enabled
  SELECT value::boolean INTO v_drive_enabled 
  FROM public.system_settings 
  WHERE key = 'google_drive_enabled';

  -- Criar organização
  INSERT INTO public.organizacoes (nome, cnpj)
  VALUES (p_nome_organizacao, p_cnpj)
  RETURNING id INTO v_org_id;

  -- Adicionar usuário como membro
  INSERT INTO public.organization_members (organizacao_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'cliente');

  -- Criar projeto (trigger criará documentos automaticamente)
  INSERT INTO public.projetos (organizacao_id, nome, tipo)
  VALUES (v_org_id, 'Projeto ' || p_nome_organizacao, p_tipo_projeto)
  RETURNING id INTO v_projeto_id;

  RETURN jsonb_build_object(
    'success', true,
    'organizacao_id', v_org_id,
    'projeto_id', v_projeto_id,
    'drive_enabled', COALESCE(v_drive_enabled, false)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_document_notification TO authenticated;
