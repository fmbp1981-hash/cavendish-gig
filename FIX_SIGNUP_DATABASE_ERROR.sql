-- ==============================================================================
-- FIX: Erro "Database error saving new user" no cadastro (Audit Logs Trigger)
-- ==============================================================================
-- Execute este SQL completo no Supabase Dashboard → SQL Editor
-- Tempo estimado: 2 segundos
--
-- PROBLEMA ORIGEM:
-- O trigger genérico "audit_log_trigger" (criado em Dez/2025) continha um bug de 
-- sintaxe do PL/pgSQL na verificação dinâmica de colunas (NEW ? 'organizacao_id')
-- usando operadores JSONB diretamente sobre o tipo RECORD do trigger.
-- Isso causava a falha das inserções automáticas na tabela `user_roles`, 
-- que por sua vez cancelava a criação do `auth.users` exibindo erro genérico no app.
-- ==============================================================================

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
    
    -- Try to get organizacao_id from OLD record (FIX: v_old_data em vez de OLD)
    IF v_old_data ? 'organizacao_id' THEN
      v_org_id := (v_old_data->>'organizacao_id')::UUID;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- FIX: v_new_data em vez de NEW
    IF v_new_data ? 'organizacao_id' THEN
      v_org_id := (v_new_data->>'organizacao_id')::UUID;
    END IF;
  ELSE -- INSERT
    v_record_id := NEW.id;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    
    -- FIX: v_new_data em vez de NEW
    IF v_new_data ? 'organizacao_id' THEN
      v_org_id := (v_new_data->>'organizacao_id')::UUID;
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
