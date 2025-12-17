-- Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente', 'parceiro');
CREATE TYPE public.fase_projeto AS ENUM ('diagnostico', 'implementacao', 'recorrencia');
CREATE TYPE public.tipo_projeto AS ENUM ('gig_completo', 'gig_modular', 'consultoria_pontual');
CREATE TYPE public.status_documento AS ENUM ('pendente', 'enviado', 'em_analise', 'aprovado', 'rejeitado');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Organizacoes table
CREATE TABLE public.organizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  tenant_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;

-- Projetos table
CREATE TABLE public.projetos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo public.tipo_projeto NOT NULL DEFAULT 'gig_completo',
  fase_atual public.fase_projeto NOT NULL DEFAULT 'diagnostico',
  data_inicio DATE,
  data_fim_prevista DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- Documentos catalog table
CREATE TABLE public.documentos_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  fase public.fase_projeto NOT NULL,
  tipo_projeto public.tipo_projeto NOT NULL DEFAULT 'gig_completo',
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  template_url TEXT,
  formatos_aceitos TEXT[] DEFAULT ARRAY['pdf', 'docx', 'xlsx', 'png', 'jpg'],
  tamanho_maximo_mb INTEGER DEFAULT 50,
  criterios_aceitacao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view document catalog" ON public.documentos_catalogo
  FOR SELECT USING (true);

-- Documentos requeridos table
CREATE TABLE public.documentos_requeridos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  catalogo_id UUID NOT NULL REFERENCES public.documentos_catalogo(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  fase public.fase_projeto NOT NULL,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  template_url TEXT,
  formatos_aceitos TEXT[] DEFAULT ARRAY['pdf', 'docx', 'xlsx', 'png', 'jpg'],
  tamanho_maximo_mb INTEGER DEFAULT 50,
  criterios_aceitacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(projeto_id, catalogo_id)
);

ALTER TABLE public.documentos_requeridos ENABLE ROW LEVEL SECURITY;

-- Documentos table (uploaded files)
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  tamanho_bytes BIGINT,
  url TEXT,
  storage_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Documentos requeridos status table
CREATE TABLE public.documentos_requeridos_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_requerido_id UUID NOT NULL REFERENCES public.documentos_requeridos(id) ON DELETE CASCADE,
  documento_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  status public.status_documento NOT NULL DEFAULT 'pendente',
  observacao_rejeicao TEXT,
  analisado_por UUID REFERENCES auth.users(id),
  analisado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(documento_requerido_id)
);

ALTER TABLE public.documentos_requeridos_status ENABLE ROW LEVEL SECURITY;

-- Notificacoes table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notificacoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notificacoes
  FOR UPDATE USING (auth.uid() = user_id);

-- Organization members table for multi-tenant access
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organizacao_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization-based access
CREATE POLICY "Members can view their organizations" ON public.organizacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organizacao_id = organizacoes.id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view organization projects" ON public.projetos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organizacao_id = projetos.organizacao_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view required documents" ON public.documentos_requeridos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projetos
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE projetos.id = documentos_requeridos.projeto_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view documents" ON public.documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organizacao_id = documentos.organizacao_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert documents" ON public.documentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organizacao_id = documentos.organizacao_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view document status" ON public.documentos_requeridos_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update document status" ON public.documentos_requeridos_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert document status" ON public.documentos_requeridos_status
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view organization membership" ON public.organization_members
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );
  
  -- Default role as cliente
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizacoes_updated_at
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_requeridos_status_updated_at
  BEFORE UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default document catalog for gig_completo
