-- Módulo Finder: novo tipo de reunião para o fechamento comercial com Alberto Cavendish.
-- Isolado em migration própria pela mesma razão da migration do role "representante":
-- ALTER TYPE ... ADD VALUE não pode ser usado na mesma transação que já o referencia.
ALTER TYPE public.tipo_reuniao ADD VALUE IF NOT EXISTS 'fechamento_comercial';
