-- Item 9 — Lembrete automático de reunião 24h antes por e-mail

-- Wrapper function that calls the reuniao-lembrete edge function
CREATE OR REPLACE FUNCTION public.trigger_reuniao_lembrete()
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
    RAISE WARNING 'cron_secret not found — skipping reuniao-lembrete';
    RETURN;
  END IF;

  v_url := 'https://fenfgjqlsqzvxloeavdc.supabase.co/functions/v1/reuniao-lembrete';

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

-- Track which reminders have been sent to avoid duplicates
CREATE TABLE IF NOT EXISTS public.reuniao_lembretes_enviados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id        UUID NOT NULL REFERENCES public.reunioes(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL DEFAULT '24h',
  enviado_em        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (reuniao_id, tipo)
);

ALTER TABLE public.reuniao_lembretes_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lembretes enviados"
ON public.reuniao_lembretes_enviados FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Cron: run every hour to catch meetings starting in ~24h (23:30 to 24:30 window)
-- Every hour at :00 (UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reuniao-lembrete-24h') THEN
    PERFORM cron.unschedule('reuniao-lembrete-24h');
  END IF;
END $$;

SELECT cron.schedule(
  'reuniao-lembrete-24h',
  '0 * * * *',
  $$SELECT public.trigger_reuniao_lembrete()$$
);