INSERT INTO public.documentos_catalogo (nome, descricao, fase, tipo_projeto, obrigatorio, ordem) VALUES
-- Diagnostico phase
('Contrato Social', 'Documento constitutivo da empresa com todas as alterações', 'diagnostico', 'gig_completo', true, 1),
('Acordo de Sócios', 'Acordo entre sócios definindo direitos e obrigações', 'diagnostico', 'gig_completo', false, 2),
('Organograma', 'Estrutura organizacional da empresa', 'diagnostico', 'gig_completo', true, 3),
('Lista de Sócios/Acionistas', 'Relação completa de sócios ou acionistas com participações', 'diagnostico', 'gig_completo', true, 4),
('Último Balanço', 'Balanço patrimonial mais recente', 'diagnostico', 'gig_completo', true, 5),
('DRE', 'Demonstração de Resultado do Exercício', 'diagnostico', 'gig_completo', true, 6),
('Lista de Funcionários', 'Relação de colaboradores com cargos', 'diagnostico', 'gig_completo', true, 7),
('Políticas Existentes', 'Políticas e procedimentos já implementados', 'diagnostico', 'gig_completo', false, 8),
-- Implementacao phase
('Logo', 'Logotipo da empresa em alta resolução', 'implementacao', 'gig_completo', true, 1),
('Missão, Visão e Valores', 'Declarações de missão, visão e valores', 'implementacao', 'gig_completo', true, 2),
('Fotos Diretoria', 'Fotos profissionais dos diretores', 'implementacao', 'gig_completo', false, 3),
('Assinaturas Digitalizadas', 'Assinaturas dos responsáveis para documentos', 'implementacao', 'gig_completo', false, 4);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their organization documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');
-- Create security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin (specific email)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _user_id
      AND p.email = 'fmbp1981@gmail.com'
      AND ur.role = 'admin'
  )
$$;

-- Create function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.tenant_id
  FROM public.organization_members om
  JOIN public.organizacoes o ON o.id = om.organizacao_id
  WHERE om.user_id = _user_id
  LIMIT 1
$$;

-- Update handle_new_user to NOT automatically assign cliente role
-- Admin must be assigned manually
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );
  
  -- Check if this is the admin email
  IF NEW.email = 'fmbp1981@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Default role as cliente
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cliente');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add RLS policy for consultors to view all organizations (multi-tenant access)
CREATE POLICY "Consultors can view all organizations"
ON public.organizacoes
FOR SELECT
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to manage organizations
CREATE POLICY "Admins can manage organizations"
ON public.organizacoes
FOR ALL
USING (public.is_admin(auth.uid()));

-- Add RLS policy for consultors to view all projects
CREATE POLICY "Consultors can view all projects"
ON public.projetos
FOR SELECT
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to manage projects
CREATE POLICY "Admins can manage projects"
ON public.projetos
FOR ALL
USING (public.is_admin(auth.uid()));

-- Add RLS policy for consultors to view all documents
CREATE POLICY "Consultors can view all documents"
ON public.documentos
FOR SELECT
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for consultors to view all required documents
CREATE POLICY "Consultors can view all required documents"
ON public.documentos_requeridos
FOR SELECT
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for consultors to view/update all document status
CREATE POLICY "Consultors can view all document status"
ON public.documentos_requeridos_status
FOR SELECT
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultors can update all document status"
ON public.documentos_requeridos_status
FOR UPDATE
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to manage user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Add RLS policy for consultors to view member profiles
CREATE POLICY "Consultors can view organization member profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor') 
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = profiles.id
  )
);

-- Add RLS for admins to manage organization members
CREATE POLICY "Admins can manage organization members"
ON public.organization_members
FOR ALL
USING (public.is_admin(auth.uid()));

-- Consultors can view all organization members
CREATE POLICY "Consultors can view all organization members"
ON public.organization_members
FOR SELECT
USING (public.has_role(auth.uid(), 'consultor') OR public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- =====================================================

-- Trigger para organizacoes
DROP TRIGGER IF EXISTS update_organizacoes_updated_at ON public.organizacoes;
CREATE TRIGGER update_organizacoes_updated_at
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para projetos
DROP TRIGGER IF EXISTS update_projetos_updated_at ON public.projetos;
CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON public.projetos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para documentos
DROP TRIGGER IF EXISTS update_documentos_updated_at ON public.documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para documentos_requeridos_status
DROP TRIGGER IF EXISTS update_documentos_requeridos_status_updated_at ON public.documentos_requeridos_status;
CREATE TRIGGER update_documentos_requeridos_status_updated_at
  BEFORE UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para organization_members
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organizacao_id ON public.organization_members(organizacao_id);

-- Índices para projetos
CREATE INDEX IF NOT EXISTS idx_projetos_organizacao_id ON public.projetos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_projetos_fase_atual ON public.projetos(fase_atual);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documentos_projeto_id ON public.documentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_organizacao_id ON public.documentos(organizacao_id);

-- Índices para documentos_requeridos
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_projeto_id ON public.documentos_requeridos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_fase ON public.documentos_requeridos(fase);

-- Índices para documentos_requeridos_status
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_status_documento_requerido_id ON public.documentos_requeridos_status(documento_requerido_id);
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_status_status ON public.documentos_requeridos_status(status);

-- Índices para user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Índices para notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);

