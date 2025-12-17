-- Security + RLS hardening fixes

-- 1) Make admin logic role-based (remove hard-coded email)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- Ensure new users always get a default role; admin assignment must be explicit
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

  -- Default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');

  RETURN NEW;
END;
$function$;

-- 2) Fix SECURITY DEFINER onboarding RPC to prevent creating orgs for other users
CREATE OR REPLACE FUNCTION public.create_client_onboarding(
  p_nome_organizacao TEXT,
  p_cnpj TEXT,
  p_tipo_projeto public.tipo_projeto,
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
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.organizacoes (nome, cnpj)
  VALUES (p_nome_organizacao, p_cnpj)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organizacao_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'cliente');

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

-- 3) Remove cross-tenant consultor view-all policies
DO $$
BEGIN
  -- organizacoes
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view all organizations" ON public.organizacoes';
  -- projetos
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view all projects" ON public.projetos';
  -- documentos
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view all documents" ON public.documentos';
  -- documentos_requeridos
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view all required documents" ON public.documentos_requeridos';
  -- documentos_requeridos_status
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view all document status" ON public.documentos_requeridos_status';
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can update all document status" ON public.documentos_requeridos_status';
  -- organization_members
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view all organization members" ON public.organization_members';
  -- profiles
  EXECUTE 'DROP POLICY IF EXISTS "Consultors can view organization member profiles" ON public.profiles';
EXCEPTION
  WHEN undefined_object THEN
    -- ignore
    NULL;
END;
$$;

-- 4) Recreate consultor policies restricted to assigned organizations

-- Organizations
CREATE POLICY "Consultors can view assigned organizations"
ON public.organizacoes
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = organizacoes.id
  )
);

-- Projects
CREATE POLICY "Consultors can view assigned projects"
ON public.projetos
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = projetos.organizacao_id
  )
);

-- Documents
CREATE POLICY "Consultors can view assigned documents"
ON public.documentos
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = documentos.organizacao_id
  )
);

-- Required documents
CREATE POLICY "Consultors can view assigned required documents"
ON public.documentos_requeridos
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.projetos p
    JOIN public.consultor_organizacoes co ON co.organizacao_id = p.organizacao_id
    WHERE p.id = documentos_requeridos.projeto_id
      AND co.consultor_id = auth.uid()
  )
);

-- Required document status
CREATE POLICY "Consultors can view assigned document status"
ON public.documentos_requeridos_status
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.documentos_requeridos dr
    JOIN public.projetos p ON p.id = dr.projeto_id
    JOIN public.consultor_organizacoes co ON co.organizacao_id = p.organizacao_id
    WHERE dr.id = documentos_requeridos_status.documento_requerido_id
      AND co.consultor_id = auth.uid()
  )
);

CREATE POLICY "Consultors can update assigned document status"
ON public.documentos_requeridos_status
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.documentos_requeridos dr
    JOIN public.projetos p ON p.id = dr.projeto_id
    JOIN public.consultor_organizacoes co ON co.organizacao_id = p.organizacao_id
    WHERE dr.id = documentos_requeridos_status.documento_requerido_id
      AND co.consultor_id = auth.uid()
  )
);

-- organization_members visibility for consultors (only assigned orgs)
CREATE POLICY "Consultors can view members of assigned organizations"
ON public.organization_members
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = organization_members.organizacao_id
  )
);

-- profiles visibility for consultors (only users in assigned orgs)
CREATE POLICY "Consultors can view profiles of assigned organizations"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.consultor_organizacoes co ON co.organizacao_id = om.organizacao_id
    WHERE co.consultor_id = auth.uid()
      AND om.user_id = profiles.id
  )
);

-- 5) Fix tasks RLS fallback that granted global access when no assignments existed
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Consultants can manage tasks for their organizations" ON public.tarefas';
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END;
$$;

CREATE POLICY "Consultants can manage tasks for their organizations"
ON public.tarefas
FOR ALL
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = tarefas.organizacao_id
  )
);

-- 6) Denuncias: add ticket_secret + optional org link; restrict view/update by assignment
ALTER TABLE public.denuncias
  ADD COLUMN IF NOT EXISTS ticket_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex');

ALTER TABLE public.denuncias
  ADD COLUMN IF NOT EXISTS organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;

-- Replace existing select/update policies to be org-scoped for consultors
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Only admins and consultants can view complaints" ON public.denuncias';
  EXECUTE 'DROP POLICY IF EXISTS "Only admins and consultants can update complaints" ON public.denuncias';
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END;
$$;

CREATE POLICY "Admins can view all complaints"
ON public.denuncias
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Consultors can view complaints for assigned organizations"
ON public.denuncias
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND denuncias.organizacao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = denuncias.organizacao_id
  )
);

CREATE POLICY "Admins can update complaints"
ON public.denuncias
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Consultors can update complaints for assigned organizations"
ON public.denuncias
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND denuncias.organizacao_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.consultor_organizacoes co
    WHERE co.consultor_id = auth.uid() AND co.organizacao_id = denuncias.organizacao_id
  )
);
