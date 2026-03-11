-- Aceites digitais de políticas por colaborador
CREATE TABLE IF NOT EXISTS public.politicas_aceites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politica_id UUID NOT NULL REFERENCES public.politicas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aceito_em TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  UNIQUE(politica_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_politicas_aceites_politica ON public.politicas_aceites(politica_id);
CREATE INDEX IF NOT EXISTS idx_politicas_aceites_user ON public.politicas_aceites(user_id);

ALTER TABLE public.politicas_aceites ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode criar seu próprio aceite e ver os seus
CREATE POLICY "politicas_aceites_select" ON public.politicas_aceites FOR SELECT USING (
  user_id = auth.uid()
  OR (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "politicas_aceites_insert" ON public.politicas_aceites FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
-- Admin/consultor podem ver todos para monitorar adesão
CREATE POLICY "politicas_aceites_all" ON public.politicas_aceites FOR ALL USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
