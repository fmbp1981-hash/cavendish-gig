-- ============================================================================
-- Correção de segurança: tabela órfã public.users
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
--   INVESTIGAÇÃO:
--   - Esta tabela NÃO é usada pela aplicação GIG/Cavendish. Toda a autenticação
--     do app usa o Supabase Auth nativo (auth.users + supabase.auth.*). Nenhum
--     código em src/ e nenhuma outra migration referenciam public.users.
--   - A coluna `clinic_name` indica que a tabela foi criada por outro
--     template/projeto (não relacionado ao GIG).
--   - Auditoria em produção confirmou: total de registros = 0 (tabela vazia) e
--     nenhuma senha em texto puro. É resíduo, não dado vivo.
--
-- REMEDIAÇÃO:
--   Como a tabela está vazia e não é usada por nenhum app do código, o mais
--   seguro é removê-la (elimina a superfície de risco, incluindo a coluna
--   `password`, em vez de manter uma tabela morta).
--
--   Fallback: se em algum ambiente a tabela existir COM dados, não apagamos —
--   apenas revogamos o acesso de API e habilitamos RLS (blindagem reversível),
--   deixando a decisão de migração/exclusão para revisão manual.
--
--   RESTRICT no DROP: aborta caso exista dependência inesperada (view/FK),
--   evitando efeitos colaterais silenciosos.
-- ============================================================================

DO $$
DECLARE
  v_rows bigint;
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE NOTICE 'public.users não existe — nada a fazer.';
    RETURN;
  END IF;

  EXECUTE 'SELECT count(*) FROM public.users' INTO v_rows;

  IF v_rows = 0 THEN
    -- Tabela órfã e vazia: remover de vez.
    EXECUTE 'DROP TABLE public.users RESTRICT';
    RAISE NOTICE 'public.users estava vazia — tabela removida.';
  ELSE
    -- Há dados: NÃO apagar. Blindar (revoke + RLS) e sinalizar revisão manual.
    REVOKE ALL ON TABLE public.users FROM anon;
    REVOKE ALL ON TABLE public.users FROM authenticated;
    REVOKE ALL ON TABLE public.users FROM PUBLIC;
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.users FORCE ROW LEVEL SECURITY';
    RAISE WARNING 'public.users contém % registro(s): NÃO removida. Acesso de API revogado e RLS habilitado. Revisar manualmente (origem/migração).', v_rows;
  END IF;
END
$$;
