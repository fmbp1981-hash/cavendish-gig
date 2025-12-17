
-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- =====================================================

-- Trigger para organizacoes
DROP TRIGGER IF EXISTS update_organizacoes_updated_at ON public.organizacoes;
CREATE TRIGGER update_organizacoes_updated_at
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para projetos
DROP TRIGGER IF EXISTS update_projetos_updated_at ON public.projetos;
CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON public.projetos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para documentos
DROP TRIGGER IF EXISTS update_documentos_updated_at ON public.documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para documentos_requeridos_status
DROP TRIGGER IF EXISTS update_documentos_requeridos_status_updated_at ON public.documentos_requeridos_status;
CREATE TRIGGER update_documentos_requeridos_status_updated_at
  BEFORE UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para organization_members
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organizacao_id ON public.organization_members(organizacao_id);

-- Índices para projetos
CREATE INDEX IF NOT EXISTS idx_projetos_organizacao_id ON public.projetos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_projetos_fase_atual ON public.projetos(fase_atual);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documentos_projeto_id ON public.documentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_organizacao_id ON public.documentos(organizacao_id);

-- Índices para documentos_requeridos
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_projeto_id ON public.documentos_requeridos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_fase ON public.documentos_requeridos(fase);

-- Índices para documentos_requeridos_status
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_status_documento_requerido_id ON public.documentos_requeridos_status(documento_requerido_id);
CREATE INDEX IF NOT EXISTS idx_documentos_requeridos_status_status ON public.documentos_requeridos_status(status);

-- Índices para user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Índices para notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);

-- =====================================================
-- SEED DATA: CATÁLOGO DE DOCUMENTOS
-- =====================================================

INSERT INTO public.documentos_catalogo (nome, descricao, fase, tipo_projeto, obrigatorio, ordem, formatos_aceitos, tamanho_maximo_mb, criterios_aceitacao)
VALUES
  -- Fase Diagnóstico
  ('Contrato Social', 'Contrato social atualizado da empresa', 'diagnostico', 'gig_completo', true, 1, ARRAY['pdf', 'docx'], 50, 'Documento deve estar legível e atualizado'),
  ('Acordo de Sócios', 'Acordo entre sócios, se existente', 'diagnostico', 'gig_completo', false, 2, ARRAY['pdf', 'docx'], 50, 'Se aplicável, incluir todas as páginas assinadas'),
  ('Organograma', 'Estrutura organizacional da empresa', 'diagnostico', 'gig_completo', true, 3, ARRAY['pdf', 'png', 'jpg', 'xlsx'], 20, 'Deve refletir a estrutura atual'),
  ('Lista de Sócios/Acionistas', 'Relação completa de sócios ou acionistas', 'diagnostico', 'gig_completo', true, 4, ARRAY['pdf', 'xlsx', 'docx'], 20, 'Incluir percentual de participação'),
  ('Último Balanço Patrimonial', 'Balanço patrimonial do último exercício', 'diagnostico', 'gig_completo', true, 5, ARRAY['pdf', 'xlsx'], 50, 'Assinado por contador responsável'),
  ('DRE', 'Demonstração de Resultado do Exercício', 'diagnostico', 'gig_completo', true, 6, ARRAY['pdf', 'xlsx'], 50, 'Do último exercício fiscal'),
  ('Lista de Funcionários', 'Relação de colaboradores da empresa', 'diagnostico', 'gig_completo', true, 7, ARRAY['pdf', 'xlsx'], 20, 'Incluir nome, cargo e departamento'),
  ('Políticas Existentes', 'Políticas internas já implementadas', 'diagnostico', 'gig_completo', false, 8, ARRAY['pdf', 'docx'], 100, 'Se existentes, incluir todas as políticas vigentes'),
  
  -- Fase Implementação
  ('Logo da Empresa', 'Logotipo em alta resolução', 'implementacao', 'gig_completo', true, 1, ARRAY['png', 'jpg', 'svg', 'pdf'], 20, 'Preferencialmente em formato vetorial'),
  ('Missão, Visão e Valores', 'Documento com MVV da empresa', 'implementacao', 'gig_completo', true, 2, ARRAY['pdf', 'docx'], 10, 'Texto aprovado pela diretoria'),
  ('Fotos da Diretoria', 'Fotos profissionais dos diretores', 'implementacao', 'gig_completo', false, 3, ARRAY['png', 'jpg'], 50, 'Alta resolução, fundo neutro'),
  ('Assinaturas Digitalizadas', 'Assinaturas dos diretores para documentos', 'implementacao', 'gig_completo', false, 4, ARRAY['png', 'jpg'], 10, 'Fundo transparente ou branco')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÃO PARA CRIAR DOCUMENTOS REQUERIDOS AO CRIAR PROJETO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_required_documents_for_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir documentos requeridos baseados no catálogo
  INSERT INTO public.documentos_requeridos (
    projeto_id, catalogo_id, nome, descricao, fase, obrigatorio,
    formatos_aceitos, tamanho_maximo_mb, criterios_aceitacao, template_url
  )
  SELECT
    NEW.id,
    dc.id,
    dc.nome,
    dc.descricao,
    dc.fase,
    dc.obrigatorio,
    dc.formatos_aceitos,
    dc.tamanho_maximo_mb,
    dc.criterios_aceitacao,
    dc.template_url
  FROM public.documentos_catalogo dc
  WHERE dc.tipo_projeto = NEW.tipo;

  -- Criar status inicial para cada documento requerido
  INSERT INTO public.documentos_requeridos_status (documento_requerido_id, status)
  SELECT dr.id, 'pendente'
  FROM public.documentos_requeridos dr
  WHERE dr.projeto_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger para criar documentos requeridos ao criar projeto
