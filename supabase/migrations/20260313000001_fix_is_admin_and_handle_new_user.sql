-- ============================================================================
-- Migration: Fix is_admin() and handle_new_user()
-- 
-- 1) Removes hardcoded email from is_admin() — any user with 'admin' role
--    in user_roles table will be recognized as admin by RLS policies.
-- 2) Updates handle_new_user() to use the renamed user_pre_registrations
--    table (with role column) instead of the old consultant_pre_registrations.
-- 3) Ensures default role is always 'cliente' for new signups.
-- ============================================================================

-- 1) Fix is_admin(): role-based only, no hardcoded email
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
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
      AND role = 'admin'
  )
$$;

-- 2) Fix handle_new_user(): use user_pre_registrations (with role column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pre_reg RECORD;
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );

  -- Check if email has a pre-registration with a specific role
  SELECT id, role INTO v_pre_reg
  FROM public.user_pre_registrations
  WHERE email = LOWER(TRIM(NEW.email))
    AND used_at IS NULL
  LIMIT 1;

  IF v_pre_reg.id IS NOT NULL THEN
    -- Use the pre-registered role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_pre_reg.role::public.app_role);

    -- Mark pre-registration as used
    UPDATE public.user_pre_registrations
    SET used_at = now(),
        used_by_user_id = NEW.id
    WHERE id = v_pre_reg.id;
  ELSE
    -- Default role: cliente
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cliente');
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4) Ensure RLS policies on profiles allow admin to see all users
-- Drop and recreate the admin SELECT policy to ensure it exists
DO $$
BEGIN
  -- profiles: admin can view all
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    DROP POLICY "Admins can view all profiles" ON public.profiles;
  END IF;

  CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

  -- user_roles: admin can view all
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can view all user roles'
  ) THEN
    DROP POLICY "Admins can view all user roles" ON public.user_roles;
  END IF;

  CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

  -- user_roles: admin can manage (insert/update/delete)
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can manage user roles'
  ) THEN
    DROP POLICY "Admins can manage user roles" ON public.user_roles;
  END IF;

  CREATE POLICY "Admins can manage user roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_admin(auth.uid()));

END $$;
