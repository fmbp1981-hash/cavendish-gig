-- =============================================================
-- Cavendish GIG - Integration Sync Table
-- Date: 2025-12-27
-- PRD: Optional external tool integrations (Trello/ClickUp)
-- =============================================================

-- Table to track entity mappings between internal entities and external services
CREATE TABLE IF NOT EXISTS public.integration_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Integration type
  integration_type TEXT NOT NULL, -- 'trello', 'clickup', etc.
  
  -- Internal entity reference
  entity_type TEXT NOT NULL, -- 'tarefa', 'documento', 'projeto', etc.
  entity_id UUID NOT NULL,
  
  -- External entity reference
  external_id TEXT NOT NULL,
  external_url TEXT,
  
  -- Organization context
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_direction TEXT DEFAULT 'bidirectional', -- 'push', 'pull', 'bidirectional'
  sync_errors TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one external mapping per entity per integration
  CONSTRAINT unique_sync_mapping UNIQUE (integration_type, entity_type, entity_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_integration_sync_org 
ON public.integration_sync(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_integration_sync_entity 
ON public.integration_sync(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_integration_sync_external 
ON public.integration_sync(integration_type, external_id);

-- Enable RLS
ALTER TABLE public.integration_sync ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can see all sync records
CREATE POLICY "Admins can view all sync records"
ON public.integration_sync
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Consultors can see sync records for their organizations
CREATE POLICY "Consultors can view their org sync records"
ON public.integration_sync
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultor'::public.app_role)
  AND (
    organizacao_id IS NULL 
    OR organizacao_id IN (
      SELECT om.organizacao_id 
      FROM public.organization_members om 
      WHERE om.user_id = auth.uid()
    )
  )
);

-- Service role can manage all (used by Edge Functions)
CREATE POLICY "Service role can manage sync records"
ON public.integration_sync
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_integration_sync_updated_at
BEFORE UPDATE ON public.integration_sync
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_integration_sync ON public.integration_sync;
CREATE TRIGGER audit_integration_sync
AFTER INSERT OR UPDATE OR DELETE ON public.integration_sync
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