DROP TRIGGER IF EXISTS on_project_created ON public.projetos;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projetos
  FOR EACH ROW
  EXECUTE FUNCTION public.create_required_documents_for_project();

-- =====================================================
-- FUNÇÃO PARA CRIAR NOTIFICAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notificacoes (user_id, tipo, titulo, mensagem, metadata)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- =====================================================
-- TRIGGER PARA NOTIFICAR CONSULTOR QUANDO DOCUMENTO É ENVIADO
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_documento_nome text;
  v_organizacao_nome text;
  v_projeto_id uuid;
  v_organizacao_id uuid;
  v_client_user_id uuid;
  v_consultor record;
BEGIN
  -- Buscar informações do documento
  SELECT dr.nome, dr.projeto_id INTO v_documento_nome, v_projeto_id
  FROM public.documentos_requeridos dr
  WHERE dr.id = NEW.documento_requerido_id;

  -- Buscar organização do projeto
  SELECT p.organizacao_id INTO v_organizacao_id
  FROM public.projetos p
  WHERE p.id = v_projeto_id;

  SELECT o.nome INTO v_organizacao_nome
  FROM public.organizacoes o
  WHERE o.id = v_organizacao_id;

  -- Se documento foi enviado, notificar consultores
  IF NEW.status = 'enviado' AND (OLD.status IS NULL OR OLD.status != 'enviado') THEN
    FOR v_consultor IN 
      SELECT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role IN ('consultor', 'admin')
    LOOP
      PERFORM public.create_notification(
        v_consultor.user_id,
        'documento_enviado',
        'Novo documento enviado',
        format('O documento "%s" foi enviado por %s', v_documento_nome, v_organizacao_nome),
        jsonb_build_object('documento_requerido_id', NEW.documento_requerido_id, 'projeto_id', v_projeto_id)
      );
    END LOOP;
  END IF;

  -- Se documento foi aprovado ou rejeitado, notificar cliente
  IF NEW.status IN ('aprovado', 'rejeitado') AND OLD.status != NEW.status THEN
    FOR v_client_user_id IN
      SELECT om.user_id
      FROM public.organization_members om
      WHERE om.organizacao_id = v_organizacao_id
    LOOP
      IF NEW.status = 'aprovado' THEN
        PERFORM public.create_notification(
          v_client_user_id,
          'documento_aprovado',
          'Documento aprovado',
          format('O documento "%s" foi aprovado', v_documento_nome),
          jsonb_build_object('documento_requerido_id', NEW.documento_requerido_id)
        );
      ELSE
        PERFORM public.create_notification(
          v_client_user_id,
          'documento_rejeitado',
          'Documento rejeitado',
          format('O documento "%s" foi rejeitado. Motivo: %s', v_documento_nome, COALESCE(NEW.observacao_rejeicao, 'Não especificado')),
          jsonb_build_object('documento_requerido_id', NEW.documento_requerido_id, 'observacao', NEW.observacao_rejeicao)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_document_status_change ON public.documentos_requeridos_status;
CREATE TRIGGER on_document_status_change
  AFTER INSERT OR UPDATE ON public.documentos_requeridos_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_document_status_change();

-- =====================================================
-- RLS POLICY PARA INSERIR NOTIFICAÇÕES (SISTEMA)
-- =====================================================

CREATE POLICY "System can insert notifications"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- HABILITAR REALTIME PARA TABELAS IMPORTANTES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documentos_requeridos_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projetos;

-- =====================================================
-- FUNÇÃO PARA ESTATÍSTICAS DO PROJETO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_project_stats(p_projeto_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_aprovados integer;
  v_enviados integer;
  v_pendentes integer;
  v_rejeitados integer;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE drs.status = 'aprovado'),
    COUNT(*) FILTER (WHERE drs.status = 'enviado'),
    COUNT(*) FILTER (WHERE drs.status = 'pendente'),
    COUNT(*) FILTER (WHERE drs.status = 'rejeitado')
  INTO v_total, v_aprovados, v_enviados, v_pendentes, v_rejeitados
  FROM public.documentos_requeridos dr
  LEFT JOIN public.documentos_requeridos_status drs ON drs.documento_requerido_id = dr.id
  WHERE dr.projeto_id = p_projeto_id;

  RETURN jsonb_build_object(
    'total', v_total,
    'aprovados', v_aprovados,
    'enviados', v_enviados,
    'pendentes', v_pendentes,
    'rejeitados', v_rejeitados,
    'percentual_aprovado', CASE WHEN v_total > 0 THEN ROUND((v_aprovados::numeric / v_total) * 100, 2) ELSE 0 END
  );
END;
$$;
