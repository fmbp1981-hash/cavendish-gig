-- Módulo Finder: importação de leads ganha suporte a PDF, TXT e DOCX além de CSV/XLSX (pedido do
-- usuário). O CHECK original só permitia 'csv'/'xlsx' — precisa ser recriado com a lista ampliada
-- (Postgres não tem "ALTER CHECK", só dropar e recriar).

ALTER TABLE public.prospeccao_importacoes
  DROP CONSTRAINT IF EXISTS prospeccao_importacoes_formato_check;

ALTER TABLE public.prospeccao_importacoes
  ADD CONSTRAINT prospeccao_importacoes_formato_check
    CHECK (formato IN ('csv', 'xlsx', 'pdf', 'txt', 'docx'));
