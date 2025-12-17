-- =============================================
-- Migration: Sistema de Templates Editáveis de Documentos
-- Descrição: Biblioteca de templates reutilizáveis com variáveis dinâmicas
-- =============================================

-- 1. Criar ENUM para categorias de templates
DO $$ BEGIN
  CREATE TYPE template_categoria AS ENUM (
    'codigo_etica',
    'politica',
    'procedimento',
    'manual',
    'relatorio',
    'contrato',
    'termo',
    'outro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar ENUM para status de template
DO $$ BEGIN
  CREATE TYPE template_status AS ENUM ('rascunho', 'ativo', 'arquivado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabela principal de templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informações básicas
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria template_categoria NOT NULL,
  status template_status NOT NULL DEFAULT 'rascunho',

  -- Conteúdo do template
  conteudo TEXT NOT NULL, -- HTML ou Markdown
  formato TEXT NOT NULL DEFAULT 'html', -- 'html' ou 'markdown'

  -- Variáveis disponíveis (JSON array)
  variaveis_disponiveis JSONB DEFAULT '[]'::jsonb,

  -- Preview/Thumbnail
  thumbnail_url TEXT,

  -- Metadados
  tags TEXT[] DEFAULT '{}',
  versao INTEGER NOT NULL DEFAULT 1,
  usado_count INTEGER DEFAULT 0, -- Contador de usos

  -- Permissões
  is_publico BOOLEAN DEFAULT true, -- Se todos podem usar
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de versões de templates
CREATE TABLE IF NOT EXISTS public.template_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,

  -- Snapshot do conteúdo
  conteudo TEXT NOT NULL,
  formato TEXT NOT NULL,
  variaveis_disponiveis JSONB,

  -- Metadados da versão
  change_description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(template_id, versao)
);

-- 5. Tabela de documentos gerados a partir de templates
CREATE TABLE IF NOT EXISTS public.documentos_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
  documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE,

  -- Dados usados para gerar
  variaveis_utilizadas JSONB NOT NULL,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Auditoria
  gerado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gerado_em TIMESTAMPTZ DEFAULT now()
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_templates_categoria
ON public.templates(categoria);

CREATE INDEX IF NOT EXISTS idx_templates_status
ON public.templates(status);

CREATE INDEX IF NOT EXISTS idx_templates_publico
ON public.templates(is_publico)
WHERE is_publico = true;

CREATE INDEX IF NOT EXISTS idx_templates_created_by
ON public.templates(created_by);

CREATE INDEX IF NOT EXISTS idx_templates_tags
ON public.templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_template_versoes_template
ON public.template_versoes(template_id, versao DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_gerados_template
ON public.documentos_gerados(template_id);

CREATE INDEX IF NOT EXISTS idx_documentos_gerados_org
ON public.documentos_gerados(organizacao_id);

-- 7. Função para criar nova versão de template
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar versão se conteúdo mudou
  IF OLD.conteudo IS DISTINCT FROM NEW.conteudo THEN
    -- Incrementar versão
    NEW.versao := OLD.versao + 1;

    -- Salvar versão anterior
    INSERT INTO public.template_versoes (
      template_id,
      versao,
      conteudo,
      formato,
      variaveis_disponiveis,
      change_description,
      created_by
    ) VALUES (
      OLD.id,
      OLD.versao,
      OLD.conteudo,
      OLD.formato,
      OLD.variaveis_disponiveis,
      'Versão anterior salva automaticamente',
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_template_version ON public.templates;
CREATE TRIGGER trigger_create_template_version
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- 8. Função para renderizar template com variáveis
CREATE OR REPLACE FUNCTION render_template(
  p_template_id UUID,
  p_variaveis JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_template RECORD;
  v_conteudo TEXT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Buscar template
  SELECT * INTO v_template
  FROM public.templates
  WHERE id = p_template_id
    AND status = 'ativo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template não encontrado ou inativo';
  END IF;

  -- Iniciar com conteúdo original
  v_conteudo := v_template.conteudo;

  -- Substituir cada variável
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variaveis)
  LOOP
    v_conteudo := REPLACE(v_conteudo, '{{' || v_key || '}}', v_value);
  END LOOP;

  -- Incrementar contador de uso
  UPDATE public.templates
  SET usado_count = usado_count + 1
  WHERE id = p_template_id;

  RETURN v_conteudo;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para extrair variáveis de um template
CREATE OR REPLACE FUNCTION extract_template_variables(p_conteudo TEXT)
RETURNS TEXT[] AS $$
DECLARE
  v_variaveis TEXT[];
BEGIN
  -- Regex para encontrar {{variavel}}
  SELECT ARRAY_AGG(DISTINCT matches[1])
  INTO v_variaveis
  FROM regexp_matches(p_conteudo, '\{\{([a-zA-Z0-9._]+)\}\}', 'g') AS matches;

  RETURN COALESCE(v_variaveis, '{}');
END;
$$ LANGUAGE plpgsql;

-- 10. Função para validar template
CREATE OR REPLACE FUNCTION validate_template(p_template_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_template RECORD;
  v_variaveis TEXT[];
  v_erros TEXT[] := '{}';
  v_avisos TEXT[] := '{}';
BEGIN
  SELECT * INTO v_template
  FROM public.templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false, 'erro', 'Template não encontrado');
  END IF;

  -- Extrair variáveis usadas
  v_variaveis := extract_template_variables(v_template.conteudo);

  -- Verificar se conteúdo não está vazio
  IF LENGTH(TRIM(v_template.conteudo)) < 10 THEN
    v_erros := array_append(v_erros, 'Conteúdo muito curto');
  END IF;

  -- Verificar se tem nome
  IF LENGTH(TRIM(v_template.nome)) < 3 THEN
    v_erros := array_append(v_erros, 'Nome muito curto');
  END IF;

  -- Avisos
  IF array_length(v_variaveis, 1) IS NULL THEN
    v_avisos := array_append(v_avisos, 'Template não possui variáveis dinâmicas');
  END IF;

  RETURN jsonb_build_object(
    'valido', array_length(v_erros, 1) IS NULL,
    'erros', v_erros,
    'avisos', v_avisos,
    'variaveis_encontradas', v_variaveis
  );
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_templates_updated_at ON public.templates;
CREATE TRIGGER trigger_update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- 12. RLS Policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_gerados ENABLE ROW LEVEL SECURITY;

-- Templates: Ver públicos ou próprios
DROP POLICY IF EXISTS "Ver templates públicos ou próprios" ON public.templates;
CREATE POLICY "Ver templates públicos ou próprios"
ON public.templates
FOR SELECT
USING (
  is_publico = true
  OR
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'consultor')
  )
);

-- Templates: Criar (Admin/Consultor)
DROP POLICY IF EXISTS "Admin e Consultor podem criar templates" ON public.templates;
CREATE POLICY "Admin e Consultor podem criar templates"
ON public.templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'consultor')
  )
);

