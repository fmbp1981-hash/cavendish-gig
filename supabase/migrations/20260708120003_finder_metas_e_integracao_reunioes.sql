-- Módulo Finder: metas por representante (dashboard admin) + ligação com o fluxo de
-- agendamento de fechamento comercial (reunião com Alberto Cavendish, ver FINDER_MODULE_SPEC.md §3).

CREATE TABLE public.prospeccao_metas_representante (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representante_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periodo_mes            date NOT NULL,
  meta_leads_contatados  integer NOT NULL DEFAULT 0,
  meta_conversoes        integer NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE(representante_id, periodo_mes)
);

CREATE TRIGGER set_prospeccao_metas_representante_updated_at
  BEFORE UPDATE ON public.prospeccao_metas_representante
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.prospeccao_metas_representante ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospeccao_metas_admin_gerencia" ON public.prospeccao_metas_representante
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "prospeccao_metas_representante_ve_proprio" ON public.prospeccao_metas_representante
  FOR SELECT USING (representante_id = auth.uid() OR public.is_admin(auth.uid()));

-- ── Ligação lead → reunião de fechamento com Alberto ─────────────────────────
ALTER TABLE public.prospeccao_leads
  ADD COLUMN reuniao_fechamento_id uuid REFERENCES public.reunioes(id) ON DELETE SET NULL;

-- ── Ligação reunião → lead/representante (reaproveita a tabela `reunioes` existente,
-- em vez de criar uma tabela de reunião paralela — ver FINDER_MODULE_SPEC.md §2) ──────
-- Modelo "Gate" (decisão de produto): a reunião de fechamento com Alberto acontece ANTES
-- da conversão lead→organização, então organizacao_id ainda não existe nesse momento —
-- deixa de ser NOT NULL para permitir reuniões vinculadas só a um lead.
ALTER TABLE public.reunioes ALTER COLUMN organizacao_id DROP NOT NULL;

ALTER TABLE public.reunioes
  ADD COLUMN lead_id uuid REFERENCES public.prospeccao_leads(id) ON DELETE SET NULL,
  ADD COLUMN representante_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT reunioes_organizacao_ou_lead_chk
    CHECK (organizacao_id IS NOT NULL OR lead_id IS NOT NULL);

CREATE INDEX idx_reunioes_lead ON public.reunioes(lead_id) WHERE lead_id IS NOT NULL;

-- Representante precisa ver/gerenciar as reuniões de fechamento que ele próprio gerou,
-- mesmo não sendo consultor alocado à organização (a reunião ainda não tem organizacao_id
-- de um cliente real — é do lead). Complementa as policies já existentes em `reunioes`
-- (Members/Allocated consultors/Admins), sem alterá-las.
CREATE POLICY "Representantes veem reunioes dos proprios leads" ON public.reunioes
FOR SELECT
USING (
  public.is_representante(auth.uid()) AND representante_id = auth.uid()
);

CREATE POLICY "Representantes gerenciam reunioes dos proprios leads" ON public.reunioes
FOR ALL
USING (
  public.is_representante(auth.uid()) AND representante_id = auth.uid()
)
WITH CHECK (
  public.is_representante(auth.uid()) AND representante_id = auth.uid()
);
