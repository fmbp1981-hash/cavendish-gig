-- =============================================
-- Migration: Sistema de Envio Automático de Relatórios Mensais
-- Descrição: Rastreia envios de relatórios por email com histórico completo
-- =============================================

-- 1. Criar ENUM para status de envio
DO $$ BEGIN
  CREATE TYPE relatorio_envio_status AS ENUM ('pending', 'sending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de histórico de envios
CREATE TABLE IF NOT EXISTS public.relatorio_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referências
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,

  -- Período do relatório
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  mes_referencia INTEGER NOT NULL, -- 1-12
  ano_referencia INTEGER NOT NULL,

  -- Informações de envio
  status relatorio_envio_status NOT NULL DEFAULT 'pending',
  email_destinatario TEXT NOT NULL,
  email_copia TEXT[], -- Array de emails em cópia
  assunto TEXT NOT NULL,

  -- Conteúdo do relatório
  relatorio_html TEXT, -- HTML do relatório gerado
  relatorio_pdf_url TEXT, -- URL do PDF gerado (se houver)

  -- Métricas incluídas no relatório
  total_documentos INTEGER DEFAULT 0,
  documentos_aprovados INTEGER DEFAULT 0,
  documentos_pendentes INTEGER DEFAULT 0,
  total_tarefas INTEGER DEFAULT 0,
  tarefas_concluidas INTEGER DEFAULT 0,
  progresso_projeto DECIMAL(5,2), -- Porcentagem 0-100

  -- Rastreamento de envio
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  ultimo_erro TEXT,
  enviado_em TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorio_envios_organizacao
ON public.relatorio_envios(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_relatorio_envios_status
ON public.relatorio_envios(status);

CREATE INDEX IF NOT EXISTS idx_relatorio_envios_periodo
ON public.relatorio_envios(ano_referencia, mes_referencia);

CREATE INDEX IF NOT EXISTS idx_relatorio_envios_data_envio
ON public.relatorio_envios(enviado_em DESC)
WHERE enviado_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_relatorio_envios_pendentes
ON public.relatorio_envios(created_at)
WHERE status IN ('pending', 'failed');

-- 4. Função para gerar próximo relatório mensal
CREATE OR REPLACE FUNCTION schedule_monthly_reports()
RETURNS TABLE(
  organizacao_id UUID,
  organizacao_nome TEXT,
  email TEXT,
  mes INTEGER,
  ano INTEGER
) AS $$
BEGIN
  -- Busca todas organizações ativas que devem receber relatórios
  RETURN QUERY
  SELECT
    o.id,
    o.nome,
    COALESCE(o.email_principal, p.email) as email,
    EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER,
    EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER
  FROM public.organizacoes o
  LEFT JOIN public.profiles p ON p.organizacao_id = o.id AND p.role = 'cliente'
  WHERE o.ativo = true
    AND (o.email_principal IS NOT NULL OR p.email IS NOT NULL)
    -- Evita duplicar se já foi agendado este mês
    AND NOT EXISTS (
      SELECT 1 FROM public.relatorio_envios re
      WHERE re.organizacao_id = o.id
        AND re.mes_referencia = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
        AND re.ano_referencia = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Função para criar agendamento de relatório
CREATE OR REPLACE FUNCTION create_relatorio_agendamento(
  p_organizacao_id UUID,
  p_email TEXT,
  p_mes INTEGER,
  p_ano INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_periodo_inicio DATE;
  v_periodo_fim DATE;
  v_relatorio_id UUID;
BEGIN
  -- Calcular período
  v_periodo_inicio := DATE_TRUNC('month', MAKE_DATE(p_ano, p_mes, 1));
  v_periodo_fim := (DATE_TRUNC('month', MAKE_DATE(p_ano, p_mes, 1)) + INTERVAL '1 month - 1 day')::DATE;

  -- Criar registro de envio
  INSERT INTO public.relatorio_envios (
    organizacao_id,
    periodo_inicio,
    periodo_fim,
    mes_referencia,
    ano_referencia,
    email_destinatario,
    assunto,
    status
  ) VALUES (
    p_organizacao_id,
    v_periodo_inicio,
    v_periodo_fim,
    p_mes,
    p_ano,
    p_email,
    'Relatório Mensal - ' || TO_CHAR(v_periodo_inicio, 'Month/YYYY'),
    'pending'
  )
  RETURNING id INTO v_relatorio_id;

  RETURN v_relatorio_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para marcar relatório como enviado
CREATE OR REPLACE FUNCTION mark_relatorio_enviado(
  p_relatorio_id UUID,
  p_pdf_url TEXT DEFAULT NULL,
  p_metricas JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.relatorio_envios
  SET
    status = 'sent',
    enviado_em = now(),
    relatorio_pdf_url = COALESCE(p_pdf_url, relatorio_pdf_url),
    total_documentos = COALESCE((p_metricas->>'total_documentos')::INTEGER, total_documentos),
    documentos_aprovados = COALESCE((p_metricas->>'documentos_aprovados')::INTEGER, documentos_aprovados),
    documentos_pendentes = COALESCE((p_metricas->>'documentos_pendentes')::INTEGER, documentos_pendentes),
    total_tarefas = COALESCE((p_metricas->>'total_tarefas')::INTEGER, total_tarefas),
    tarefas_concluidas = COALESCE((p_metricas->>'tarefas_concluidas')::INTEGER, tarefas_concluidas),
    progresso_projeto = COALESCE((p_metricas->>'progresso_projeto')::DECIMAL, progresso_projeto),
    updated_at = now()
  WHERE id = p_relatorio_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para marcar relatório como falho
CREATE OR REPLACE FUNCTION mark_relatorio_failed(
  p_relatorio_id UUID,
  p_erro TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tentativas INTEGER;
  v_max_tentativas INTEGER;
BEGIN
  -- Incrementar tentativas e salvar erro
  UPDATE public.relatorio_envios
  SET
    tentativas = tentativas + 1,
    ultimo_erro = p_erro,
    updated_at = now()
  WHERE id = p_relatorio_id
  RETURNING tentativas, max_tentativas INTO v_tentativas, v_max_tentativas;

  -- Se atingiu máximo de tentativas, marcar como falho definitivamente
  IF v_tentativas >= v_max_tentativas THEN
    UPDATE public.relatorio_envios
    SET status = 'failed'
    WHERE id = p_relatorio_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_relatorio_envios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_relatorio_envios_updated_at ON public.relatorio_envios;
CREATE TRIGGER trigger_update_relatorio_envios_updated_at
  BEFORE UPDATE ON public.relatorio_envios
  FOR EACH ROW
  EXECUTE FUNCTION update_relatorio_envios_updated_at();

-- 9. RLS Policies
ALTER TABLE public.relatorio_envios ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Consultor vê todos os envios
DROP POLICY IF EXISTS "Admin e Consultor podem ver todos os envios" ON public.relatorio_envios;
CREATE POLICY "Admin e Consultor podem ver todos os envios"
ON public.relatorio_envios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'consultor')
  )
);

-- Policy: Cliente vê envios da sua organização
DROP POLICY IF EXISTS "Cliente vê envios da sua organização" ON public.relatorio_envios;
CREATE POLICY "Cliente vê envios da sua organização"
ON public.relatorio_envios
FOR SELECT
USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Sistema pode inserir (service_role)
-- Não precisa de policy pois Edge Function usa service_role

-- 10. View para relatórios recentes
CREATE OR REPLACE VIEW public.relatorio_envios_recentes AS
SELECT
  re.id,
  re.organizacao_id,
  o.nome as organizacao_nome,
  re.mes_referencia,
  re.ano_referencia,
  re.status,
  re.email_destinatario,
  re.enviado_em,
  re.tentativas,
  re.ultimo_erro,
  re.progresso_projeto,
  re.created_at
FROM public.relatorio_envios re
LEFT JOIN public.organizacoes o ON o.id = re.organizacao_id
ORDER BY re.created_at DESC;

GRANT SELECT ON public.relatorio_envios_recentes TO authenticated;

-- 11. Comentários para documentação
COMMENT ON TABLE public.relatorio_envios IS 'Histórico de envios automáticos de relatórios mensais por email';
COMMENT ON COLUMN public.relatorio_envios.status IS 'Status do envio: pending, sending, sent, failed';
COMMENT ON COLUMN public.relatorio_envios.tentativas IS 'Número de tentativas de envio realizadas';
COMMENT ON COLUMN public.relatorio_envios.relatorio_html IS 'HTML do relatório gerado para envio por email';
COMMENT ON FUNCTION schedule_monthly_reports IS 'Retorna lista de organizações que devem receber relatório mensal';
COMMENT ON FUNCTION mark_relatorio_enviado IS 'Marca relatório como enviado com sucesso';
COMMENT ON FUNCTION mark_relatorio_failed IS 'Marca relatório como falho e incrementa tentativas';

-- 12. ANALYZE
ANALYZE public.relatorio_envios;

-- Success message
SELECT '✅ Sistema de envio automático de relatórios criado com sucesso!' AS status;