-- =====================================================
-- SEED DATA: CATÁLOGO DE DOCUMENTOS
-- =====================================================

INSERT INTO public.documentos_catalogo (nome, descricao, fase, tipo_projeto, obrigatorio, ordem, formatos_aceitos, tamanho_maximo_mb, criterios_aceitacao)
VALUES
  -- Fase Diagnóstico
  ('Contrato Social', 'Contrato social atualizado da empresa', 'diagnostico', 'gig_completo', true, 1, ARRAY['pdf', 'docx'], 50, 'Documento deve estar legível e atualizado'),
  ('Acordo de Sócios', 'Acordo entre sócios, se existente', 'diagnostico', 'gig_completo', false, 2, ARRAY['pdf', 'docx'], 50, 'Se aplicável, incluir todas as páginas assinadas'),
  ('Organograma', 'Estrutura organizacional da empresa', 'diagnostico', 'gig_completo', true, 3, ARRAY['pdf', 'png', 'jpg', 'xlsx'], 20, 'Deve refletir a estrutura atual'),
  ('Lista de Sócios/Acionistas', 'Relação completa de sócios ou acionistas', 'diagnostico', 'gig_completo', true, 4, ARRAY['pdf', 'xlsx', 'docx'], 20, 'Incluir percentual de participação'),
  ('Último Balanço Patrimonial', 'Balanço patrimonial do último exercício', 'diagnostico', 'gig_completo', true, 5, ARRAY['pdf', 'xlsx'], 50, 'Assinado por contador responsável'),
  ('DRE', 'Demonstração de Resultado do Exercício', 'diagnostico', 'gig_completo', true, 6, ARRAY['pdf', 'xlsx'], 50, 'Do último exercício fiscal'),
  ('Lista de Funcionários', 'Relação de colaboradores da empresa', 'diagnostico', 'gig_completo', true, 7, ARRAY['pdf', 'xlsx'], 20, 'Incluir nome, cargo e departamento'),
  ('Políticas Existentes', 'Políticas internas já implementadas', 'diagnostico', 'gig_completo', false, 8, ARRAY['pdf', 'docx'], 100, 'Se existentes, incluir todas as políticas vigentes'),
  
  -- Fase Implementação
  ('Logo da Empresa', 'Logotipo em alta resolução', 'implementacao', 'gig_completo', true, 1, ARRAY['png', 'jpg', 'svg', 'pdf'], 20, 'Preferencialmente em formato vetorial'),
  ('Missão, Visão e Valores', 'Documento com MVV da empresa', 'implementacao', 'gig_completo', true, 2, ARRAY['pdf', 'docx'], 10, 'Texto aprovado pela diretoria'),
  ('Fotos da Diretoria', 'Fotos profissionais dos diretores', 'implementacao', 'gig_completo', false, 3, ARRAY['png', 'jpg'], 50, 'Alta resolução, fundo neutro'),
  ('Assinaturas Digitalizadas', 'Assinaturas dos diretores para documentos', 'implementacao', 'gig_completo', false, 4, ARRAY['png', 'jpg'], 10, 'Fundo transparente ou branco')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÃO PARA CRIAR DOCUMENTOS REQUERIDOS AO CRIAR PROJETO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_required_documents_for_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir documentos requeridos baseados no catálogo
  INSERT INTO public.documentos_requeridos (
    projeto_id, catalogo_id, nome, descricao, fase, obrigatorio,
    formatos_aceitos, tamanho_maximo_mb, criterios_aceitacao, template_url
  )
  SELECT
    NEW.id,
    dc.id,
    dc.nome,
    dc.descricao,
    dc.fase,
    dc.obrigatorio,
    dc.formatos_aceitos,
    dc.tamanho_maximo_mb,
    dc.criterios_aceitacao,
    dc.template_url
  FROM public.documentos_catalogo dc
  WHERE dc.tipo_projeto = NEW.tipo;

  -- Criar status inicial para cada documento requerido
  INSERT INTO public.documentos_requeridos_status (documento_requerido_id, status)
  SELECT dr.id, 'pendente'
  FROM public.documentos_requeridos dr
  WHERE dr.projeto_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger para criar documentos requeridos ao criar projeto
