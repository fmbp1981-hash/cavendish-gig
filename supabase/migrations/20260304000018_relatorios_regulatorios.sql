-- Relatórios Regulatórios
CREATE TABLE public.relatorios_regulatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('CGU','CVM','BACEN','ANPD','TCU','CADE')),
  periodo_referencia TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','revisao','entregue')),
  prazo_entrega DATE,
  entregue_em TIMESTAMPTZ,
  protocolo TEXT,
  documento_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_relatorios_reg_organization ON public.relatorios_regulatorios(organization_id);
CREATE INDEX idx_relatorios_reg_status ON public.relatorios_regulatorios(status);

ALTER TABLE public.relatorios_regulatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relatorios_reg_select" ON public.relatorios_regulatorios FOR SELECT USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "relatorios_reg_insert" ON public.relatorios_regulatorios FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "relatorios_reg_update" ON public.relatorios_regulatorios FOR UPDATE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "relatorios_reg_delete" ON public.relatorios_regulatorios FOR DELETE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_relatorios_reg_updated_at
  BEFORE UPDATE ON public.relatorios_regulatorios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
