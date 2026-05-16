-- Item 1: Menu Biblioteca para Admin/Consultor
-- Repositório de arquivos modelo (templates físicos) para consultores baixarem

CREATE TABLE public.biblioteca_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.biblioteca_arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.biblioteca_categorias(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  formato TEXT NOT NULL,
  tamanho_bytes BIGINT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  download_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biblioteca_arquivos_categoria ON public.biblioteca_arquivos(categoria_id);
CREATE INDEX idx_biblioteca_arquivos_tags ON public.biblioteca_arquivos USING GIN(tags);
CREATE INDEX idx_biblioteca_arquivos_formato ON public.biblioteca_arquivos(formato);

ALTER TABLE public.biblioteca_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca_arquivos ENABLE ROW LEVEL SECURITY;

-- Admin: CRUD completo
CREATE POLICY "Admins manage biblioteca arquivos"
ON public.biblioteca_arquivos FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins manage biblioteca categorias"
ON public.biblioteca_categorias FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Consultor: somente leitura
CREATE POLICY "Consultors view biblioteca arquivos"
ON public.biblioteca_arquivos FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'consultor')
);

CREATE POLICY "Consultors view biblioteca categorias"
ON public.biblioteca_categorias FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'consultor')
);

-- Trigger updated_at
CREATE TRIGGER set_biblioteca_arquivos_updated_at
  BEFORE UPDATE ON public.biblioteca_arquivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Categorias iniciais
INSERT INTO public.biblioteca_categorias (nome, descricao, ordem) VALUES
  ('Códigos de Ética',       'Modelos de códigos de ética e conduta',    1),
  ('Políticas Corporativas', 'Modelos de políticas internas',            2),
  ('Procedimentos',          'POPs e procedimentos operacionais',         3),
  ('Atas',                   'Modelos de atas de reunião',               4),
  ('Relatórios',             'Templates de relatórios',                  5),
  ('Termos',                 'Termos e declarações',                     6),
  ('Manuais',                'Manuais e guias',                          7),
  ('Outros',                 'Documentos diversos',                      99);
