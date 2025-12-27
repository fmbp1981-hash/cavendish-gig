-- =============================================================
-- Cavendish GIG - Audit Logs System (Append-Only)
-- Date: 2025-12-27
-- PRD: Logs de auditoria imutáveis para responsabilização
-- =============================================================

-- 1) Create audit_logs table (append-only, no UPDATE/DELETE allowed)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- What was affected
  table_name TEXT NOT NULL,
  record_id UUID,
  
  -- What happened
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'GENERATE')),
  
  -- Context
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Data changes (for UPDATE, stores old and new values)
  old_data JSONB,
  new_data JSONB,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Hash for integrity verification (optional chain)
  checksum TEXT
);

-- 2) Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organizacao_id ON public.audit_logs(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);

-- Composite index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_table_time 
ON public.audit_logs(organizacao_id, table_name, timestamp DESC);

-- 3) Enable RLS but only allow SELECT for admins (no UPDATE/DELETE ever)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Consultors can view audit logs for their assigned organizations
CREATE POLICY "Consultors can view audit logs for assigned orgs"
ON public.audit_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND organizacao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = audit_logs.organizacao_id
  )
);

-- System/service role can insert (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- NO UPDATE OR DELETE POLICIES - audit logs are immutable

-- 4) Create generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_org_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = v_user_id LIMIT 1;
  END IF;
  
  -- Determine record ID and organization ID based on operation
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    
    -- Try to get organizacao_id from OLD record
    IF OLD ? 'organizacao_id' THEN
      v_org_id := (OLD->>'organizacao_id')::UUID;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    IF NEW ? 'organizacao_id' THEN
      v_org_id := (NEW->>'organizacao_id')::UUID;
    END IF;
  ELSE -- INSERT
    v_record_id := NEW.id;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    
    IF NEW ? 'organizacao_id' THEN
      v_org_id := (NEW->>'organizacao_id')::UUID;
    END IF;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    table_name,
    record_id,
    action,
    organizacao_id,
    old_data,
    new_data,
    metadata
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_org_id,
    v_old_data,
    v_new_data,
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'trigger', TG_NAME
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 5) Create triggers on critical tables

-- Documentos
DROP TRIGGER IF EXISTS audit_documentos ON public.documentos;
CREATE TRIGGER audit_documentos
AFTER INSERT OR UPDATE OR DELETE ON public.documentos
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Denuncias
DROP TRIGGER IF EXISTS audit_denuncias ON public.denuncias;
CREATE TRIGGER audit_denuncias
AFTER INSERT OR UPDATE OR DELETE ON public.denuncias
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Tarefas
DROP TRIGGER IF EXISTS audit_tarefas ON public.tarefas;
CREATE TRIGGER audit_tarefas
AFTER INSERT OR UPDATE OR DELETE ON public.tarefas
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- User roles
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Organizacoes
DROP TRIGGER IF EXISTS audit_organizacoes ON public.organizacoes;
CREATE TRIGGER audit_organizacoes
AFTER INSERT OR UPDATE OR DELETE ON public.organizacoes
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Organization members
DROP TRIGGER IF EXISTS audit_organization_members ON public.organization_members;
CREATE TRIGGER audit_organization_members
AFTER INSERT OR UPDATE OR DELETE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Projetos
DROP TRIGGER IF EXISTS audit_projetos ON public.projetos;
CREATE TRIGGER audit_projetos
AFTER INSERT OR UPDATE OR DELETE ON public.projetos
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Codigo de etica
DROP TRIGGER IF EXISTS audit_codigo_etica ON public.codigo_etica;
CREATE TRIGGER audit_codigo_etica
AFTER INSERT OR UPDATE OR DELETE ON public.codigo_etica
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Integrations (sensitive)
DROP TRIGGER IF EXISTS audit_integrations ON public.integrations;
CREATE TRIGGER audit_integrations
AFTER INSERT OR UPDATE OR DELETE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- 6) Helper function to log custom actions (for Edge Functions)
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_organizacao_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = v_user_id LIMIT 1;
  END IF;
  
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    table_name,
    record_id,
    action,
    organizacao_id,
    metadata
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_table_name,
    p_record_id,
    p_action,
    p_organizacao_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 7) View for easier querying
CREATE OR REPLACE VIEW public.audit_logs_view AS
SELECT 
  al.id,
  al.timestamp,
  al.user_email,
  al.user_role,
  al.table_name,
  al.record_id,
  al.action,
  o.nome AS organizacao_nome,
  al.old_data,
  al.new_data,
  al.metadata
FROM public.audit_logs al
LEFT JOIN public.organizacoes o ON o.id = al.organizacao_id
ORDER BY al.timestamp DESC;

-- Grant access to view
GRANT SELECT ON public.audit_logs_view TO authenticated;
