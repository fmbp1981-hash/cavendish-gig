-- =============================================
-- Sistema de Tutorial Guiado
-- =============================================

CREATE TABLE IF NOT EXISTS public.tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_type TEXT NOT NULL, -- 'onboarding', 'feature_discovery', etc
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tutorial_type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user_id
ON public.tutorial_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_tutorial_progress_type
ON public.tutorial_progress(tutorial_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tutorial_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tutorial_progress_updated_at
  BEFORE UPDATE ON public.tutorial_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_progress_updated_at();

-- RLS Policies
ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tutorial progress"
ON public.tutorial_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial progress"
ON public.tutorial_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutorial progress"
ON public.tutorial_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.tutorial_progress IS 'Salva o progresso dos tutoriais guiados dos usuários';
