-- ============================================================================
-- Correção de segurança: blindagem da tabela public.users
-- ----------------------------------------------------------------------------
-- CONTEXTO:
--   A tabela public.users (colunas: id, name, email, password, clinic_name,
--   avatar_url, created_at) estava com:
--     - RLS DESABILITADO
--     - GRANTs totais para o role `anon` (SELECT/INSERT/UPDATE/DELETE/TRUNCATE)
--   Isso permitia que qualquer pessoa com a URL do projeto + anon key (pública,
--   embutida no bundle do frontend) lesse/alterasse/apagasse qualquer registro,
--   incluindo a coluna `password`.
--
--   IMPORTANTE: esta tabela NÃO é usada pela aplicação GIG/Cavendish. Toda a
--   autenticação do app usa o Supabase Auth nativo (auth.users + supabase.auth.*).
--   Nenhum código em src/ e nenhuma outra migration referenciam public.users.
--   A coluna `clinic_name` sugere que a tabela foi criada por outro
--   template/projeto que compartilha o mesmo projeto Supabase.
--
-- ESTRATÉGIA (conservadora e reversível):
--   1. Revogar TODOS os privilégios de API (anon e authenticated) sobre a tabela.
--      Como o app não usa a tabela, isso fecha totalmente o vetor de ataque via
--      API pública sem quebrar nada do GIG/Cavendish.
--   2. Habilitar RLS (defesa em profundidade: sem policy permissiva, nenhum
--      acesso via PostgREST é liberado, nem mesmo para authenticated).
--   3. Manter, comentadas, policies opcionais de "self-service" caso se confirme
--      que algum app legítimo precisa da tabela e que users.id == auth.uid().
--
--   O bloco é protegido por checagem de existência: se a tabela não existir
--   (ex.: banco novo/limpo), a migration não faz nada e não falha.
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE NOTICE 'public.users não existe — nada a fazer.';
    RETURN;
  END IF;

  -- 1) Revogar todo acesso via API pública. Fecha imediatamente o vetor
  --    (leitura/escrita da coluna password e de qualquer registro por anon).
  REVOKE ALL ON TABLE public.users FROM anon;
  REVOKE ALL ON TABLE public.users FROM authenticated;
  REVOKE ALL ON TABLE public.users FROM PUBLIC;

  -- 2) Habilitar RLS + forçar também para o owner da tabela.
  EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.users FORCE ROW LEVEL SECURITY';

  RAISE NOTICE 'public.users blindada: privilégios de anon/authenticated revogados e RLS habilitado.';
END
$$;

-- ----------------------------------------------------------------------------
-- (OPCIONAL) Reative acesso self-service SOMENTE se confirmar que:
--   (a) a tabela é usada por um app legítimo, E
--   (b) public.users.id corresponde a auth.uid() (mesmo UUID do Supabase Auth).
--
-- Se ambos forem verdade, descomente o bloco abaixo. Ele:
--   - concede SELECT/UPDATE apenas nas colunas não sensíveis (password fica de
--     fora, ou seja, nunca é exposta nem editável via API);
--   - permite que o usuário autenticado só veja/edite a própria linha.
-- ----------------------------------------------------------------------------
--
-- DO $$
-- BEGIN
--   IF to_regclass('public.users') IS NULL THEN RETURN; END IF;
--
--   -- Column-level: NUNCA conceder password. Ajuste a lista de colunas conforme o schema real.
--   GRANT SELECT (id, name, email, clinic_name, avatar_url, created_at) ON public.users TO authenticated;
--   GRANT UPDATE (name, clinic_name, avatar_url)                        ON public.users TO authenticated;
--
--   DROP POLICY IF EXISTS "users_select_own" ON public.users;
--   CREATE POLICY "users_select_own" ON public.users
--     FOR SELECT TO authenticated
--     USING (auth.uid() = id);
--
--   DROP POLICY IF EXISTS "users_update_own" ON public.users;
--   CREATE POLICY "users_update_own" ON public.users
--     FOR UPDATE TO authenticated
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);
-- END
-- $$;
