-- Item 2 (Onda 3) — Feature flag de provedor de armazenamento por organização
-- Permite migração gradual de Supabase Storage → OneDrive (ou manter ambos)

ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'onedrive'
    CHECK (storage_provider IN ('onedrive', 'supabase'));

COMMENT ON COLUMN public.organizacoes.storage_provider IS
  'Provedor de armazenamento para documentos da organização: onedrive (padrão) ou supabase';
