-- =============================================
-- Migration: Restringe RLS de documentos — apenas org_members + admin
-- Consultores mantidos sem acesso direto à tabela documentos
-- =============================================

DROP POLICY IF EXISTS "Members can view documents" ON public.documentos;
CREATE POLICY "Members can view documents" ON public.documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Members can insert documents" ON public.documentos;
CREATE POLICY "Members can insert documents" ON public.documentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

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
      AND user_roles.role = 'admin'
    )
  );
