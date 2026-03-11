-- Compliance Calendar: agenda de obrigações regulatórias

CREATE TABLE IF NOT EXISTS public.compliance_obrigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,  -- NULL = global/seed
  titulo TEXT NOT NULL,
  descricao TEXT,
  lei_referencia TEXT,        -- "Lei 13.709/2018 (LGPD)"
  orgao_regulador TEXT,       -- "ANPD", "CVM", "BACEN", "CGU"
  periodicidade TEXT NOT NULL CHECK (periodicidade IN ('unica','mensal','trimestral','semestral','anual')),
  mes_vencimento INT CHECK (mes_vencimento BETWEEN 1 AND 12),
  dia_vencimento INT CHECK (dia_vencimento BETWEEN 1 AND 31),
  proxima_data DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','em_andamento','concluida','atrasada')),
  responsavel_id UUID REFERENCES auth.users(id),
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_obrig_org ON public.compliance_obrigacoes(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_compliance_obrig_data ON public.compliance_obrigacoes(proxima_data);
CREATE INDEX IF NOT EXISTS idx_compliance_obrig_status ON public.compliance_obrigacoes(status);

ALTER TABLE public.compliance_obrigacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_obrig_select" ON public.compliance_obrigacoes FOR SELECT USING (
  organizacao_id IS NULL   -- obrigações globais visíveis para todos autenticados
  OR (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "compliance_obrig_write" ON public.compliance_obrigacoes
  FOR INSERT WITH CHECK (
    (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
  );
CREATE POLICY "compliance_obrig_update" ON public.compliance_obrigacoes
  FOR UPDATE USING (
    (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
  );
CREATE POLICY "compliance_obrig_delete" ON public.compliance_obrigacoes
  FOR DELETE USING (
    (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
  );

CREATE TRIGGER set_compliance_obrig_updated_at
  BEFORE UPDATE ON public.compliance_obrigacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: ~30 obrigações regulatórias padrão para PMEs brasileiras
-- (organizacao_id = NULL = visíveis para todos)
INSERT INTO public.compliance_obrigacoes
  (titulo, descricao, lei_referencia, orgao_regulador, periodicidade, mes_vencimento, dia_vencimento, proxima_data, status)
VALUES
  -- LGPD
  ('Revisão do Programa de LGPD', 'Revisão anual das políticas, controles e inventário de dados', 'Lei 13.709/2018', 'ANPD', 'anual', 1, 31, '2027-01-31', 'pendente'),
  ('Relatório de Impacto à Proteção de Dados (RIPD)', 'Elaboração ou atualização do RIPD para operações de alto risco', 'Lei 13.709/2018 Art. 38', 'ANPD', 'anual', 6, 30, '2026-06-30', 'pendente'),
  ('Renovação de Contratos com Operadores', 'Revisão de cláusulas de proteção de dados em contratos com terceiros', 'Lei 13.709/2018 Art. 39', 'ANPD', 'anual', 3, 31, '2027-03-31', 'pendente'),
  -- Lei Anticorrupção
  ('Relatório Anual de Integridade', 'Elaboração do relatório de conformidade com o programa de integridade', 'Lei 12.846/2013', 'CGU', 'anual', 12, 31, '2026-12-31', 'pendente'),
  ('Treinamento Anticorrupção', 'Treinamento anual de colaboradores sobre código de ética e anticorrupção', 'Lei 12.846/2013', 'CGU', 'anual', 9, 30, '2026-09-30', 'pendente'),
  -- Trabalhista / eSocial
  ('RAIS — Relação Anual de Informações Sociais', 'Declaração de vínculos empregatícios e remunerações do ano anterior', 'Lei 7.998/1990', 'MTE', 'anual', 3, 31, '2027-03-31', 'pendente'),
  ('DIRF — Declaração do Imposto Retido na Fonte', 'Entrega da DIRF com informações de rendimentos pagos no ano', 'IN RFB 2.187/2024', 'Receita Federal', 'anual', 2, 28, '2027-02-28', 'pendente'),
  ('eSocial — Eventos Periódicos', 'Entrega de eventos periódicos do eSocial (folha, férias, etc.)', 'Decreto 8.373/2014', 'Receita Federal', 'mensal', null, 7, '2026-04-07', 'pendente'),
  ('FGTS — Guia de Recolhimento', 'Recolhimento mensal do FGTS dos empregados', 'Lei 8.036/1990', 'CEF', 'mensal', null, 7, '2026-04-07', 'pendente'),
  -- Fiscal
  ('SPED ECD — Escrituração Contábil Digital', 'Entrega da Escrituração Contábil Digital do exercício anterior', 'IN RFB 1.420/2013', 'Receita Federal', 'anual', 5, 31, '2027-05-31', 'pendente'),
  ('SPED ECF — Escrituração Contábil Fiscal', 'Entrega da ECF (substitui DIPJ)', 'IN RFB 1.422/2013', 'Receita Federal', 'anual', 7, 31, '2026-07-31', 'pendente'),
  ('DEFIS — Simples Nacional', 'Declaração de informações socioeconômicas e fiscais (Simples)', 'LC 123/2006', 'Receita Federal', 'anual', 3, 31, '2027-03-31', 'pendente'),
  ('DAS — Documento de Arrecadação do Simples', 'Pagamento mensal do DAS (Simples Nacional)', 'LC 123/2006', 'Receita Federal', 'mensal', null, 20, '2026-04-20', 'pendente'),
  -- Segurança e Saúde do Trabalho
  ('PCMSO — Programa de Controle Médico', 'Realização de exames médicos periódicos dos colaboradores', 'NR-7', 'MTE', 'anual', 1, 31, '2027-01-31', 'pendente'),
  ('PPRA/PGR — Gestão de Riscos', 'Revisão anual do Programa de Gerenciamento de Riscos', 'NR-9 / NR-1', 'MTE', 'anual', 1, 31, '2027-01-31', 'pendente'),
  ('CIPA — Eleição ou Designação', 'Eleição ou redesignação anual da CIPA (empresas com 20+ func.)', 'NR-5', 'MTE', 'anual', 10, 31, '2026-10-31', 'pendente'),
  -- Societário / Governança
  ('Assembleia Geral Ordinária (AGO)', 'Realização da AGO para aprovação de contas e destinação de resultados', 'Lei 6.404/1976 Art. 132', 'JUCESP', 'anual', 4, 30, '2026-04-30', 'pendente'),
  ('Renovação de Certidões Negativas', 'Renovação das certidões negativas de débitos (CND Federal, Estadual, Municipal, FGTS)', 'Diversas', 'Múltiplos', 'semestral', null, null, '2026-06-30', 'pendente'),
  -- Ambiental
  ('Licença de Operação — Renovação', 'Renovação da Licença de Operação junto ao órgão ambiental competente', 'Lei 6.938/1981', 'CETESB/IBAMA', 'anual', 12, 31, '2026-12-31', 'pendente'),
  ('Inventário Nacional de Resíduos Sólidos', 'Declaração de resíduos sólidos gerados (quando aplicável)', 'Lei 12.305/2010', 'IBAMA', 'anual', 3, 31, '2027-03-31', 'pendente'),
  -- Compliance Interno
  ('Avaliação do Canal de Denúncias', 'Análise de efetividade do canal e revisão de procedimentos', 'Boas práticas CGU', 'Interno', 'semestral', null, null, '2026-06-30', 'pendente'),
  ('Revisão do Código de Ética', 'Revisão e atualização do Código de Ética e Conduta', 'Boas práticas', 'Interno', 'anual', 1, 31, '2027-01-31', 'pendente'),
  ('Declaração de Conflito de Interesses', 'Coleta das declarações anuais de conflito de interesses dos colaboradores', 'Boas práticas', 'Interno', 'anual', 10, 31, '2026-10-31', 'pendente'),
  ('Treinamento de Compliance', 'Treinamento periódico de todos os colaboradores em compliance', 'Boas práticas', 'Interno', 'anual', 11, 30, '2026-11-30', 'pendente'),
  -- Proteção ao Consumidor
  ('Relatório de Atendimento SAC', 'Relatório semestral de atendimento e reclamações de consumidores', 'Decreto 11.034/2022', 'SENACON', 'semestral', null, null, '2026-06-30', 'pendente'),
  -- Saúde Suplementar (apenas para operadoras)
  ('ANS — Nota Técnica Atuarial', 'Entrega de notas técnicas atuariais (operadoras de planos de saúde)', 'RN ANS 209/2009', 'ANS', 'anual', 3, 31, '2027-03-31', 'pendente'),
  -- CVM (apenas para S.A. abertas)
  ('ITR — Informações Trimestrais', 'Entrega das informações trimestrais à CVM (S.A. abertas)', 'ICVM 480/2009', 'CVM', 'trimestral', null, null, '2026-05-15', 'pendente'),
  ('DFP — Demonstrações Financeiras Padronizadas', 'Entrega das DFP anuais à CVM', 'ICVM 480/2009', 'CVM', 'anual', 3, 31, '2027-03-31', 'pendente'),
  -- BACEN (apenas para IF)
  ('SCR — Cadastro de Clientes do SFN', 'Declaração mensal ao SCR (Instituições Financeiras)', 'Circular BACEN 3.567/2011', 'BACEN', 'mensal', null, 15, '2026-04-15', 'pendente'),
  ('COAF — Comunicação de Operações Suspeitas', 'Comunicação de operações suspeitas de lavagem de dinheiro', 'Lei 9.613/1998', 'COAF', 'mensal', null, 10, '2026-04-10', 'pendente')
ON CONFLICT DO NOTHING;
