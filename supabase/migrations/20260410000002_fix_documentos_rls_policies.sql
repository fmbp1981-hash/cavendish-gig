-- =============================================
-- Migration: Expande RLS policies da tabela documentos
-- Problema: Policies só permitiam organization_members, bloqueando
--           admins e consultores com 403 ao fazer upload
-- =============================================

-- Recria policy SELECT incluindo admin/consultor
DROP POLICY IF EXISTS "Members can view documents" ON public.documentos;
CREATE POLICY "Members can view documents" ON public.documentos
  FOR SELECT USING (
    -- Org members (clientes)
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- Admins e consultores veem tudo
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'consultor')
    )
  );

-- Recria policy INSERT incluindo admin/consultor
DROP POLICY IF EXISTS "Members can insert documents" ON public.documentos;
CREATE POLICY "Members can insert documents" ON public.documentos
  FOR INSERT WITH CHECK (
    -- Org members (clientes)
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- Admins e consultores podem inserir em qualquer org
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'consultor')
    )
  );

-- Adiciona policy UPDATE (não existia — necessária para atualizar drive_file_id etc.)
DROP POLICY IF EXISTS "Members can update documents" ON public.documentos;
CREATE POLICY "Members can update documents" ON public.documentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'consultor')
    )
  );
