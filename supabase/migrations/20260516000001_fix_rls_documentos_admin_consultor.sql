-- =============================================
-- Migration: Fix RLS — admin e consultores alocados veem documentos
-- Problema: documentos_requeridos e _status só permitiam org_members
--           Consultor sem alocação (novo) ficava sem acesso algum
-- =============================================

-- -----------------------------------------------
-- TABELA: documentos
-- Admin já coberto por migration 20260410000003
-- Adicionar: consultor alocado via consultor_organizacoes
-- -----------------------------------------------
DROP POLICY IF EXISTS "Members can view documents" ON public.documentos;
CREATE POLICY "Members can view documents" ON public.documentos
  FOR SELECT USING (
    -- Org members (clientes/parceiros)
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    -- Admin vê tudo
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR
    -- Consultor alocado à organização
    EXISTS (
      SELECT 1 FROM public.consultor_organizacoes
      WHERE consultor_organizacoes.consultor_id = auth.uid()
        AND consultor_organizacoes.organizacao_id = documentos.organizacao_id
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
    OR
    EXISTS (
      SELECT 1 FROM public.consultor_organizacoes
      WHERE consultor_organizacoes.consultor_id = auth.uid()
        AND consultor_organizacoes.organizacao_id = documentos.organizacao_id
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
    OR
    EXISTS (
      SELECT 1 FROM public.consultor_organizacoes
      WHERE consultor_organizacoes.consultor_id = auth.uid()
        AND consultor_organizacoes.organizacao_id = documentos.organizacao_id
    )
  );

-- -----------------------------------------------
-- TABELA: documentos_requeridos
-- Adicionar: admin + consultor alocado
-- -----------------------------------------------
DROP POLICY IF EXISTS "Members can view required documents" ON public.documentos_requeridos;
CREATE POLICY "Members can view required documents" ON public.documentos_requeridos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projetos
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE projetos.id = documentos_requeridos.projeto_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.projetos
      JOIN public.consultor_organizacoes ON consultor_organizacoes.organizacao_id = projetos.organizacao_id
      WHERE projetos.id = documentos_requeridos.projeto_id
        AND consultor_organizacoes.consultor_id = auth.uid()
    )
  );

-- Admins e consultores alocados podem gerenciar documentos_requeridos
DROP POLICY IF EXISTS "Admins can manage required documents" ON public.documentos_requeridos;
CREATE POLICY "Admins can manage required documents" ON public.documentos_requeridos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- -----------------------------------------------
-- TABELA: documentos_requeridos_status
-- Adicionar: admin + consultor alocado para SELECT e UPDATE
-- -----------------------------------------------
DROP POLICY IF EXISTS "Members can view document status" ON public.documentos_requeridos_status;
CREATE POLICY "Members can view document status" ON public.documentos_requeridos_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.consultor_organizacoes ON consultor_organizacoes.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id
        AND consultor_organizacoes.consultor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update document status" ON public.documentos_requeridos_status;
CREATE POLICY "Members can update document status" ON public.documentos_requeridos_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'consultor')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.consultor_organizacoes ON consultor_organizacoes.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id
        AND consultor_organizacoes.consultor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert document status" ON public.documentos_requeridos_status;
CREATE POLICY "Members can insert document status" ON public.documentos_requeridos_status
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.organization_members ON organization_members.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.documentos_requeridos
      JOIN public.projetos ON projetos.id = documentos_requeridos.projeto_id
      JOIN public.consultor_organizacoes ON consultor_organizacoes.organizacao_id = projetos.organizacao_id
      WHERE documentos_requeridos.id = documentos_requeridos_status.documento_requerido_id
        AND consultor_organizacoes.consultor_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- TABELA: documento_comentarios
-- Adicionar: admin + consultor alocado para SELECT
-- -----------------------------------------------
DROP POLICY IF EXISTS "Members can view document comments" ON public.documento_comentarios;
CREATE POLICY "Members can view document comments" ON public.documento_comentarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documentos
      JOIN public.organization_members ON organization_members.organizacao_id = documentos.organizacao_id
      WHERE documentos.id = documento_comentarios.documento_id
        AND organization_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.documentos
      JOIN public.consultor_organizacoes ON consultor_organizacoes.organizacao_id = documentos.organizacao_id
      WHERE documentos.id = documento_comentarios.documento_id
        AND consultor_organizacoes.consultor_id = auth.uid()
    )
  );
