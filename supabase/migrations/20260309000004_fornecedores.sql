-- Third-Party Risk: fornecedores + due diligence aprimorado

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT,
  categoria TEXT CHECK (categoria IN ('ti','servicos','logistica','financeiro','saude','outro')),
  nivel_criticidade TEXT NOT NULL DEFAULT 'medio'
    CHECK (nivel_criticidade IN ('baixo','medio','alto','critico')),
  website TEXT,
  contato_nome TEXT,
  contato_email TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','bloqueado')),
  score_risco_atual INT CHECK (score_risco_atual BETWEEN 0 AND 100),
  proxima_avaliacao DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_org ON public.fornecedores(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON public.fornecedores(status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_criticidade ON public.fornecedores(nivel_criticidade);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fornecedores_rw" ON public.fornecedores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','consultor'))
);

CREATE TRIGGER set_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Perguntas padrão de due diligence
CREATE TABLE IF NOT EXISTS public.due_diligence_perguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  peso INT NOT NULL DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.due_diligence_perguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dd_perguntas_select" ON public.due_diligence_perguntas FOR SELECT USING (true);
CREATE POLICY "dd_perguntas_admin" ON public.due_diligence_perguntas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Adicionar FK de fornecedor à due_diligence existente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'due_diligence' AND column_name = 'fornecedor_id'
  ) THEN
    ALTER TABLE public.due_diligence
      ADD COLUMN fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE CASCADE,
      ADD COLUMN respostas JSONB,
      ADD COLUMN score_calculado INT CHECK (score_calculado BETWEEN 0 AND 100);
  END IF;
END $$;

-- Seed: 20 perguntas padrão de due diligence
INSERT INTO public.due_diligence_perguntas (categoria, pergunta, peso) VALUES
  -- LGPD / Privacidade (peso 2)
  ('lgpd', 'A empresa possui Política de Privacidade e Proteção de Dados formalmente documentada?', 2),
  ('lgpd', 'Há um encarregado de proteção de dados (DPO) designado?', 2),
  ('lgpd', 'A empresa realiza treinamentos periódicos sobre LGPD para colaboradores?', 1),
  ('lgpd', 'Existem mecanismos de resposta a incidentes de segurança de dados?', 2),
  -- Anticorrupção / Ética (peso 3)
  ('anticorrupcao', 'A empresa possui Código de Ética e Conduta formalmente publicado?', 3),
  ('anticorrupcao', 'Há canal de denúncias disponível para colaboradores e terceiros?', 2),
  ('anticorrupcao', 'A empresa realiza due diligence de terceiros antes de contratar fornecedores?', 3),
  ('anticorrupcao', 'A empresa está livre de registros no CEIS, CNEP ou CEPIM?', 3),
  -- Financeiro (peso 2)
  ('financeiro', 'A empresa possui demonstrações financeiras auditadas nos últimos 2 anos?', 2),
  ('financeiro', 'Não há processos de falência, recuperação judicial ou execuções fiscais relevantes?', 2),
  ('financeiro', 'A empresa possui seguro de responsabilidade civil?', 1),
  -- Segurança da Informação (peso 2)
  ('seguranca', 'A empresa possui política de segurança da informação documentada?', 2),
  ('seguranca', 'Há controle de acesso lógico e físico às informações sensíveis?', 2),
  ('seguranca', 'A empresa realiza backups periódicos e testes de restauração?', 1),
  -- Ambiental / Social (peso 1)
  ('esg', 'A empresa possui licenças ambientais vigentes (quando aplicável)?', 1),
  ('esg', 'Não há registros de autuações graves por trabalho análogo à escravidão ou infantil?', 3),
  ('esg', 'A empresa possui política de diversidade e inclusão?', 1),
  -- Operacional (peso 1)
  ('operacional', 'A empresa possui certificações de qualidade relevantes para o setor (ISO, etc.)?', 1),
  ('operacional', 'Há plano de continuidade de negócios (BCP/DRP) documentado?', 1),
  ('operacional', 'A empresa possui referências de pelo menos 3 clientes ativos de porte similar?', 1)
ON CONFLICT DO NOTHING;
