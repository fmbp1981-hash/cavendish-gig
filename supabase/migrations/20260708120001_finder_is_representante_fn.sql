-- Módulo Finder: função de checagem do papel "representante", mesmo estilo de is_admin().
CREATE OR REPLACE FUNCTION public.is_representante(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'representante'::public.app_role)
$$;
