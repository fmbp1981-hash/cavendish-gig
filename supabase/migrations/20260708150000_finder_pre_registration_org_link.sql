-- Fase 7 do Finder: liga um pré-registro de usuário a uma organização, pra suportar a conversão
-- de lead → cliente sem precisar de um sistema de convite/criação de usuário novo. O mecanismo de
-- pré-registro (email → role, aplicado no signup via handle_new_user()) já existia; só faltava
-- vincular a organização de destino. Coluna nullable — não afeta pré-registros existentes
-- (consultor, etc.), que continuam sem organização.

ALTER TABLE public.user_pre_registrations
  ADD COLUMN IF NOT EXISTS organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE SET NULL;

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
  SELECT id, role, organizacao_id INTO v_pre_reg
  FROM public.user_pre_registrations
  WHERE email = LOWER(TRIM(NEW.email))
    AND used_at IS NULL
  LIMIT 1;

  IF v_pre_reg.id IS NOT NULL THEN
    -- Use the pre-registered role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_pre_reg.role::public.app_role);

    -- Se o pré-registro já veio vinculado a uma organização (fluxo de conversão do Finder),
    -- vincula o novo usuário também em organization_members.
    IF v_pre_reg.organizacao_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organizacao_id, user_id, role)
      VALUES (v_pre_reg.organizacao_id, NEW.id, v_pre_reg.role::public.app_role)
      ON CONFLICT (organizacao_id, user_id) DO NOTHING;
    END IF;

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