DROP TRIGGER IF EXISTS on_project_created ON public.projetos;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projetos
  FOR EACH ROW
  EXECUTE FUNCTION public.create_required_documents_for_project();

-- =====================================================
-- FUNÇÃO PARA CRIAR NOTIFICAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, metadata)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- =====================================================
-- TRIGGER PARA NOTIFICAR CONSULTOR QUANDO DOCUMENTO É ENVIADO
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_documento_nome text;
  v_organizacao_nome text;
  v_projeto_id uuid;
  v_organizacao_id uuid;
  v_client_user_id uuid;
  v_consultor record;
BEGIN
  -- Buscar informações do documento
  SELECT dr.nome, dr.projeto_id INTO v_documento_nome, v_projeto_id
  FROM public.documentos_requeridos dr
  WHERE dr.id = NEW.documento_requerido_id;

  -- Buscar organização do projeto
  SELECT p.organizacao_id INTO v_organizacao_id
  FROM public.projetos p
  WHERE p.id = v_projeto_id;

  SELECT o.nome INTO v_organizacao_nome
  FROM public.organizacoes o
  WHERE o.id = v_organizacao_id;

  -- Se documento foi enviado, notificar consultores
  IF NEW.status = 'enviado' AND (OLD.status IS NULL OR OLD.status != 'enviado') THEN
    FOR v_consultor IN 
      SELECT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role IN ('consultor', 'admin')
    LOOP
      PERFORM public.create_notification(
        v_consultor.user_id,
        'documento_enviado',
        'Novo documento enviado',
        format('O documento "%s" foi enviado por %s', v_documento_nome, v_organizacao_nome),
        jsonb_build_object('documento_requerido_id', NEW.documento_requerido_id, 'projeto_id', v_projeto_id)
      );
    END LOOP;
  END IF;

  -- Se documento foi aprovado ou rejeitado, notificar cliente
  IF NEW.status IN ('aprovado', 'rejeitado') AND OLD.status != NEW.status THEN
    FOR v_client_user_id IN
      SELECT om.user_id
      FROM public.organization_members om
      WHERE om.organizacao_id = v_organizacao_id
    LOOP
      IF NEW.status = 'aprovado' THEN
        PERFORM public.create_notification(
          v_client_user_id,
          'documento_aprovado',
          'Documento aprovado',
          format('O documento "%s" foi aprovado', v_documento_nome),
          jsonb_build_object('documento_requerido_id', NEW.documento_requerido_id)
        );
      ELSE
        PERFORM public.create_notification(
          v_client_user_id,
          'documento_rejeitado',
          'Documento rejeitado',
          format('O documento "%s" foi rejeitado. Motivo: %s', v_documento_nome, COALESCE(NEW.observacao_rejeicao, 'Não especificado')),
          jsonb_build_object('documento_requerido_id', NEW.documento_requerido_id, 'observacao', NEW.observacao_rejeicao)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_document_status_change ON public.documentos_requeridos_status;
CREATE TRIGGER on_document_status_change
  AFTER INSERT OR UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_status_change();

-- =====================================================
-- RLS POLICY PARA INSERIR NOTIFICAÇÕES (SISTEMA)
-- =====================================================

CREATE POLICY "System can insert notifications"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- HABILITAR REALTIME PARA TABELAS IMPORTANTES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documentos_requeridos_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projetos;

-- =====================================================
-- FUNÇÃO PARA ESTATÍSTICAS DO PROJETO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_project_stats(p_projeto_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_aprovados integer;
  v_enviados integer;
  v_pendentes integer;
  v_rejeitados integer;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE drs.status = 'aprovado'),
    COUNT(*) FILTER (WHERE drs.status = 'enviado'),
    COUNT(*) FILTER (WHERE drs.status = 'pendente'),
    COUNT(*) FILTER (WHERE drs.status = 'rejeitado')
  INTO v_total, v_aprovados, v_enviados, v_pendentes, v_rejeitados
  FROM public.documentos_requeridos dr
  LEFT JOIN public.documentos_requeridos_status drs ON drs.documento_requerido_id = dr.id
  WHERE dr.projeto_id = p_projeto_id;

  RETURN jsonb_build_object(
    'total', v_total,
    'aprovados', v_aprovados,
    'enviados', v_enviados,
    'pendentes', v_pendentes,
    'rejeitados', v_rejeitados,
    'percentual_aprovado', CASE WHEN v_total > 0 THEN ROUND((v_aprovados::numeric / v_total) * 100, 2) ELSE 0 END
  );
END;
$$;

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
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;-- Tabela de perguntas do diagnóstico (catálogo)
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
$$;-- Tabela de cursos/treinamentos
CREATE TABLE public.treinamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'compliance',
  carga_horaria_minutos INTEGER NOT NULL DEFAULT 60,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conteúdos/módulos do treinamento
CREATE TABLE public.treinamento_conteudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'texto', -- texto, video, pdf
  conteudo TEXT, -- markdown ou URL
  duracao_minutos INTEGER DEFAULT 5,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perguntas do quiz
CREATE TABLE public.treinamento_quiz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  alternativas JSONB NOT NULL, -- [{texto: "...", correta: true/false}]
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inscrições/progresso do colaborador
CREATE TABLE public.treinamento_inscricoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nao_iniciado', -- nao_iniciado, em_andamento, concluido
  progresso_conteudo JSONB DEFAULT '[]'::jsonb, -- IDs dos conteúdos concluídos
  quiz_tentativas INTEGER DEFAULT 0,
  quiz_nota NUMERIC,
  quiz_aprovado BOOLEAN DEFAULT false,
  iniciado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(treinamento_id, user_id)
);

