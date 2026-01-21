-- ========================================
-- FIX COMPLETO: Adicionar TODAS as roles necessárias
-- ========================================

-- 1) Verificar estado atual
SELECT
  u.id as user_id,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'fmbp1981@gmail.com'
ORDER BY ur.created_at;

-- 2) Adicionar role 'admin' (se não existir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Adicionar role 'cliente' (se não existir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cliente'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Adicionar role 'consultor' também (admin deve ter acesso total)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'consultor'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) VERIFICAR RESULTADO FINAL (DEVE MOSTRAR 3 ROLES)
SELECT
  u.id as user_id,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'fmbp1981@gmail.com'
ORDER BY ur.role;

-- Resultado esperado:
-- email              | role      | created_at
-- -------------------|-----------|-------------------
-- fmbp1981@gmail.com | admin     | ...
-- fmbp1981@gmail.com | cliente   | ...
-- fmbp1981@gmail.com | consultor | ...
