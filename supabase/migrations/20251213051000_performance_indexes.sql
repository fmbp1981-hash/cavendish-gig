-- =============================================
-- Migration: Performance Optimization with Strategic Indexes
-- =============================================

-- 1. Documentos - Queries by organization and project
CREATE INDEX IF NOT EXISTS idx_documentos_org_id
ON public.documentos(organizacao_id)
WHERE organizacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_projeto_id
ON public.documentos(projeto_id)
WHERE projeto_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_uploaded_by
ON public.documentos(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_documentos_created_at
ON public.documentos(created_at DESC);

-- 2. Documentos Requeridos Status - Most queried table
CREATE INDEX IF NOT EXISTS idx_doc_req_status_doc_req_id
ON public.documentos_requeridos_status(documento_requerido_id);

CREATE INDEX IF NOT EXISTS idx_doc_req_status_status
ON public.documentos_requeridos_status(status);

CREATE INDEX IF NOT EXISTS idx_doc_req_status_pending
ON public.documentos_requeridos_status(documento_requerido_id)
WHERE status = 'pendente';

CREATE INDEX IF NOT EXISTS idx_doc_req_status_enviado
ON public.documentos_requeridos_status(documento_requerido_id)
WHERE status = 'enviado';

-- 3. Tarefas - Status and deadline queries
CREATE INDEX IF NOT EXISTS idx_tarefas_org_id
ON public.tarefas(organizacao_id)
WHERE organizacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_projeto_id
ON public.tarefas(projeto_id)
WHERE projeto_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_status
ON public.tarefas(status);

CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel
ON public.tarefas(responsavel_id)
WHERE responsavel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_prazo
ON public.tarefas(prazo)
WHERE prazo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_status_prazo
ON public.tarefas(status, prazo)
WHERE prazo IS NOT NULL;

-- 4. Notificações - Unread queries
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id
ON public.notificacoes(user_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_unread
ON public.notificacoes(user_id, created_at DESC)
WHERE NOT lida;

CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at
ON public.notificacoes(created_at DESC);

-- 5. Organization Members - Role queries
CREATE INDEX IF NOT EXISTS idx_org_members_org_id
ON public.organization_members(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_org_members_role
ON public.organization_members(organizacao_id, role);

-- 6. Projetos - Organization queries
CREATE INDEX IF NOT EXISTS idx_projetos_org_id
ON public.projetos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_projetos_fase
ON public.projetos(fase_atual);

CREATE INDEX IF NOT EXISTS idx_projetos_tipo
ON public.projetos(tipo);

CREATE INDEX IF NOT EXISTS idx_projetos_org_fase
ON public.projetos(organizacao_id, fase_atual);

-- 7. Treinamentos - Active and mandatory queries
CREATE INDEX IF NOT EXISTS idx_treinamentos_ativo
ON public.treinamentos(ativo)
WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_treinamentos_obrigatorio
ON public.treinamentos(obrigatorio, ativo)
WHERE ativo = true;

-- 8. Treinamento Inscrições - User and status queries
CREATE INDEX IF NOT EXISTS idx_treinamento_inscricoes_user
ON public.treinamento_inscricoes(user_id);

CREATE INDEX IF NOT EXISTS idx_treinamento_inscricoes_org
ON public.treinamento_inscricoes(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_treinamento_inscricoes_status
ON public.treinamento_inscricoes(user_id, status);

CREATE INDEX IF NOT EXISTS idx_treinamento_inscricoes_concluido
ON public.treinamento_inscricoes(user_id, treinamento_id)
WHERE status = 'concluido';

-- 9. Denúncias - Status and date queries
CREATE INDEX IF NOT EXISTS idx_denuncias_status
ON public.denuncias(status);

CREATE INDEX IF NOT EXISTS idx_denuncias_org_id
ON public.denuncias(organizacao_id)
WHERE organizacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_denuncias_created_at
ON public.denuncias(created_at DESC);

-- 10. AI Generations - Type and status queries
CREATE INDEX IF NOT EXISTS idx_ai_generations_tipo
ON public.ai_generations(tipo);

CREATE INDEX IF NOT EXISTS idx_ai_generations_status
ON public.ai_generations(status);

CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at
ON public.ai_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id
ON public.ai_generations(user_id)
WHERE user_id IS NOT NULL;

-- 11. Código de Ética Adesões - Organization queries
CREATE INDEX IF NOT EXISTS idx_codigo_etica_adesoes_org
ON public.codigo_etica_adesoes(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_codigo_etica_adesoes_user
ON public.codigo_etica_adesoes(user_id);

-- 12. User Roles - Role lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role
ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
ON public.user_roles(user_id, role);

-- 13. Documentos Requeridos - Project and phase queries
CREATE INDEX IF NOT EXISTS idx_doc_requeridos_projeto
ON public.documentos_requeridos(projeto_id);

CREATE INDEX IF NOT EXISTS idx_doc_requeridos_fase
ON public.documentos_requeridos(fase);

CREATE INDEX IF NOT EXISTS idx_doc_requeridos_obrigatorio
ON public.documentos_requeridos(obrigatorio);

-- =============================================
-- ANALYZE tables to update statistics
-- =============================================
ANALYZE public.documentos;
ANALYZE public.documentos_requeridos_status;
ANALYZE public.tarefas;
ANALYZE public.notificacoes;
ANALYZE public.organization_members;
ANALYZE public.projetos;
ANALYZE public.treinamentos;
ANALYZE public.treinamento_inscricoes;
ANALYZE public.denuncias;
ANALYZE public.ai_generations;

-- =============================================
-- Comments for documentation
-- =============================================
COMMENT ON INDEX idx_documentos_org_id IS 'Optimize queries filtering documents by organization';
COMMENT ON INDEX idx_notificacoes_unread IS 'Optimize unread notifications query for notification bell';
COMMENT ON INDEX idx_tarefas_status_prazo IS 'Optimize task list queries with status and deadline filters';
COMMENT ON INDEX idx_treinamento_inscricoes_concluido IS 'Optimize completed trainings lookup for certificates';