-- Tabela de certificados
CREATE TABLE public.treinamento_certificados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscricao_id UUID NOT NULL REFERENCES public.treinamento_inscricoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  codigo_validacao TEXT NOT NULL UNIQUE DEFAULT ('CERT-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  emitido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome_completo TEXT NOT NULL,
  nota_final NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_certificados ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treinamentos
CREATE POLICY "Everyone can view active trainings" ON public.treinamentos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage trainings" ON public.treinamentos
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_conteudos
CREATE POLICY "Everyone can view training content" ON public.treinamento_conteudos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.treinamentos t WHERE t.id = treinamento_id AND t.ativo = true
  ));

CREATE POLICY "Admins can manage content" ON public.treinamento_conteudos
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_quiz
CREATE POLICY "Everyone can view quiz" ON public.treinamento_quiz
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.treinamentos t WHERE t.id = treinamento_id AND t.ativo = true
  ));

CREATE POLICY "Admins can manage quiz" ON public.treinamento_quiz
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_inscricoes
CREATE POLICY "Users can view own enrollments" ON public.treinamento_inscricoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own enrollments" ON public.treinamento_inscricoes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Consultors can view organization enrollments" ON public.treinamento_inscricoes
  FOR SELECT USING (
    has_role(auth.uid(), 'consultor') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage all enrollments" ON public.treinamento_inscricoes
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_certificados
CREATE POLICY "Anyone can verify certificates" ON public.treinamento_certificados
  FOR SELECT USING (true);

CREATE POLICY "Users can view own certificates" ON public.treinamento_certificados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create certificates" ON public.treinamento_certificados
  FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_treinamentos_updated_at
  BEFORE UPDATE ON public.treinamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treinamento_inscricoes_updated_at
  BEFORE UPDATE ON public.treinamento_inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial de treinamentos
INSERT INTO public.treinamentos (nome, descricao, categoria, carga_horaria_minutos, obrigatorio, ordem) VALUES
('Código de Ética e Conduta', 'Treinamento sobre os princípios éticos e normas de conduta da organização', 'etica', 60, true, 1),
('LGPD - Lei Geral de Proteção de Dados', 'Fundamentos da LGPD e boas práticas de proteção de dados pessoais', 'compliance', 90, true, 2),
('Prevenção à Lavagem de Dinheiro', 'Conceitos e procedimentos de PLD/FT para colaboradores', 'compliance', 45, false, 3),
('Assédio Moral e Sexual no Trabalho', 'Identificação, prevenção e denúncia de situações de assédio', 'etica', 30, true, 4),
('Conflito de Interesses', 'Como identificar e gerenciar conflitos de interesse nas atividades profissionais', 'governanca', 45, true, 5);

-- Seed de conteúdos para Código de Ética
INSERT INTO public.treinamento_conteudos (treinamento_id, titulo, tipo, conteudo, duracao_minutos, ordem)
SELECT id, 'Introdução ao Código de Ética', 'texto', 
'# Introdução ao Código de Ética

O Código de Ética é o documento que estabelece os princípios e valores que devem nortear todas as ações e decisões dos colaboradores.

## Por que é importante?

- **Orientação**: Fornece diretrizes claras para situações do dia a dia
- **Proteção**: Protege a empresa e os colaboradores de riscos reputacionais
- **Cultura**: Fortalece a cultura organizacional baseada em valores

## Princípios Fundamentais

1. **Integridade**: Agir com honestidade em todas as situações
2. **Respeito**: Tratar todos com dignidade e consideração
3. **Transparência**: Comunicar de forma clara e verdadeira
4. **Responsabilidade**: Assumir as consequências de nossas ações', 
15, 1
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_conteudos (treinamento_id, titulo, tipo, conteudo, duracao_minutos, ordem)
SELECT id, 'Normas de Conduta', 'texto',
'# Normas de Conduta

## Relacionamento com Colegas

- Manter ambiente de trabalho respeitoso
- Evitar fofocas e comentários depreciativos
- Colaborar para o sucesso coletivo

## Relacionamento com Clientes

- Atender com cortesia e profissionalismo
- Manter confidencialidade das informações
- Buscar sempre a melhor solução

## Uso de Recursos

- Utilizar recursos da empresa apenas para fins profissionais
- Zelar pela conservação de equipamentos
- Reportar desperdícios ou uso indevido',
15, 2
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_conteudos (treinamento_id, titulo, tipo, conteudo, duracao_minutos, ordem)
SELECT id, 'Canal de Denúncias', 'texto',
'# Canal de Denúncias

## O que é?

O Canal de Denúncias é um meio seguro e confidencial para reportar situações que violem o Código de Ética.

## Garantias

- **Anonimato**: Sua identidade é protegida
- **Não-retaliação**: Proibida qualquer forma de retaliação
- **Investigação**: Todas as denúncias são investigadas

## Como utilizar?

1. Acesse o canal de denúncias da empresa
2. Descreva a situação com detalhes
3. Anexe evidências se disponíveis
4. Acompanhe pelo número de protocolo',
10, 3
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

-- Seed de quiz para Código de Ética
INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id, 
'Qual é o principal objetivo do Código de Ética?',
'[{"texto": "Punir colaboradores que cometem erros", "correta": false}, {"texto": "Orientar comportamentos e decisões baseados em valores", "correta": true}, {"texto": "Aumentar a burocracia da empresa", "correta": false}, {"texto": "Substituir as leis trabalhistas", "correta": false}]'::jsonb,
1
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'O que é garantido ao utilizar o Canal de Denúncias?',
'[{"texto": "Recompensa financeira", "correta": false}, {"texto": "Promoção automática", "correta": false}, {"texto": "Anonimato e não-retaliação", "correta": true}, {"texto": "Demissão do denunciado", "correta": false}]'::jsonb,
2
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'Qual dos seguintes NÃO é um princípio fundamental do Código de Ética?',
'[{"texto": "Integridade", "correta": false}, {"texto": "Competitividade agressiva", "correta": true}, {"texto": "Transparência", "correta": false}, {"texto": "Responsabilidade", "correta": false}]'::jsonb,
3
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'Como devemos tratar as informações confidenciais de clientes?',
'[{"texto": "Compartilhar com amigos próximos", "correta": false}, {"texto": "Publicar nas redes sociais", "correta": false}, {"texto": "Manter em sigilo absoluto", "correta": true}, {"texto": "Usar para benefício pessoal", "correta": false}]'::jsonb,
4
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'Ao presenciar uma situação de assédio, você deve:',
'[{"texto": "Ignorar e fingir que não viu", "correta": false}, {"texto": "Participar da situação", "correta": false}, {"texto": "Reportar pelo Canal de Denúncias", "correta": true}, {"texto": "Esperar que a vítima resolva sozinha", "correta": false}]'::jsonb,
5
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';-- Tabela de versões do Código de Ética
CREATE TABLE public.codigo_etica_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Tabela de adesões ao Código de Ética
CREATE TABLE public.codigo_etica_adesoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  versao_id UUID NOT NULL REFERENCES public.codigo_etica_versoes(id) ON DELETE CASCADE,
  aceito_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT, -- Opcional, pode ser null para privacidade
  user_agent TEXT, -- Opcional, pode ser null para privacidade
  UNIQUE(user_id, versao_id)
);

