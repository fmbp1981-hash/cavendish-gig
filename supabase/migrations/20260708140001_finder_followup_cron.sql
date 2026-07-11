-- Módulo Finder: follow-up automático — processa prospeccao_fila_followup periodicamente.
-- Mesmo padrão de trigger_compliance_alerts (wrapper SECURITY DEFINER lendo o segredo de
-- system_settings, chamando a Edge Function via net.http_post).

CREATE OR REPLACE FUNCTION public.trigger_prospeccao_followup()
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
    RAISE WARNING 'cron_secret not found — skipping prospeccao-followup-cron';
    RETURN;
  END IF;

  v_url := 'https://fenfgjqlsqzvxloeavdc.supabase.co/functions/v1/prospeccao-followup-cron';

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', v_secret
    ),
    body    := '{}'::jsonb
  );
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prospeccao-followup') THEN
    PERFORM cron.unschedule('prospeccao-followup');
  END IF;
END $$;

-- A cada 30 minutos — a fila só dispara mensagens cujo enviar_em já passou, então rodar com essa
-- frequência mantém o atraso máximo de envio baixo sem gerar carga desnecessária.
SELECT cron.schedule(
  'prospeccao-followup',
  '*/30 * * * *',
  $$SELECT public.trigger_prospeccao_followup()$$
);