-- Templates: Atualizar próprios ou Admin
DROP POLICY IF EXISTS "Atualizar próprios templates ou Admin" ON public.templates;
CREATE POLICY "Atualizar próprios templates ou Admin"
ON public.templates
FOR UPDATE
USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Template Versões: Ver versões de templates acessíveis
DROP POLICY IF EXISTS "Ver versões de templates acessíveis" ON public.template_versoes;
CREATE POLICY "Ver versões de templates acessíveis"
ON public.template_versoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.templates t
    WHERE t.id = template_versoes.template_id
    AND (
      t.is_publico = true
      OR t.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'consultor')
      )
    )
  )
);

-- Documentos Gerados: Ver própria organização ou Admin
DROP POLICY IF EXISTS "Ver documentos gerados" ON public.documentos_gerados;
CREATE POLICY "Ver documentos gerados"
ON public.documentos_gerados
FOR SELECT
USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.profiles
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'consultor')
  )
);

-- 13. View para templates populares
CREATE OR REPLACE VIEW public.templates_populares AS
SELECT
  t.id,
  t.nome,
  t.descricao,
  t.categoria,
  t.usado_count,
  t.tags,
  p.nome as created_by_name,
  COUNT(DISTINCT dg.id) as documentos_gerados_count
FROM public.templates t
LEFT JOIN public.profiles p ON p.id = t.created_by
LEFT JOIN public.documentos_gerados dg ON dg.template_id = t.id
WHERE t.status = 'ativo'
  AND t.is_publico = true
