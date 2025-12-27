-- =============================================================
-- Cavendish GIG - Plan Management System (Feature Flags + Quotas)
-- Date: 2025-12-27
-- PRD: Gestão de planos (Essencial/Executivo/Premium) com variação de features e limites
-- =============================================================

-- 1) Create plan enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plano_tipo') THEN
    CREATE TYPE public.plano_tipo AS ENUM ('essencial', 'executivo', 'premium');
  END IF;
END$$;

-- 2) Add plano column to organizacoes
ALTER TABLE public.organizacoes 
ADD COLUMN IF NOT EXISTS plano public.plano_tipo NOT NULL DEFAULT 'essencial';

ALTER TABLE public.organizacoes 
ADD COLUMN IF NOT EXISTS plano_inicio DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.organizacoes 
ADD COLUMN IF NOT EXISTS plano_fim DATE;

-- Index for plan queries
CREATE INDEX IF NOT EXISTS idx_organizacoes_plano ON public.organizacoes(plano);

-- 3) Create plan configuration table (defines what each plan includes)
CREATE TABLE IF NOT EXISTS public.plano_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano public.plano_tipo NOT NULL UNIQUE,
  nome_exibicao TEXT NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2),
  
  -- Feature flags (boolean)
  feat_diagnostico BOOLEAN NOT NULL DEFAULT true,
  feat_codigo_etica BOOLEAN NOT NULL DEFAULT true,
  feat_canal_denuncias BOOLEAN NOT NULL DEFAULT true,
  feat_treinamentos BOOLEAN NOT NULL DEFAULT true,
  feat_certificados BOOLEAN NOT NULL DEFAULT true,
  feat_relatorios_mensais BOOLEAN NOT NULL DEFAULT false,
  feat_integracao_drive BOOLEAN NOT NULL DEFAULT false,
  feat_integracao_calendar BOOLEAN NOT NULL DEFAULT false,
  feat_integracao_trello BOOLEAN NOT NULL DEFAULT false,
  feat_integracao_clickup BOOLEAN NOT NULL DEFAULT false,
  feat_integracao_fireflies BOOLEAN NOT NULL DEFAULT false,
  feat_whatsapp_notifications BOOLEAN NOT NULL DEFAULT false,
  feat_api_webhooks BOOLEAN NOT NULL DEFAULT false,
  feat_white_label BOOLEAN NOT NULL DEFAULT false,
  feat_suporte_prioritario BOOLEAN NOT NULL DEFAULT false,
  
  -- Quotas/Limits (NULL = unlimited)
  limit_usuarios INTEGER,
  limit_documentos_mes INTEGER,
  limit_treinamentos INTEGER,
  limit_ai_generations_mes INTEGER,
  limit_storage_gb INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Insert default plan configurations
