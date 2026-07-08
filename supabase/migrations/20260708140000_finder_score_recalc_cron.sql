-- Módulo Finder: recálculo diário do ai_score dos leads ativos.
--
-- Regra (decisão de produto, ver docs/FINDER_SPEC.md): pontuação 0-100, só para leads que não
-- estão em status='convertido'/'perdido', combinando:
--   +8 pontos por etapa avançada no funil, até 40
--   +10 pontos por resposta do próprio lead na conversa, até 30
--   +5 pontos cada por email/website/cnpj preenchidos, até 15
--   -2 pontos por dia de inatividade além de uma folga de 3 dias, até -20
--
-- Só recalcula leads sem contato nas últimas 24h — não sobrescreve um score que o agente de IA
-- acabou de calcular durante uma conversa ativa (leitura real da conversa via `atualizar_lead`,
-- mais precisa que esta heurística estrutural).
--
-- Função SQL pura (não uma Edge Function): é uma agregação determinística sobre o próprio banco,
-- sem chamada externa nenhuma — evita o round-trip HTTP e o cold start do Deno que os outros
-- crons do módulo (que dependem de APIs externas) precisam.

CREATE OR REPLACE FUNCTION public.recalcular_ai_score_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prospeccao_leads AS l
  SET ai_score = LEAST(100, GREATEST(0,
      LEAST(40, COALESCE(etapa.posicao - 1, 0) * 8)
    + LEAST(30, COALESCE(respostas.total, 0) * 10)
    + (CASE WHEN base.email IS NOT NULL THEN 5 ELSE 0 END)
    + (CASE WHEN base.website IS NOT NULL THEN 5 ELSE 0 END)
    + (CASE WHEN base.cnpj IS NOT NULL THEN 5 ELSE 0 END)
    - LEAST(20, GREATEST(0, COALESCE(EXTRACT(DAY FROM now() - base.ultimo_contato_em)::int, 0) - 3) * 2)
  ))
  -- updated_at é mantido automaticamente pelo trigger set_prospeccao_leads_updated_at (Fase 1)
  FROM public.prospeccao_leads AS base
  LEFT JOIN public.prospeccao_funil_etapas AS etapa ON etapa.id = base.funil_etapa_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS total
    FROM public.prospeccao_conversas c
    WHERE c.lead_id = base.id AND c.role = 'user'
  ) AS respostas ON true
  WHERE l.id = base.id
    AND base.status NOT IN ('convertido', 'perdido')
    AND (base.ultimo_contato_em IS NULL OR base.ultimo_contato_em < now() - interval '24 hours');
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prospeccao-score-recalc') THEN
    PERFORM cron.unschedule('prospeccao-score-recalc');
  END IF;
END $$;

-- Diário, 06:00 BRT = 09:00 UTC (mesma convenção de fuso dos outros crons do projeto)
SELECT cron.schedule(
  'prospeccao-score-recalc',
  '0 9 * * *',
  $$SELECT public.recalcular_ai_score_leads()$$
);
