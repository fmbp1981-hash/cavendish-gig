-- Módulo LGPD: inventário de tratamento + solicitações de titulares (DSARs)
CREATE TABLE public.lgpd_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  processo TEXT NOT NULL,
  finalidade TEXT NOT NULL,
  base_legal TEXT NOT NULL CHECK (base_legal IN ('consentimento','contrato','obrigacao_legal','interesse_legitimo','outro')),
  dados_coletados TEXT[],
  titulares TEXT[],
  operador TEXT,
  retencao_meses INT,
  medidas_seguranca TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lgpd_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('acesso','correcao','exclusao','portabilidade','revogacao_consentimento')),
  solicitante_nome TEXT NOT NULL,
  solicitante_email TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'recebida' CHECK (status IN ('recebida','em_analise','concluida','negada')),
  prazo_resposta DATE,
  resposta TEXT,
  respondido_por UUID REFERENCES auth.users(id),
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lgpd_inventario_org ON public.lgpd_inventario(organization_id);
CREATE INDEX idx_lgpd_solicitacoes_org ON public.lgpd_solicitacoes(organization_id);
CREATE INDEX idx_lgpd_solicitacoes_status ON public.lgpd_solicitacoes(status);

ALTER TABLE public.lgpd_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lgpd_inventario_select" ON public.lgpd_inventario FOR SELECT USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "lgpd_inventario_insert" ON public.lgpd_inventario FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "lgpd_inventario_update" ON public.lgpd_inventario FOR UPDATE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "lgpd_inventario_delete" ON public.lgpd_inventario FOR DELETE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE POLICY "lgpd_solicitacoes_select" ON public.lgpd_solicitacoes FOR SELECT USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "lgpd_solicitacoes_insert" ON public.lgpd_solicitacoes FOR INSERT WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);
CREATE POLICY "lgpd_solicitacoes_update" ON public.lgpd_solicitacoes FOR UPDATE USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'consultor'::public.app_role))
);

CREATE TRIGGER set_lgpd_inventario_updated_at
  BEFORE UPDATE ON public.lgpd_inventario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
