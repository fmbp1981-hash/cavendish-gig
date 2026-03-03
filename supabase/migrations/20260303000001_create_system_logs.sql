-- =============================================================================
-- Migration: create_system_logs
-- Tabela de logs do sistema para monitoramento de bugs e falhas
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.system_logs (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  level          TEXT        NOT NULL CHECK (level IN ('error', 'warning', 'info')),
  source         TEXT        NOT NULL,
  -- 'edge_function' | 'frontend' | 'auth' | 'cron' | 'integration' | 'database'
  function_name  TEXT,
  message        TEXT        NOT NULL,
  details        JSONB,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  organizacao_id UUID        REFERENCES public.organizacoes(id) ON DELETE SET NULL,
  resolved       BOOLEAN     DEFAULT FALSE NOT NULL,
  resolved_at    TIMESTAMPTZ,
  resolved_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS system_logs_created_at_idx  ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS system_logs_level_idx        ON public.system_logs (level);
CREATE INDEX IF NOT EXISTS system_logs_source_idx       ON public.system_logs (source);
CREATE INDEX IF NOT EXISTS system_logs_resolved_idx     ON public.system_logs (resolved);
CREATE INDEX IF NOT EXISTS system_logs_user_id_idx      ON public.system_logs (user_id);

-- RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler logs
CREATE POLICY "admins_select_system_logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Qualquer usuário autenticado pode inserir (logging de erros do frontend)
CREATE POLICY "authenticated_insert_system_logs"
  ON public.system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas admins podem resolver / adicionar notas
CREATE POLICY "admins_update_system_logs"
  ON public.system_logs FOR UPDATE
  TO authenticated
  USING  (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Service role tem acesso total (Edge Functions usam service_role key)
CREATE POLICY "service_role_all_system_logs"
  ON public.system_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
