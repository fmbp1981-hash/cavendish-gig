-- =============================================
-- Migration: Função wrapper para pg_cron chamar send-monthly-reports
-- Lê o CRON_SECRET da tabela system_settings (evita hardcode no cron job)
-- =============================================

-- Armazena o CRON_SECRET na tabela system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'cron_secret',
  '22ddd5012def43be8ad6c4b4be34e51d2821a7bf4163ca6a97bbbf3be2732950',
  'Segredo compartilhado para autenticar chamadas do cron job para a Edge Function send-monthly-reports'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- Cria função wrapper SECURITY DEFINER que chama a Edge Function via pg_net
CREATE OR REPLACE FUNCTION public.trigger_monthly_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT value INTO v_secret
  FROM public.system_settings
  WHERE key = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE WARNING 'cron_secret not found in system_settings — skipping monthly reports';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := 'https://fenfgjqlsqzvxloeavdc.supabase.co/functions/v1/send-monthly-reports',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'x-cron-secret',  v_secret
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- Reagenda o cron job para usar a função wrapper
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-reports') THEN
    PERFORM cron.unschedule('monthly-reports');
  END IF;
END $$;

SELECT cron.schedule(
  'monthly-reports',
  '0 11 1 * *',
  'SELECT public.trigger_monthly_reports()'
);
