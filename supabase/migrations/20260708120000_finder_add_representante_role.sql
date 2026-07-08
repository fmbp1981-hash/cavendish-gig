-- Módulo Finder (prospecção): adiciona o papel "representante" ao RBAC existente.
-- Isolado em migration própria: ALTER TYPE ... ADD VALUE não pode ser usado na mesma
-- transação que já referencia o valor novo (ver migration seguinte, is_representante()).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'representante';
