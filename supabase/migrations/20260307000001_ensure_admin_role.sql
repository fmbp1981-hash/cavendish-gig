-- Garante que fmbp1981@gmail.com tem o role 'admin' em user_roles.
-- Necessário porque a migration 20251215190000 substituiu handle_new_user para dar 'cliente'
-- a todos (sem checar o email do admin), podendo ter causado perda do role admin se o
-- dado foi re-seedado. A migration 20260107150000 restaurou o trigger, mas ele só age
-- em novos cadastros, não no usuário já existente.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = 'fmbp1981@gmail.com';

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;
