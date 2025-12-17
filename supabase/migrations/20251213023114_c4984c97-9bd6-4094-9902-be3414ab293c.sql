-- Tabela de perguntas do diagnóstico (catálogo)
CREATE TABLE public.diagnostico_perguntas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dimensao TEXT NOT NULL, -- estrutura_societaria, governanca, compliance, gestao, planejamento
  ordem INTEGER NOT NULL DEFAULT 0,
  pergunta TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de diagnósticos realizados
CREATE TABLE public.diagnosticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nao_iniciado', -- nao_iniciado, em_andamento, concluido
  etapa_atual INTEGER NOT NULL DEFAULT 1, -- 1 a 5
  score_estrutura_societaria NUMERIC(5,2),
  score_governanca NUMERIC(5,2),
  score_compliance NUMERIC(5,2),
  score_gestao NUMERIC(5,2),
  score_planejamento NUMERIC(5,2),
  score_geral NUMERIC(5,2),
  nivel_maturidade TEXT, -- inexistente, inicial, basico, intermediario, avancado, excelencia
  pontos_fortes TEXT[],
  pontos_atencao TEXT[],
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de respostas individuais
CREATE TABLE public.diagnostico_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  pergunta_id UUID NOT NULL REFERENCES public.diagnostico_perguntas(id),
  resposta TEXT NOT NULL, -- sim, parcialmente, nao
  valor INTEGER NOT NULL, -- 2 = sim, 1 = parcialmente, 0 = nao
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_diagnosticos_projeto ON public.diagnosticos(projeto_id);
CREATE INDEX idx_diagnosticos_organizacao ON public.diagnosticos(organizacao_id);
CREATE INDEX idx_diagnostico_respostas_diagnostico ON public.diagnostico_respostas(diagnostico_id);

-- Enable RLS
ALTER TABLE public.diagnostico_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostico_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para perguntas (leitura pública)
CREATE POLICY "Everyone can view diagnostic questions" ON public.diagnostico_perguntas
  FOR SELECT USING (true);

-- Políticas para diagnósticos
CREATE POLICY "Members can view their organization diagnostics" ON public.diagnosticos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organizacao_id = diagnosticos.organizacao_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert diagnostics" ON public.diagnosticos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organizacao_id = diagnosticos.organizacao_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their diagnostics" ON public.diagnosticos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organizacao_id = diagnosticos.organizacao_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Consultors can view all diagnostics" ON public.diagnosticos
  FOR SELECT USING (
    has_role(auth.uid(), 'consultor') OR has_role(auth.uid(), 'admin')
  );

-- Políticas para respostas
CREATE POLICY "Members can manage their diagnostic answers" ON public.diagnostico_respostas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.diagnosticos d
      JOIN public.organization_members om ON om.organizacao_id = d.organizacao_id
      WHERE d.id = diagnostico_respostas.diagnostico_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Consultors can view all answers" ON public.diagnostico_respostas
  FOR SELECT USING (
    has_role(auth.uid(), 'consultor') OR has_role(auth.uid(), 'admin')
  );

-- Trigger para updated_at
CREATE TRIGGER update_diagnosticos_updated_at
  BEFORE UPDATE ON public.diagnosticos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed das perguntas do diagnóstico (10 perguntas por dimensão = 50 total)
INSERT INTO public.diagnostico_perguntas (dimensao, ordem, pergunta, descricao) VALUES
-- ESTRUTURA SOCIETÁRIA (10 perguntas)
('estrutura_societaria', 1, 'A empresa possui contrato social atualizado?', 'Documento deve estar registrado na Junta Comercial'),
('estrutura_societaria', 2, 'Existe acordo de sócios formalizado?', 'Documento que regula relação entre sócios'),
('estrutura_societaria', 3, 'O organograma da empresa está definido e documentado?', 'Estrutura hierárquica clara'),
('estrutura_societaria', 4, 'As responsabilidades de cada cargo estão formalizadas?', 'Descrições de cargo documentadas'),
('estrutura_societaria', 5, 'Existe separação clara entre patrimônio pessoal e empresarial?', 'Contas e bens separados'),
('estrutura_societaria', 6, 'A empresa possui procuradores com poderes definidos?', 'Procurações documentadas'),
('estrutura_societaria', 7, 'Há registro atualizado de todos os sócios/acionistas?', 'Livro de sócios atualizado'),
('estrutura_societaria', 8, 'A empresa possui CNPJ regularizado?', 'Cadastro ativo e sem pendências'),
('estrutura_societaria', 9, 'Existem alçadas de aprovação definidas por valor?', 'Limites de autorização'),
('estrutura_societaria', 10, 'A empresa mantém livros societários atualizados?', 'Atas de reuniões registradas'),

