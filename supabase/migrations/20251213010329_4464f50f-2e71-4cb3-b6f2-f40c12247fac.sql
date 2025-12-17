
-- =============================================
-- 1. Tabela de Denúncias (Canal Anônimo)
-- =============================================
CREATE TABLE public.denuncias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT NOT NULL UNIQUE DEFAULT 'DEN-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_ocorrido DATE,
  envolvidos TEXT,
  status TEXT NOT NULL DEFAULT 'nova',
  observacoes_internas TEXT,
  analisado_por UUID,
  analisado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: INSERT anônimo permitido, SELECT apenas admin/consultor
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert complaints anonymously"
ON public.denuncias
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins and consultants can view complaints"
ON public.denuncias
FOR SELECT
USING (has_role(auth.uid(), 'consultor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins and consultants can update complaints"
ON public.denuncias
FOR UPDATE
USING (has_role(auth.uid(), 'consultor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2. Tabela de Atribuição de Consultores
-- =============================================
CREATE TABLE public.consultor_organizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(consultor_id, organizacao_id)
);

ALTER TABLE public.consultor_organizacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage consultant assignments"
ON public.consultor_organizacoes
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Consultants can view their assignments"
ON public.consultor_organizacoes
FOR SELECT
USING (auth.uid() = consultor_id);

-- =============================================
-- 3. Tabela de Tarefas Internas
-- =============================================
CREATE TABLE public.tarefas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  prioridade TEXT NOT NULL DEFAULT 'media',
  responsavel_id UUID REFERENCES public.profiles(id),
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  prazo DATE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all tasks"
ON public.tarefas
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Consultants can manage tasks for their organizations"
ON public.tarefas
FOR ALL
USING (
  has_role(auth.uid(), 'consultor'::app_role) AND (
    EXISTS (
      SELECT 1 FROM public.consultor_organizacoes co
      WHERE co.consultor_id = auth.uid() AND co.organizacao_id = tarefas.organizacao_id
    )
    OR NOT EXISTS (SELECT 1 FROM public.consultor_organizacoes) -- Fallback se não houver atribuições
  )
);

CREATE POLICY "Members can view their organization tasks"
ON public.tarefas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.organizacao_id = tarefas.organizacao_id
  )
);

CREATE TRIGGER update_tarefas_updated_at
BEFORE UPDATE ON public.tarefas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 4. Tabela de Histórico de Gerações IA
-- =============================================
CREATE TABLE public.ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_text TEXT,
  modelo TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  user_id UUID REFERENCES public.profiles(id),
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL,
  tokens_used INTEGER,
  duracao_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all AI generations"
ON public.ai_generations
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Consultants can manage AI generations"
ON public.ai_generations
FOR ALL
USING (has_role(auth.uid(), 'consultor'::app_role));

CREATE POLICY "Users can view their own AI generations"
ON public.ai_generations
FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- 5. Função RPC para Onboarding de Cliente
-- =============================================
CREATE OR REPLACE FUNCTION public.create_client_onboarding(
  p_nome_organizacao TEXT,
  p_cnpj TEXT,
  p_tipo_projeto tipo_projeto,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_projeto_id UUID;
BEGIN
  -- Criar organização
  INSERT INTO public.organizacoes (nome, cnpj)
  VALUES (p_nome_organizacao, p_cnpj)
  RETURNING id INTO v_org_id;

  -- Adicionar usuário como membro
  INSERT INTO public.organization_members (organizacao_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'cliente');

  -- Criar projeto (trigger criará documentos automaticamente)
  INSERT INTO public.projetos (organizacao_id, nome, tipo)
  VALUES (v_org_id, 'Projeto ' || p_nome_organizacao, p_tipo_projeto)
  RETURNING id INTO v_projeto_id;

  RETURN jsonb_build_object(
    'success', true,
    'organizacao_id', v_org_id,
    'projeto_id', v_projeto_id
  );
END;
$$;

-- Índices para performance
CREATE INDEX idx_denuncias_status ON public.denuncias(status);
CREATE INDEX idx_denuncias_created_at ON public.denuncias(created_at DESC);
CREATE INDEX idx_consultor_organizacoes_consultor ON public.consultor_organizacoes(consultor_id);
CREATE INDEX idx_consultor_organizacoes_org ON public.consultor_organizacoes(organizacao_id);
CREATE INDEX idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX idx_tarefas_projeto ON public.tarefas(projeto_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status);
CREATE INDEX idx_ai_generations_tipo ON public.ai_generations(tipo);
CREATE INDEX idx_ai_generations_user ON public.ai_generations(user_id);
