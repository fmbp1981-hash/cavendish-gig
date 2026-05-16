-- Item 9 / Item 10: Tabela de Reuniões
-- Permite persistir reuniões localmente antes de sincronizar com Google Calendar.
-- Usado pelo Item 10 (resiliência do agendamento) e Item 9 (agenda no perfil do cliente).

CREATE TYPE public.tipo_reuniao AS ENUM (
  'kickoff',
  'acompanhamento',
  'workshop',
  'apresentacao',
  'outro'
);

CREATE TYPE public.status_reuniao AS ENUM (
  'agendada',
  'realizada',
  'cancelada',
  'reagendada'
);

CREATE TABLE public.reunioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,
  tipo public.tipo_reuniao NOT NULL DEFAULT 'acompanhamento',
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  fase TEXT,
  participantes JSONB DEFAULT '[]'::JSONB,
  link_video TEXT,
  local TEXT,
  google_event_id TEXT,
  status public.status_reuniao DEFAULT 'agendada',
  observacoes_pos TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reunioes_org ON public.reunioes(organizacao_id);
CREATE INDEX idx_reunioes_data ON public.reunioes(data_inicio);
CREATE INDEX idx_reunioes_status ON public.reunioes(status);

ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;

-- Cliente/membro vê reuniões da sua org
CREATE POLICY "Members view org reunioes"
ON public.reunioes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organizacao_id = reunioes.organizacao_id
      AND om.user_id = auth.uid()
  )
);

-- Consultor alocado vê
CREATE POLICY "Allocated consultors view reunioes"
ON public.reunioes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'consultor'
  )
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid()
      AND co.organizacao_id = reunioes.organizacao_id
  )
);

-- Consultor alocado pode criar/editar
CREATE POLICY "Allocated consultors manage reunioes"
ON public.reunioes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'consultor'
  )
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid()
      AND co.organizacao_id = reunioes.organizacao_id
  )
);

-- Admin acesso total
CREATE POLICY "Admins manage all reunioes"
ON public.reunioes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Trigger updated_at
CREATE TRIGGER set_reunioes_updated_at
  BEFORE UPDATE ON public.reunioes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