-- GOVERNANÇA (10 perguntas)
('governanca', 1, 'A empresa possui conselho de administração ou consultivo?', 'Órgão de governança formal'),
('governanca', 2, 'Existem reuniões periódicas de sócios documentadas?', 'Atas de reuniões'),
('governanca', 3, 'Há processo formal de tomada de decisões estratégicas?', 'Metodologia definida'),
('governanca', 4, 'A empresa possui política de distribuição de lucros?', 'Critérios definidos'),
('governanca', 5, 'Existe planejamento de sucessão dos principais executivos?', 'Plano documentado'),
('governanca', 6, 'A empresa divulga informações financeiras aos sócios regularmente?', 'Relatórios periódicos'),
('governanca', 7, 'Há separação entre gestão operacional e estratégica?', 'Níveis distintos'),
('governanca', 8, 'Existem indicadores de desempenho (KPIs) monitorados?', 'Dashboard de gestão'),
('governanca', 9, 'A empresa possui auditoria externa ou interna?', 'Processo de auditoria'),
('governanca', 10, 'Há canal formal para sócios minoritários se manifestarem?', 'Mecanismo de participação'),

-- COMPLIANCE (10 perguntas)
('compliance', 1, 'A empresa possui código de ética e conduta?', 'Documento formalizado'),
('compliance', 2, 'Existe canal de denúncias implementado?', 'Canal anônimo disponível'),
('compliance', 3, 'Há política anticorrupção formalizada?', 'Documento e treinamento'),
('compliance', 4, 'A empresa realiza due diligence de terceiros?', 'Análise de fornecedores/parceiros'),
('compliance', 5, 'Existem treinamentos de compliance para funcionários?', 'Programa de capacitação'),
('compliance', 6, 'A empresa possui política de conflito de interesses?', 'Regras definidas'),
('compliance', 7, 'Há controle de brindes e hospitalidades?', 'Política e registro'),
('compliance', 8, 'Existe programa de conformidade documentado?', 'Manual de compliance'),
('compliance', 9, 'A empresa monitora riscos regulatórios do setor?', 'Gestão de riscos'),
('compliance', 10, 'Há responsável designado para compliance?', 'Compliance Officer'),

-- GESTÃO (10 perguntas)
('gestao', 1, 'A empresa possui planejamento orçamentário anual?', 'Orçamento formalizado'),
('gestao', 2, 'Existem controles financeiros adequados?', 'Fluxo de caixa, contas a pagar/receber'),
('gestao', 3, 'A empresa possui política de gestão de pessoas?', 'RH estruturado'),
('gestao', 4, 'Há processos operacionais documentados?', 'Manuais de procedimentos'),
('gestao', 5, 'A empresa realiza avaliação de desempenho dos funcionários?', 'Processo formal'),
('gestao', 6, 'Existem contratos formalizados com fornecedores?', 'Contratos escritos'),
('gestao', 7, 'A empresa possui política de segurança da informação?', 'Proteção de dados'),
('gestao', 8, 'Há backup e plano de contingência de TI?', 'Continuidade de negócios'),
('gestao', 9, 'A empresa possui certificações de qualidade?', 'ISO ou equivalentes'),
('gestao', 10, 'Existem reuniões gerenciais periódicas?', 'Alinhamento da equipe'),

-- PLANEJAMENTO (10 perguntas)
('planejamento', 1, 'A empresa possui missão, visão e valores definidos?', 'Identidade corporativa'),
('planejamento', 2, 'Existe planejamento estratégico formalizado?', 'Documento de 3-5 anos'),
('planejamento', 3, 'A empresa define metas anuais por área?', 'Objetivos mensuráveis'),
('planejamento', 4, 'Há análise SWOT ou similar documentada?', 'Diagnóstico estratégico'),
('planejamento', 5, 'A empresa monitora o mercado e concorrência?', 'Inteligência de mercado'),
('planejamento', 6, 'Existem projetos de inovação estruturados?', 'Pipeline de inovação'),
('planejamento', 7, 'A empresa possui plano de marketing definido?', 'Estratégia comercial'),
('planejamento', 8, 'Há plano de expansão ou crescimento?', 'Roadmap de crescimento'),
('planejamento', 9, 'A empresa realiza revisão estratégica periódica?', 'Ciclo de planejamento'),
('planejamento', 10, 'Existem cenários projetados para o negócio?', 'Análise de cenários');

