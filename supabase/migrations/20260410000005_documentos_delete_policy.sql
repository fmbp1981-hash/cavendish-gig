-- =============================================
-- Migration: Adiciona política DELETE em documentos e storage
-- =============================================

-- DELETE na tabela documentos: apenas quem enviou OU admin
DROP POLICY IF EXISTS "Members can delete documents" ON public.documentos;
CREATE POLICY "Members can delete documents" ON public.documentos
  FOR DELETE USING (
    -- Quem fez o upload pode deletar
    uploaded_by = auth.uid()
    OR
    -- Org members podem deletar docs da sua org
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organizacao_id = documentos.organizacao_id
      AND organization_members.user_id = auth.uid()
    )
    OR
    -- Admin pode deletar qualquer documento
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- DELETE no storage: usuários autenticados podem deletar arquivos do bucket
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');
