-- =============================================================
-- Cavendish GIG - Integrations Vault + Tenant Branding + Kanban ordering
-- Date: 2025-12-22
-- =============================================================

-- 1) Kanban ordering for tarefas
ALTER TABLE public.tarefas
ADD COLUMN IF NOT EXISTS kanban_order DOUBLE PRECISION NOT NULL DEFAULT (extract(epoch from now()));

UPDATE public.tarefas
SET kanban_order = extract(epoch from created_at)
WHERE kanban_order IS NULL OR kanban_order = 0;

CREATE INDEX IF NOT EXISTS idx_tarefas_org_status_order
ON public.tarefas (organizacao_id, status, kanban_order);

-- 2) Tenant branding (white-label preparation)
CREATE TABLE IF NOT EXISTS public.tenant_branding (
  organizacao_id UUID PRIMARY KEY REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  company_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_hsl TEXT NOT NULL DEFAULT '209 89% 40%',
  secondary_hsl TEXT NOT NULL DEFAULT '134 61% 41%',
  accent_hsl TEXT NOT NULL DEFAULT '43 100% 44%',
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their tenant branding"
ON public.tenant_branding
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.organizacao_id = tenant_branding.organizacao_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'consultor'::app_role) AND EXISTS (
      SELECT 1 FROM public.consultor_organizacoes co
      WHERE co.consultor_id = auth.uid() AND co.organizacao_id = tenant_branding.organizacao_id
    )
  )
);

CREATE POLICY "Admins and consultants can manage tenant branding"
ON public.tenant_branding
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'consultor'::app_role) AND EXISTS (
      SELECT 1 FROM public.consultor_organizacoes co
      WHERE co.consultor_id = auth.uid() AND co.organizacao_id = tenant_branding.organizacao_id
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'consultor'::app_role) AND EXISTS (
      SELECT 1 FROM public.consultor_organizacoes co
      WHERE co.consultor_id = auth.uid() AND co.organizacao_id = tenant_branding.organizacao_id
    )
  )
);

CREATE TRIGGER update_tenant_branding_updated_at
BEFORE UPDATE ON public.tenant_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Integrations vault table (secrets encrypted and accessed only via Edge Functions)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'system' CHECK (scope IN ('system', 'organization')),
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secrets_encrypted TEXT,
  secrets_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (scope, organizacao_id, provider)
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Intentionally no RLS policies: integrations should be accessed only via Edge Functions
-- using the service role key. Client-side direct access is blocked by RLS.

CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
