-- Item 5: Documentos Complementares
-- Consultores podem solicitar documentos opcionais para um cliente, fora do fluxo obrigatório.

-- 1. Flag no catálogo — marca templates como complementares/opcionais
ALTER TABLE public.documentos_catalogo
ADD COLUMN IF NOT EXISTS is_complementar BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_catalogo_complementar
ON public.documentos_catalogo(is_complementar);

COMMENT ON COLUMN public.documentos_catalogo.is_complementar IS
'Quando TRUE, o item pode ser solicitado pelo consultor como documento opcional ao cliente';

-- 2. Flag em documentos_requeridos — indica se é complementar/opcional
ALTER TABLE public.documentos_requeridos
ADD COLUMN IF NOT EXISTS is_complementar BOOLEAN DEFAULT FALSE;

-- Quem solicitou (para docs complementares ad-hoc)
ALTER TABLE public.documentos_requeridos
ADD COLUMN IF NOT EXISTS solicitado_por UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_requeridos_complementar
ON public.documentos_requeridos(is_complementar);

COMMENT ON COLUMN public.documentos_requeridos.is_complementar IS
'TRUE = solicitado pelo consultor como complementar; não bloqueia progresso da fase';

COMMENT ON COLUMN public.documentos_requeridos.solicitado_por IS
'Consultor ou admin que solicitou o documento complementar';
