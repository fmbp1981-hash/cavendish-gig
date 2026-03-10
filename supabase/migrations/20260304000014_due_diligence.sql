-- Diligência em Terceiros (Due Diligence)
CREATE TABLE public.due_diligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  fornecedor_nome TEXT NOT NULL,
  fornecedor_cnpj TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('fornecedor','parceiro','representante','intermediario')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_analise','aprovado','reprovado','condicional')),
  score_risco INT CHECK (score_risco BETWEEN 0 AND 100),
  checklist_items JSONB DEFAULT '[]',
  documentos_url TEXT[],
  analista_id UUID REFERENCES auth.users(id),
  data_analise TIMESTAMPTZ,
  validade DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_due_diligence_organization ON public.due_diligence(organization_id);
CREATE INDEX idx_due_diligence_status ON public.due_diligence(status);

ALTER TABLE public.due_diligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "due_diligence_select" ON public.due_diligence FOR SELECT USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "due_diligence_insert" ON public.due_diligence FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "due_diligence_update" ON public.due_diligence FOR UPDATE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "due_diligence_delete" ON public.due_diligence FOR DELETE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_due_diligence_updated_at
  BEFORE UPDATE ON public.due_diligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
