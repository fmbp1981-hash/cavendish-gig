-- Add drive_file_id to documentos table
ALTER TABLE public.documentos
ADD COLUMN IF NOT EXISTS drive_file_id TEXT;

COMMENT ON COLUMN public.documentos.drive_file_id IS 'ID do arquivo no Google Drive para visualização direta';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documentos_drive_file_id
ON public.documentos(drive_file_id)
WHERE drive_file_id IS NOT NULL;