-- Enable RLS
ALTER TABLE public.codigo_etica_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigo_etica_adesoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for codigo_etica_versoes
CREATE POLICY "Everyone can view active versions" ON public.codigo_etica_versoes
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage versions" ON public.codigo_etica_versoes
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Consultors can view all versions" ON public.codigo_etica_versoes
  FOR SELECT USING (has_role(auth.uid(), 'consultor'));

-- RLS Policies for codigo_etica_adesoes
CREATE POLICY "Users can view own adherence" ON public.codigo_etica_adesoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adherence" ON public.codigo_etica_adesoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Consultors can view organization adherences" ON public.codigo_etica_adesoes
  FOR SELECT USING (
    has_role(auth.uid(), 'consultor') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage all adherences" ON public.codigo_etica_adesoes
  FOR ALL USING (is_admin(auth.uid()));

-- Seed versão inicial do Código de Ética
INSERT INTO public.codigo_etica_versoes (versao, titulo, conteudo, ativo, vigencia_inicio) VALUES
('1.0', 'Código de Ética e Conduta Empresarial', '# Código de Ética e Conduta Empresarial

## 1. INTRODUÇÃO

Este Código de Ética e Conduta estabelece os princípios, valores e diretrizes que devem nortear o comportamento de todos os colaboradores, gestores, sócios e parceiros da organização.

## 2. VALORES FUNDAMENTAIS

### 2.1 Integridade
Agir com honestidade, transparência e retidão em todas as relações profissionais e pessoais no ambiente de trabalho.

### 2.2 Respeito
Tratar todos com dignidade, consideração e respeito, independentemente de cargo, função, gênero, raça, religião ou orientação.

### 2.3 Responsabilidade
Assumir a responsabilidade por nossas ações e decisões, cumprindo com os compromissos assumidos.

### 2.4 Excelência
Buscar continuamente a melhoria e a qualidade em tudo o que fazemos.

## 3. CONDUTAS ESPERADAS

### 3.1 No Ambiente de Trabalho
- Manter postura profissional e respeitosa
- Zelar pelo patrimônio da empresa
- Cumprir horários e compromissos
- Colaborar com os colegas

### 3.2 Com Clientes e Parceiros
- Atender com cortesia e profissionalismo
- Manter confidencialidade das informações
- Cumprir acordos e prazos estabelecidos
- Não aceitar ou oferecer vantagens indevidas

### 3.3 Com a Sociedade
- Respeitar as leis e regulamentações
- Atuar de forma sustentável
- Contribuir para o desenvolvimento da comunidade

## 4. CONDUTAS VEDADAS

São expressamente proibidas:
- Qualquer forma de assédio moral ou sexual
- Discriminação de qualquer natureza
- Uso de álcool ou substâncias ilícitas no trabalho
- Conflito de interesses não declarado
- Uso indevido de informações confidenciais
- Fraude, corrupção ou suborno

## 5. CANAL DE DENÚNCIAS

A organização disponibiliza um Canal de Denúncias seguro e confidencial para relatar violações a este Código. O anonimato é garantido e não haverá retaliação contra denunciantes de boa-fé.

## 6. CONSEQUÊNCIAS

O descumprimento deste Código poderá resultar em medidas disciplinares, incluindo advertência, suspensão ou desligamento, além de possíveis sanções legais.

## 7. DECLARAÇÃO DE ADESÃO

Ao aderir a este Código, declaro que:
- Li e compreendi integralmente seu conteúdo
- Comprometo-me a cumprir todas as suas disposições
- Estou ciente das consequências do seu descumprimento
- Comprometo-me a reportar violações de que tiver conhecimento', true, CURRENT_DATE);-- =============================================
-- Migration: Google Drive Integration + Document Notification Triggers
-- =============================================

-- 1. Add Google Drive folder fields to organizations
ALTER TABLE public.organizacoes 
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;

-- 2. Add system settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage system settings" ON public.system_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('google_drive_base_folder_id', NULL, 'ID da pasta raiz no Google Drive onde as pastas dos clientes serão criadas'),
  ('google_drive_enabled', 'false', 'Habilita a integração com Google Drive')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 3. Notification Triggers for Document Events
-- =============================================

-- Helper function to create notifications
CREATE OR REPLACE FUNCTION public.create_document_notification(
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_user_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, metadata)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_metadata);
END;
$$;

-- Trigger function for document status changes
CREATE OR REPLACE FUNCTION public.notify_on_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_doc_name TEXT;
  v_org_name TEXT;
  v_org_id UUID;
  v_projeto_id UUID;
  v_user_id UUID;
  v_consultor RECORD;
  v_member RECORD;
BEGIN
  -- Get document info
  SELECT dr.nome, p.organizacao_id, p.id
  INTO v_doc_name, v_org_id, v_projeto_id
  FROM public.documentos_requeridos dr
  JOIN public.projetos p ON p.id = dr.projeto_id
  WHERE dr.id = NEW.documento_requerido_id;

  -- Get organization name
  SELECT nome INTO v_org_name FROM public.organizacoes WHERE id = v_org_id;

  -- On document sent (INSERT with status 'enviado' or UPDATE to 'enviado')
  IF (TG_OP = 'INSERT' AND NEW.status = 'enviado') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'enviado' AND OLD.status != 'enviado') THEN
    
    -- Notify all consultants and admins
    FOR v_consultor IN 
      SELECT DISTINCT ur.user_id 
      FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'consultor')
    LOOP
      PERFORM create_document_notification(
        'documento_enviado',
        'Novo documento enviado',
        'O documento "' || v_doc_name || '" foi enviado pela empresa ' || v_org_name,
        v_consultor.user_id,
        jsonb_build_object(
          'status_id', NEW.id,
          'documento_nome', v_doc_name,
          'organizacao_id', v_org_id,
          'organizacao_nome', v_org_name
        )
      );
    END LOOP;
  END IF;

  -- On document approved
  IF TG_OP = 'UPDATE' AND NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    -- Notify all members of the organization
    FOR v_member IN 
      SELECT om.user_id 
      FROM public.organization_members om 
      WHERE om.organizacao_id = v_org_id
    LOOP
      PERFORM create_document_notification(
        'documento_aprovado',
        'Documento aprovado',
        'O documento "' || v_doc_name || '" foi aprovado pelo consultor.',
        v_member.user_id,
        jsonb_build_object(
          'status_id', NEW.id,
          'documento_nome', v_doc_name
        )
      );
    END LOOP;
  END IF;

  -- On document rejected
  IF TG_OP = 'UPDATE' AND NEW.status = 'rejeitado' AND OLD.status != 'rejeitado' THEN
    -- Notify all members of the organization
    FOR v_member IN 
      SELECT om.user_id 
      FROM public.organization_members om 
      WHERE om.organizacao_id = v_org_id
    LOOP
      PERFORM create_document_notification(
        'documento_rejeitado',
        'Documento rejeitado',
        'O documento "' || v_doc_name || '" precisa de correção. Motivo: ' || COALESCE(NEW.observacao_rejeicao, 'Não informado'),
        v_member.user_id,
        jsonb_build_object(
          'status_id', NEW.id,
          'documento_nome', v_doc_name,
          'motivo', NEW.observacao_rejeicao
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers (drop first if exists to recreate)
DROP TRIGGER IF EXISTS on_document_status_insert ON public.documentos_requeridos_status;
DROP TRIGGER IF EXISTS on_document_status_update ON public.documentos_requeridos_status;

CREATE TRIGGER on_document_status_insert
  AFTER INSERT ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_status_change();

CREATE TRIGGER on_document_status_update
  AFTER UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_status_change();

-- =============================================
-- 4. Enhanced onboarding to include Drive folder creation
-- =============================================

-- Update the create_client_onboarding function to return drive info
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
  v_drive_enabled BOOLEAN;
BEGIN
  -- Check if Drive integration is enabled
  SELECT value::boolean INTO v_drive_enabled 
  FROM public.system_settings 
  WHERE key = 'google_drive_enabled';

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
    'projeto_id', v_projeto_id,
    'drive_enabled', COALESCE(v_drive_enabled, false)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_document_notification TO authenticated;