INSERT INTO public.plano_config (
  plano, nome_exibicao, descricao, preco_mensal,
  feat_diagnostico, feat_codigo_etica, feat_canal_denuncias, feat_treinamentos, feat_certificados,
  feat_relatorios_mensais, feat_integracao_drive, feat_integracao_calendar,
  feat_integracao_trello, feat_integracao_clickup, feat_integracao_fireflies,
  feat_whatsapp_notifications, feat_api_webhooks, feat_white_label, feat_suporte_prioritario,
  limit_usuarios, limit_documentos_mes, limit_treinamentos, limit_ai_generations_mes, limit_storage_gb
) VALUES 
(
  'essencial', 'Essencial', 'Ideal para pequenas empresas iniciando em governança',
  997.00,
  true, true, true, true, true, -- Basic features
  false, false, false, -- No integrations
  false, false, false, -- No advanced integrations
  false, false, false, false, -- No premium features
  5, 50, 5, 10, 5 -- Limited quotas
),
(
  'executivo', 'Executivo', 'Para empresas em crescimento com necessidades de integração',
  1997.00,
  true, true, true, true, true, -- Basic features
  true, true, true, -- Core integrations
  true, true, false, -- Some advanced integrations
  true, false, false, true, -- Some premium features
  15, 200, 20, 50, 20 -- Higher quotas
),
(
  'premium', 'Premium', 'Solução completa para empresas que exigem o máximo',
  3997.00,
  true, true, true, true, true, -- Basic features
  true, true, true, -- All integrations
  true, true, true, -- All advanced integrations
  true, true, true, true, -- All premium features
  NULL, NULL, NULL, NULL, NULL -- Unlimited
)
ON CONFLICT (plano) DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  descricao = EXCLUDED.descricao,
  preco_mensal = EXCLUDED.preco_mensal,
  feat_diagnostico = EXCLUDED.feat_diagnostico,
  feat_codigo_etica = EXCLUDED.feat_codigo_etica,
  feat_canal_denuncias = EXCLUDED.feat_canal_denuncias,
  feat_treinamentos = EXCLUDED.feat_treinamentos,
  feat_certificados = EXCLUDED.feat_certificados,
  feat_relatorios_mensais = EXCLUDED.feat_relatorios_mensais,
  feat_integracao_drive = EXCLUDED.feat_integracao_drive,
  feat_integracao_calendar = EXCLUDED.feat_integracao_calendar,
  feat_integracao_trello = EXCLUDED.feat_integracao_trello,
  feat_integracao_clickup = EXCLUDED.feat_integracao_clickup,
  feat_integracao_fireflies = EXCLUDED.feat_integracao_fireflies,
  feat_whatsapp_notifications = EXCLUDED.feat_whatsapp_notifications,
  feat_api_webhooks = EXCLUDED.feat_api_webhooks,
  feat_white_label = EXCLUDED.feat_white_label,
  feat_suporte_prioritario = EXCLUDED.feat_suporte_prioritario,
  limit_usuarios = EXCLUDED.limit_usuarios,
  limit_documentos_mes = EXCLUDED.limit_documentos_mes,
  limit_treinamentos = EXCLUDED.limit_treinamentos,
  limit_ai_generations_mes = EXCLUDED.limit_ai_generations_mes,
  limit_storage_gb = EXCLUDED.limit_storage_gb,
  updated_at = now();

-- 5) RLS for plano_config (read-only for all authenticated users)
ALTER TABLE public.plano_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan configs"
ON public.plano_config
FOR SELECT
USING (true);

-- Only admins can modify plan configs
CREATE POLICY "Admins can manage plan configs"
ON public.plano_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) Helper function to check if organization has a feature
CREATE OR REPLACE FUNCTION public.org_has_feature(
  p_organizacao_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano public.plano_tipo;
  v_has_feature BOOLEAN;
BEGIN
  -- Get organization's plan
  SELECT plano INTO v_plano
  FROM public.organizacoes
  WHERE id = p_organizacao_id;
  
  IF v_plano IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check feature dynamically
  EXECUTE format(
    'SELECT pc.%I FROM public.plano_config pc WHERE pc.plano = $1',
    'feat_' || p_feature
  ) INTO v_has_feature USING v_plano;
  
  RETURN COALESCE(v_has_feature, false);
EXCEPTION
  WHEN undefined_column THEN
    -- Feature doesn't exist in config
    RETURN false;
END;
$$;

-- 7) Helper function to get organization's quota limit
CREATE OR REPLACE FUNCTION public.org_get_limit(
  p_organizacao_id UUID,
  p_limit_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano public.plano_tipo;
  v_limit INTEGER;
BEGIN
  -- Get organization's plan
  SELECT plano INTO v_plano
  FROM public.organizacoes
  WHERE id = p_organizacao_id;
  
  IF v_plano IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get limit dynamically
  EXECUTE format(
    'SELECT pc.%I FROM public.plano_config pc WHERE pc.plano = $1',
    'limit_' || p_limit_name
  ) INTO v_limit USING v_plano;
  
  -- NULL means unlimited
  RETURN v_limit;
EXCEPTION
  WHEN undefined_column THEN
    RETURN 0;
END;
$$;

-- 8) Helper function to check if organization is within quota
CREATE OR REPLACE FUNCTION public.org_check_quota(
  p_organizacao_id UUID,
  p_quota_type TEXT,
  p_current_usage INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
  v_usage INTEGER;
  v_within_limit BOOLEAN;
BEGIN
  v_limit := public.org_get_limit(p_organizacao_id, p_quota_type);
  
  -- If limit is NULL, it's unlimited
  IF v_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', NULL,
      'usage', p_current_usage,
      'unlimited', true
    );
  END IF;
  
  -- Calculate current usage if not provided
  IF p_current_usage IS NULL THEN
    CASE p_quota_type
      WHEN 'usuarios' THEN
        SELECT COUNT(*) INTO v_usage
        FROM public.organization_members
        WHERE organizacao_id = p_organizacao_id;
      WHEN 'documentos_mes' THEN
        SELECT COUNT(*) INTO v_usage
        FROM public.documentos
        WHERE organizacao_id = p_organizacao_id
          AND created_at >= date_trunc('month', CURRENT_DATE);
      WHEN 'ai_generations_mes' THEN
        SELECT COUNT(*) INTO v_usage
        FROM public.ai_generations
        WHERE organizacao_id = p_organizacao_id
          AND created_at >= date_trunc('month', CURRENT_DATE);
      ELSE
        v_usage := 0;
    END CASE;
  ELSE
    v_usage := p_current_usage;
  END IF;
  
  v_within_limit := v_usage < v_limit;
  
  RETURN jsonb_build_object(
    'allowed', v_within_limit,
    'limit', v_limit,
    'usage', v_usage,
    'remaining', GREATEST(0, v_limit - v_usage),
    'unlimited', false
  );
