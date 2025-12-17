
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
