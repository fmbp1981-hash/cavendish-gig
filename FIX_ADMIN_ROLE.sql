-- ========================================
-- FIX: Adicionar role 'admin' ao usuário fmbp1981@gmail.com
-- ========================================
-- Execute este SQL completo no Supabase Dashboard → SQL Editor
-- Tempo estimado: 5 segundos

-- 1) Primeiro, vamos verificar o estado atual
DO $$
DECLARE
  v_user_id UUID;
  v_role_count INT;
BEGIN
  -- Buscar user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fmbp1981@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário fmbp1981@gmail.com não encontrado no auth.users!';
  END IF;

  RAISE NOTICE '✅ Usuário encontrado: %', v_user_id;

  -- Verificar roles existentes
  SELECT COUNT(*) INTO v_role_count
  FROM public.user_roles
  WHERE user_id = v_user_id;

  RAISE NOTICE '📊 Roles existentes: %', v_role_count;

  -- Listar roles
  FOR v_role_count IN
    SELECT role FROM public.user_roles WHERE user_id = v_user_id
  LOOP
    RAISE NOTICE '   - Role: %', v_role_count;
  END LOOP;
END $$;

-- 2) Inserir role 'admin' (ignora se já existir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Garantir que role 'cliente' também existe (para compatibilidade)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cliente'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Verificar resultado final
DO $$
DECLARE
  v_user_id UUID;
  v_has_admin BOOLEAN;
  v_has_cliente BOOLEAN;
  rec RECORD;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fmbp1981@gmail.com';

  -- Verificar roles
  SELECT
    bool_or(role = 'admin') as has_admin,
    bool_or(role = 'cliente') as has_cliente
  INTO v_has_admin, v_has_cliente
  FROM public.user_roles
  WHERE user_id = v_user_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RESULTADO FINAL';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: fmbp1981@gmail.com';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Roles:';

  FOR rec IN
    SELECT role, created_at
    FROM public.user_roles
    WHERE user_id = v_user_id
    ORDER BY created_at
  LOOP
    RAISE NOTICE '   ✓ % (criado em: %)', rec.role, rec.created_at;
  END LOOP;

  RAISE NOTICE '';

  IF v_has_admin THEN
    RAISE NOTICE '✅ Role ADMIN está presente!';
  ELSE
    RAISE WARNING '❌ Role ADMIN NÃO encontrada!';
  END IF;

  IF v_has_cliente THEN
    RAISE NOTICE '✅ Role CLIENTE está presente!';
  ELSE
    RAISE NOTICE '⚠️  Role CLIENTE não encontrada (não é crítico)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Script executado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRÓXIMO PASSO:';
  RAISE NOTICE '1. Faça LOGOUT do sistema';
  RAISE NOTICE '2. Faça LOGIN novamente';
  RAISE NOTICE '3. Verifique no console do navegador:';
  RAISE NOTICE '   [AuthContext] Mapped roles: ["cliente", "admin"]';
  RAISE NOTICE '========================================';
END $$;
