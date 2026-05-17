-- Criar buckets de storage necessários para o sistema
-- Executado via migration para eliminar configuração manual no Dashboard

-- Bucket para arquivos da Biblioteca (templates/modelos para consultores)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'biblioteca-modelos',
  'biblioteca-modelos',
  true,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para biblioteca-modelos
-- Admin pode fazer upload/delete
CREATE POLICY "Admins can upload to biblioteca-modelos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'biblioteca-modelos'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete from biblioteca-modelos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'biblioteca-modelos'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Admin e consultor podem ler (bucket é public mas garantimos via policy também)
CREATE POLICY "Admin and consultor can read biblioteca-modelos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'biblioteca-modelos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'consultor')
  )
);