GROUP BY t.id, p.nome
ORDER BY t.usado_count DESC;

GRANT SELECT ON public.templates_populares TO authenticated;

-- 14. Comentários para documentação
COMMENT ON TABLE public.templates IS 'Biblioteca de templates editáveis de documentos com variáveis dinâmicas';
COMMENT ON COLUMN public.templates.conteudo IS 'Conteúdo HTML ou Markdown com variáveis no formato {{variavel}}';
COMMENT ON COLUMN public.templates.variaveis_disponiveis IS 'Lista de variáveis que podem ser usadas neste template';
COMMENT ON COLUMN public.templates.usado_count IS 'Contador de quantas vezes o template foi usado';
COMMENT ON FUNCTION render_template IS 'Renderiza template substituindo variáveis pelos valores fornecidos';
COMMENT ON FUNCTION extract_template_variables IS 'Extrai todas as variáveis {{xxx}} de um conteúdo';
COMMENT ON FUNCTION validate_template IS 'Valida template e retorna erros/avisos';

-- 15. Templates padrão (exemplos)
INSERT INTO public.templates (nome, descricao, categoria, conteudo, formato, status, is_publico, variaveis_disponiveis)
VALUES
(
  'Código de Ética Empresarial',
  'Template padrão para Código de Ética',
  'codigo_etica',
  '<h1>Código de Ética - {{organizacao.nome}}</h1>
<p><strong>Vigência:</strong> {{data.vigencia}}</p>

<h2>1. Introdução</h2>
<p>Este Código de Ética estabelece os princípios e valores da {{organizacao.nome}}, com sede em {{organizacao.cidade}}, {{organizacao.estado}}.</p>

<h2>2. Missão e Valores</h2>
<p>Nossa missão é {{organizacao.missao}}.</p>

<h2>3. Princípios Fundamentais</h2>
<ul>
  <li>Integridade e transparência</li>
  <li>Respeito às pessoas</li>
  <li>Responsabilidade social</li>
  <li>Excelência e qualidade</li>
</ul>

<h2>4. Responsável</h2>
<p>{{responsavel.nome}} - {{responsavel.cargo}}</p>
<p>Email: {{responsavel.email}}</p>',
  'html',
  'ativo',
  true,
  '["organizacao.nome", "organizacao.cidade", "organizacao.estado", "organizacao.missao", "data.vigencia", "responsavel.nome", "responsavel.cargo", "responsavel.email"]'::jsonb
),
(
  'Política de Privacidade',
  'Template para Política de Privacidade LGPD',
  'politica',
  '<h1>Política de Privacidade - {{organizacao.nome}}</h1>
<p><em>Última atualização: {{data.atualizacao}}</em></p>

<h2>1. Coleta de Dados</h2>
<p>A {{organizacao.nome}} coleta os seguintes dados pessoais:</p>
<ul>
  <li>Nome completo</li>
  <li>Email</li>
  <li>Telefone</li>
</ul>

<h2>2. Uso dos Dados</h2>
<p>Os dados coletados são utilizados para {{finalidade.uso}}.</p>

<h2>3. Compartilhamento</h2>
<p>Não compartilhamos seus dados com terceiros, exceto {{excecoes.compartilhamento}}.</p>

<h2>4. Seus Direitos</h2>
<p>Você tem direito a acessar, corrigir e excluir seus dados.</p>

<h2>5. Contato DPO</h2>
<p>{{dpo.nome}} - {{dpo.email}}</p>',
  'html',
  'ativo',
  true,
  '["organizacao.nome", "data.atualizacao", "finalidade.uso", "excecoes.compartilhamento", "dpo.nome", "dpo.email"]'::jsonb
);

-- 16. ANALYZE
ANALYZE public.templates;
ANALYZE public.template_versoes;
ANALYZE public.documentos_gerados;

-- Success message
SELECT '✅ Sistema de templates editáveis criado com sucesso!' AS status;