END;
$$;

-- 9) Function to get full plan info for an organization
CREATE OR REPLACE FUNCTION public.org_get_plan_info(p_organizacao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org RECORD;
  v_config RECORD;
BEGIN
  SELECT o.plano, o.plano_inicio, o.plano_fim, o.nome
  INTO v_org
  FROM public.organizacoes o
  WHERE o.id = p_organizacao_id;
  
  IF v_org IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT * INTO v_config
  FROM public.plano_config
  WHERE plano = v_org.plano;
  
  RETURN jsonb_build_object(
    'organizacao_id', p_organizacao_id,
    'organizacao_nome', v_org.nome,
    'plano', v_org.plano,
    'plano_nome', v_config.nome_exibicao,
    'plano_inicio', v_org.plano_inicio,
    'plano_fim', v_org.plano_fim,
    'features', jsonb_build_object(
      'diagnostico', v_config.feat_diagnostico,
      'codigo_etica', v_config.feat_codigo_etica,
      'canal_denuncias', v_config.feat_canal_denuncias,
      'treinamentos', v_config.feat_treinamentos,
      'certificados', v_config.feat_certificados,
      'relatorios_mensais', v_config.feat_relatorios_mensais,
      'integracao_drive', v_config.feat_integracao_drive,
      'integracao_calendar', v_config.feat_integracao_calendar,
      'integracao_trello', v_config.feat_integracao_trello,
      'integracao_clickup', v_config.feat_integracao_clickup,
      'integracao_fireflies', v_config.feat_integracao_fireflies,
      'whatsapp_notifications', v_config.feat_whatsapp_notifications,
      'api_webhooks', v_config.feat_api_webhooks,
      'white_label', v_config.feat_white_label,
      'suporte_prioritario', v_config.feat_suporte_prioritario
    ),
    'limits', jsonb_build_object(
      'usuarios', v_config.limit_usuarios,
      'documentos_mes', v_config.limit_documentos_mes,
      'treinamentos', v_config.limit_treinamentos,
      'ai_generations_mes', v_config.limit_ai_generations_mes,
      'storage_gb', v_config.limit_storage_gb
    )
  );
END;
$$;

-- 10) Trigger to update updated_at on plano_config
CREATE TRIGGER update_plano_config_updated_at
BEFORE UPDATE ON public.plano_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11) Add audit trigger to plano_config
DROP TRIGGER IF EXISTS audit_plano_config ON public.plano_config;
CREATE TRIGGER audit_plano_config
AFTER INSERT OR UPDATE OR DELETE ON public.plano_config
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
