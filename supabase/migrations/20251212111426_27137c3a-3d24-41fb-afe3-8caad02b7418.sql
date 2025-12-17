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