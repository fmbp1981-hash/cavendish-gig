-- Add status column to documentos table
-- Required for ata approval workflow (process-transcription edge function + ConsultorAgendamento)
ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS status public.status_documento NOT NULL DEFAULT 'em_analise';

-- Index for filtering by status (used in approval queue queries)
CREATE INDEX IF NOT EXISTS idx_documentos_status ON public.documentos (status);