-- Função para calcular scores do diagnóstico
CREATE OR REPLACE FUNCTION public.calcular_scores_diagnostico(p_diagnostico_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scores JSONB;
  v_score_estrutura NUMERIC;
  v_score_governanca NUMERIC;
  v_score_compliance NUMERIC;
  v_score_gestao NUMERIC;
  v_score_planejamento NUMERIC;
  v_score_geral NUMERIC;
  v_nivel TEXT;
  v_pontos_fortes TEXT[];
  v_pontos_atencao TEXT[];
BEGIN
  -- Calcular score por dimensão (valor máximo = 20 por dimensão, 10 perguntas x 2 pontos)
  SELECT COALESCE(SUM(dr.valor)::NUMERIC / 20 * 100, 0)
  INTO v_score_estrutura
  FROM diagnostico_respostas dr
  JOIN diagnostico_perguntas dp ON dp.id = dr.pergunta_id
  WHERE dr.diagnostico_id = p_diagnostico_id AND dp.dimensao = 'estrutura_societaria';

  SELECT COALESCE(SUM(dr.valor)::NUMERIC / 20 * 100, 0)
  INTO v_score_governanca
  FROM diagnostico_respostas dr
  JOIN diagnostico_perguntas dp ON dp.id = dr.pergunta_id
  WHERE dr.diagnostico_id = p_diagnostico_id AND dp.dimensao = 'governanca';

  SELECT COALESCE(SUM(dr.valor)::NUMERIC / 20 * 100, 0)
  INTO v_score_compliance
  FROM diagnostico_respostas dr
  JOIN diagnostico_perguntas dp ON dp.id = dr.pergunta_id
  WHERE dr.diagnostico_id = p_diagnostico_id AND dp.dimensao = 'compliance';

  SELECT COALESCE(SUM(dr.valor)::NUMERIC / 20 * 100, 0)
  INTO v_score_gestao
  FROM diagnostico_respostas dr
  JOIN diagnostico_perguntas dp ON dp.id = dr.pergunta_id
  WHERE dr.diagnostico_id = p_diagnostico_id AND dp.dimensao = 'gestao';

  SELECT COALESCE(SUM(dr.valor)::NUMERIC / 20 * 100, 0)
  INTO v_score_planejamento
  FROM diagnostico_respostas dr
  JOIN diagnostico_perguntas dp ON dp.id = dr.pergunta_id
  WHERE dr.diagnostico_id = p_diagnostico_id AND dp.dimensao = 'planejamento';

  -- Score geral (média das 5 dimensões)
  v_score_geral := (v_score_estrutura + v_score_governanca + v_score_compliance + v_score_gestao + v_score_planejamento) / 5;

  -- Determinar nível de maturidade
  v_nivel := CASE
    WHEN v_score_geral <= 20 THEN 'inexistente'
    WHEN v_score_geral <= 40 THEN 'inicial'
    WHEN v_score_geral <= 60 THEN 'basico'
    WHEN v_score_geral <= 75 THEN 'intermediario'
    WHEN v_score_geral <= 90 THEN 'avancado'
    ELSE 'excelencia'
  END;

  -- Identificar pontos fortes (acima de 70%)
  v_pontos_fortes := ARRAY[]::TEXT[];
  IF v_score_estrutura >= 70 THEN v_pontos_fortes := array_append(v_pontos_fortes, 'Estrutura Societária'); END IF;
  IF v_score_governanca >= 70 THEN v_pontos_fortes := array_append(v_pontos_fortes, 'Governança'); END IF;
  IF v_score_compliance >= 70 THEN v_pontos_fortes := array_append(v_pontos_fortes, 'Compliance'); END IF;
  IF v_score_gestao >= 70 THEN v_pontos_fortes := array_append(v_pontos_fortes, 'Gestão'); END IF;
  IF v_score_planejamento >= 70 THEN v_pontos_fortes := array_append(v_pontos_fortes, 'Planejamento'); END IF;

  -- Identificar pontos de atenção (abaixo de 50%)
  v_pontos_atencao := ARRAY[]::TEXT[];
  IF v_score_estrutura < 50 THEN v_pontos_atencao := array_append(v_pontos_atencao, 'Estrutura Societária'); END IF;
  IF v_score_governanca < 50 THEN v_pontos_atencao := array_append(v_pontos_atencao, 'Governança'); END IF;
  IF v_score_compliance < 50 THEN v_pontos_atencao := array_append(v_pontos_atencao, 'Compliance'); END IF;
  IF v_score_gestao < 50 THEN v_pontos_atencao := array_append(v_pontos_atencao, 'Gestão'); END IF;
  IF v_score_planejamento < 50 THEN v_pontos_atencao := array_append(v_pontos_atencao, 'Planejamento'); END IF;

  -- Atualizar o diagnóstico
  UPDATE diagnosticos SET
    score_estrutura_societaria = v_score_estrutura,
    score_governanca = v_score_governanca,
    score_compliance = v_score_compliance,
    score_gestao = v_score_gestao,
    score_planejamento = v_score_planejamento,
    score_geral = v_score_geral,
    nivel_maturidade = v_nivel,
    pontos_fortes = v_pontos_fortes,
    pontos_atencao = v_pontos_atencao,
    status = 'concluido',
    concluido_em = now()
  WHERE id = p_diagnostico_id;

  RETURN jsonb_build_object(
    'score_estrutura_societaria', v_score_estrutura,
    'score_governanca', v_score_governanca,
    'score_compliance', v_score_compliance,
    'score_gestao', v_score_gestao,
    'score_planejamento', v_score_planejamento,
    'score_geral', v_score_geral,
    'nivel_maturidade', v_nivel,
    'pontos_fortes', v_pontos_fortes,
    'pontos_atencao', v_pontos_atencao
  );
END;
$$;