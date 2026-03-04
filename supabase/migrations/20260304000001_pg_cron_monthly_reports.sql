-- =============================================
-- Migration: pg_cron para relatórios mensais automáticos
-- Executa send-monthly-reports todo dia 1 do mês às 08:00 BRT (11:00 UTC)
-- Pré-requisito: pg_cron e pg_net já habilitados no projeto Supabase
-- =============================================

-- Remover job anterior se existir (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-reports') THEN
    PERFORM cron.unschedule('monthly-reports');
  END IF;
END $$;

-- Criar cron job: todo dia 1 do mês às 11:00 UTC (08:00 BRT)
SELECT cron.schedule(
  'monthly-reports',
  '0 11 1 * *',
  $$
  SELECT net.http_post(
    url     := 'https://fenfgjqlsqzvxloeavdc.supabase.co/functions/v1/send-monthly-reports',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'x-cron-secret',  current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);
