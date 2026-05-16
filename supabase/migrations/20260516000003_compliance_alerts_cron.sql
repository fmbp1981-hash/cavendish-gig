-- pg_cron jobs para compliance-alerts edge function

-- Função wrapper genérica para compliance-alerts (lê CRON_SECRET de system_settings)
CREATE OR REPLACE FUNCTION public.trigger_compliance_alerts(p_tipo TEXT DEFAULT 'all')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
  v_url    TEXT;
BEGIN
  SELECT value INTO v_secret
  FROM public.system_settings
  WHERE key = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE WARNING 'cron_secret not found — skipping compliance-alerts';
    RETURN;
  END IF;

  v_url := 'https://fenfgjqlsqzvxloeavdc.supabase.co/functions/v1/compliance-alerts?tipo=' || p_tipo;

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'x-cron-secret',  v_secret
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- Alerta semanal: obrigações compliance vencendo em 7 dias (toda segunda, 08:00 BRT = 11:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compliance-alerts-obrigacoes') THEN
    PERFORM cron.unschedule('compliance-alerts-obrigacoes');
  END IF;
END $$;

SELECT cron.schedule(
  'compliance-alerts-obrigacoes',
  '0 11 * * 1',
  $$SELECT public.trigger_compliance_alerts('obrigacoes')$$
);

-- Alerta mensal: due diligence de fornecedores vencendo em 30 dias (dia 5, 09:00 BRT = 12:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compliance-alerts-fornecedores') THEN
    PERFORM cron.unschedule('compliance-alerts-fornecedores');
  END IF;
END $$;

SELECT cron.schedule(
  'compliance-alerts-fornecedores',
  '0 12 5 * *',
  $$SELECT public.trigger_compliance_alerts('fornecedores')$$
);

-- Alerta anual: declaração de conflito de interesse (1° outubro, 08:00 BRT = 11:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compliance-alerts-conflitos') THEN
    PERFORM cron.unschedule('compliance-alerts-conflitos');
  END IF;
END $$;

SELECT cron.schedule(
  'compliance-alerts-conflitos',
  '0 11 1 10 *',
  $$SELECT public.trigger_compliance_alerts('conflitos')$$
);
