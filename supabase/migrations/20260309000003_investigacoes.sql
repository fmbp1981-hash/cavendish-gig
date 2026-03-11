-- Investigações formais vinculadas ao canal de denúncias

CREATE TABLE IF NOT EXISTS public.investigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  denuncia_id UUID NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta','em_analise','investigando','concluida','arquivada')),
  responsavel_id UUID REFERENCES auth.users(id),
  prazo_resposta DATE,
  categoria_triagem TEXT,
  nivel_risco TEXT CHECK (nivel_risco IN ('baixo','medio','alto','critico')),
  conclusao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(denuncia_id)
);

CREATE INDEX IF NOT EXISTS idx_investigacoes_denuncia ON public.investigacoes(denuncia_id);
CREATE INDEX IF NOT EXISTS idx_investigacoes_status ON public.investigacoes(status);
CREATE INDEX IF NOT EXISTS idx_investigacoes_org ON public.investigacoes(organizacao_id);

ALTER TABLE public.investigacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investigacoes_rw" ON public.investigacoes FOR ALL USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_investigacoes_updated_at
  BEFORE UPDATE ON public.investigacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notas internas sigilosas
CREATE TABLE IF NOT EXISTS public.investigacoes_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  nota TEXT NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_notas_inv ON public.investigacoes_notas(investigacao_id);

ALTER TABLE public.investigacoes_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_notas_rw" ON public.investigacoes_notas FOR ALL USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

-- Evidências
CREATE TABLE IF NOT EXISTS public.investigacoes_evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigacao_id UUID NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  arquivo_url TEXT,
  adicionado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_evidencias_inv ON public.investigacoes_evidencias(investigacao_id);

ALTER TABLE public.investigacoes_evidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_evidencias_rw" ON public.investigacoes_evidencias FOR ALL USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

-- Adiciona campo de triagem e nível de risco à tabela denuncias (se não existir)
ALTER TABLE public.denuncias
  ADD COLUMN IF NOT EXISTS categoria_triagem TEXT,
  ADD COLUMN IF NOT EXISTS nivel_risco TEXT CHECK (nivel_risco IN ('baixo','medio','alto','critico'));
