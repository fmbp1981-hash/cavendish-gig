# SISTEMA_TECNICO.md — Sistema GIG (Cavendish)
> Documento vivo de contexto técnico completo. Atualizar a cada modificação, feature, fix ou decisão relevante.

**Última atualização:** 2026-03-09 (AgenteChat messages array · Tour X button · cross-page tour session · AIProviderSelector UX fix · Seção 16 Análise Competitiva GRC adicionada · Pendências atualizadas com gaps de mercado)
**Versão do sistema:** 0.0.0 (pre-release)
**Desenvolvido por:** IntelliX.AI

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Escopo e Posicionamento](#2-escopo-e-posicionamento)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Arquitetura do Sistema](#4-arquitetura-do-sistema)
5. [Banco de Dados](#5-banco-de-dados)
6. [Autenticação e Autorização](#6-autenticação-e-autorização)
7. [Módulos e Funcionalidades](#7-módulos-e-funcionalidades)
8. [Edge Functions (Backend)](#8-edge-functions-backend)
9. [Integrações Externas](#9-integrações-externas)
10. [Estrutura de Arquivos](#10-estrutura-de-arquivos)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Deploy e Infraestrutura](#12-deploy-e-infraestrutura)
13. [Histórico de Implementações](#13-histórico-de-implementações)
14. [Bugs Corrigidos](#14-bugs-corrigidos)
15. [Pendências e Roadmap](#15-pendências-e-roadmap)
16. [Análise Competitiva — Mercado GRC](#16-análise-competitiva--mercado-grc-atualizado-2026-03-09)
17. [Decisões de Arquitetura](#17-decisões-de-arquitetura)

---

## 1. Visão Geral do Produto

O **Sistema GIG** (Gestão Integrada de Governança) é uma plataforma SaaS/white-label desenvolvida pela **IntelliX.AI** para a **Cavendish Consultoria Empresarial**, com o objetivo de operacionalizar programas de **Governança, Integridade e Compliance** em PMEs.

### Proposta de valor
- Automatiza diagnósticos de maturidade em compliance
- Gera documentos oficiais (Código de Ética, Políticas) com IA
- Centraliza documentos, treinamentos e evidências de conformidade
- Fornece canal de denúncias anônimo e rastreável
- Emite relatórios mensais de evolução do programa
- Cria atas de reunião automaticamente via IA + transcrição

### Clientes finais
- Organizações (PMEs) que contratam a consultoria da Cavendish
- Cada organização é um **tenant** isolado por Row Level Security no banco

---

## 2. Escopo e Posicionamento

### Papéis no produto
| Papel | Quem é | Acesso |
|-------|--------|--------|
| **IntelliX.AI** | Empresa desenvolvedora | Infraestrutura, deploy |
| **Cavendish** | Cliente da IntelliX, operador do sistema | Role `admin` |
| **Consultor** | Funcionário/parceiro da Cavendish | Role `consultor` |
| **Parceiro** | Empresa associada | Role `parceiro` |
| **Cliente** | PME contratante da Cavendish | Role `cliente` |

### Planos disponíveis
| Plano | Features |
|-------|---------|
| **Essencial** | Diagnóstico, Código de Ética, Canal de Denúncias, Treinamentos |
| **Executivo** | Essencial + IA avançada, relatórios, agendamento |
| **Premium** | Executivo + Google Drive, branding white-label, Fireflies, WhatsApp |

### Fora do escopo
- Apps mobile nativos (web responsivo apenas)
- Gestão de folha de pagamento / ERP
- SSO corporativo (SAML/OAuth2 enterprise) — pendente
- Processamento de áudio proprietário

---

## 3. Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 15.x | Framework principal (App Router) |
| React | 18.3 | UI |
| TypeScript | 5.8 | Tipagem |
| Tailwind CSS | 3.4 | Estilização |
| shadcn/ui | — | Componentes base (Radix UI) |
| TanStack Query | 5.x | Cache e estado servidor |
| React Router DOM | 6.x | Roteamento SPA interno |
| React Hook Form | 7.x | Formulários |
| Zod | 3.x | Validação de schemas |
| Recharts | 2.x | Gráficos |
| @dnd-kit | 6/10 | Drag-and-drop (Kanban) |
| jsPDF + html2canvas | — | Exportação PDF client-side |
| react-pdf / pdfjs-dist | — | Visualização PDF |
| date-fns | 3.x | Manipulação de datas |
| react-big-calendar | 1.x | Calendário unificado (ConsultorAgenda) |

### Backend
| Tecnologia | Uso |
|------------|-----|
| Supabase | Banco, Auth, Storage, Edge Functions, Realtime |
| PostgreSQL 15 | Banco de dados principal |
| Deno (Edge Functions) | Serverless backend |
| Row Level Security (RLS) | Isolamento multi-tenant |

### Integrações
| Serviço | Uso |
|---------|-----|
| OpenAI GPT-4 | Geração de documentos, atas, relatórios |
| Google Drive API | Armazenamento de documentos do cliente |
| Google Calendar API | Agendamento de reuniões + Google Meet |
| Resend | Email transacional |
| Twilio | SMS e WhatsApp |
| Fireflies.ai | Transcrição automática de reuniões |

---

## 4. Arquitetura do Sistema

### Padrão híbrido: Next.js App Router + SPA React Router

O sistema usa uma arquitetura híbrida para combinar o build estático do Next.js com uma SPA React roteada internamente:

```
src/app/
├── (app)/auth/page.tsx         ← Página de auth (Next.js, force-dynamic)
├── (spa)/[[...slug]]/page.tsx  ← Catch-all → carrega App.tsx (SPA)
├── consulta-protocolo/         ← Página pública (Next.js)
├── denuncia/                   ← Página pública (Next.js)
├── onboarding/                 ← Onboarding (Next.js)
└── layout.tsx                  ← Root layout
```

O catch-all `[[...slug]]` carrega o `App.tsx` com `dynamic('ssr: false')`, que contém o `BrowserRouter` + todas as rotas React Router. Isso significa:
- SSR desabilitado na SPA (client-only)
- O Next.js gerencia páginas públicas com SSR/SSG
- React Router gerencia a navegação interna autenticada

### Fluxo de autenticação
```
Browser → Next.js (catch-all) → App.tsx (BrowserRouter)
                                     ↓
                               AuthProvider (AuthContext)
                                     ↓
                               onAuthStateChange (Supabase)
                                     ↓
                           fetchUserData(userId) → profiles + user_roles
                                     ↓
                          ProtectedRoute (verifica roles)
                                     ↓
                             Página autenticada
```

### Providers (App.tsx)
```
QueryClientProvider
  └─ AuthProvider
       └─ TenantBrandingProvider
            └─ TooltipProvider
                 └─ BrowserRouter
                      └─ Routes (todas as páginas)
```

---

## 5. Banco de Dados

**Projeto Supabase:** `fenfgjqlsqzvxloeavdc` (nome: Sistema_CCE)
**URL:** `https://fenfgjqlsqzvxloeavdc.supabase.co`
**Config local:** `supabase/config.toml` → `project_id = "fenfgjqlsqzvxloeavdc"`

### ENUMs
```sql
app_role:      admin | consultor | cliente | parceiro
fase_projeto:  diagnostico | implementacao | recorrencia
tipo_projeto:  gig_completo | gig_modular | consultoria_pontual
status_documento: pendente | enviado | em_analise | aprovado | rejeitado
plano_tipo:    essencial | executivo | premium
```

### Tabelas principais
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (nome, email, avatar, organizacao_id) |
| `user_roles` | Papéis RBAC por usuário (N roles por usuário) |
| `organizacoes` | Tenants/clientes (nome, CNPJ, plano, tenant_id, drive_folder_id) |
| `projetos` | Projetos de compliance por organização (fase, tipo) |
| `organization_members` | Associação usuário ↔ organização |
| `consultor_organizacoes` | Associação consultor ↔ organização |
| `documentos` | Documentos enviados pelos clientes |
| `documentos_requeridos` | Catálogo de documentos obrigatórios por tipo de projeto |
| `documentos_requeridos_status` | Status de cada documento requerido por projeto |
| `documento_comentarios` | Comentários/threads em documentos |
| `documento_versoes` | Histórico de versões de documentos |
| `tarefas` | Tarefas (Kanban) com ordenação drag-and-drop |
| `treinamentos` | Módulos de treinamento com quiz |
| `treinamento_inscricoes` | Inscrições e progresso de treinamentos |
| `denuncias` | Denúncias anônimas (canal público) |
| `codigo_etica_adesoes` | Adesão ao Código de Ética por usuário |
| `ai_generations` | Log de gerações de IA (atas, documentos, relatórios) |
| `notificacoes` | Notificações internas do sistema |
| `relatorio_envios` | Log de envios de relatórios mensais |
| `audit_logs` | Logs de auditoria imutáveis (append-only) |
| `plano_config` | Configuração de features por plano |
| `templates` | Biblioteca de templates de documentos |
| `tenant_branding` | Customização visual por organização (white-label) |
| `integrations_vault` | Credenciais de integração criptografadas por org |
| `system_settings` | Configurações globais do sistema |
| `tutorial_progress` | Progresso de tutoriais por usuário |
| `consultant_pre_registrations` | Pré-cadastro de consultores por email |
| `treinamento_certificados` | Certificados emitidos após aprovação em treinamento |
| `template_versoes` | Histórico de versões de templates |
| `documentos_gerados` | Documentos gerados por IA (de templates) |
| `integration_sync` | Configuração de sync bidirecional (Trello/ClickUp) |
| `diagnostico_perguntas` | Catálogo de perguntas de diagnóstico de maturidade |
| `diagnosticos` | Diagnósticos realizados por organização |
| `diagnostico_respostas` | Respostas individuais de um diagnóstico |
| `codigo_etica_versoes` | Versões do Código de Ética por organização |

**Total: 40 tabelas no schema `public`, todas com RLS ativo.**

### Funções e Triggers
- `handle_new_user()` — Trigger `after insert on auth.users`: cria `profile` + role `cliente` padrão; verifica `consultant_pre_registrations` e atribui role `consultor` se aplicável
- `is_admin(user_id)` — Verifica se usuário tem role `admin` via `user_roles`
- `has_role(user_id, role)` — Verifica role específica
- `get_user_tenant_id(user_id)` — Retorna o tenant_id do usuário via organization_members
- `create_client_onboarding(...)` — RPC SECURITY DEFINER para onboarding completo
- `get_project_stats(p_projeto_id UUID)` — Retorna JSONB com estatísticas do projeto: total_documentos, documentos_aprovados, documentos_pendentes, total_tarefas, tarefas_concluidas, progresso_projeto (%). Usada pela Edge Function `generate-monthly-report`
- `render_template(p_template_id, p_variaveis)` — Renderiza template substituindo variáveis `{{nome}}`
- `validate_template(p_template_id)` — Valida se todas as variáveis de um template estão definidas
- Triggers de `updated_at` em todas as tabelas com esse campo
- Triggers de auditoria (`audit_logs`) em tabelas principais (INSERT/UPDATE/DELETE)

### Row Level Security
Todas as tabelas têm RLS habilitado. Políticas baseadas em:
- `auth.uid()` para acesso ao próprio perfil/dados
- `organization_members` para acesso a dados da organização
- `has_role(auth.uid(), 'admin')` / `has_role(auth.uid(), 'consultor')` para acesso privilegiado

---

## 6. Autenticação e Autorização

### Arquivos
| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/contexts/AuthContext.tsx` | Provider, estado de auth, métodos (signIn, signUp, etc.) |
| `src/components/auth/ProtectedRoute.tsx` | Guard de rotas por role |
| `src/spa/pages/Auth.tsx` | UI de login / cadastro / recuperação de senha |
| `src/app/(app)/auth/page.tsx` | Wrapper Next.js para a página de auth |

### Métodos disponíveis via `useAuth()`
```ts
user, session, profile, roles, loading
rolesReady   // true somente após fetchUserData completar — garante que roles foram carregados do banco
signIn(email, password)
signUp(email, password, { nome?, empresa? })
signOut()
resetPassword(email)
updatePassword(newPassword)
hasRole(role: AppRole)
isAdmin, isConsultor, isCliente
```

**`rolesReady` — proteção contra race condition:**
- `Auth.tsx`: redirect só ocorre quando `user && !authLoading && rolesReady` — impede redirect com `roles=[]`
- `ProtectedRoute.tsx`: exibe spinner enquanto `loading || (user && !rolesReady)` — rotas protegidas não renderizam com roles incompletos
- Reset em `SIGNED_IN` e no logout — dupla proteção mesmo que `loading` seja refatorado no futuro

### Roles e redirecionamentos
| Role | Dashboard padrão |
|------|-----------------|
| `admin` | `/admin` |
| `consultor` | `/consultor` |
| `cliente` | `/meu-projeto` |
| `parceiro` | `/meu-projeto` |

### Fluxo de reset de senha
1. Usuário clica em "Esqueceu a senha?" → `mode=forgot-password`
2. Insere email → `resetPassword()` → Supabase envia link para `/auth?mode=reset-password`
3. Usuário clica no link → Supabase estabelece sessão `PASSWORD_RECOVERY`
4. `onAuthStateChange` seta `user` → **não** redireciona (modo protegido)
5. Usuário digita nova senha → `updatePassword()` → redireciona para login

---

## 7. Módulos e Funcionalidades

### Área Pública
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | `Index.tsx` | Landing page |
| `/auth` | `Auth.tsx` | Login / Cadastro / Reset de senha |
| `/denuncia` | `Denuncia.tsx` | Canal de denúncias anônimo |
| `/consulta-protocolo` | `ConsultaProtocolo.tsx` | Consulta de protocolo de denúncia |

### Área do Cliente (`/meu-projeto`)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/meu-projeto` | `MeuProjeto.tsx` | Dashboard com workflow de fases |
| `/meu-projeto/diagnostico` | `Diagnostico.tsx` | Questionário de maturidade |
| `/meu-projeto/documentos-necessarios` | `DocumentosNecessarios.tsx` | Checklist de documentos |
| `/meu-projeto/documentos` | `RepositorioDocumentos.tsx` | Upload e visualização de docs |
| `/meu-projeto/treinamentos` | `Treinamentos.tsx` | Módulos de treinamento |
| `/meu-projeto/treinamentos/:id` | `TreinamentoDetalhe.tsx` | Quiz + certificado |
| `/meu-projeto/codigo-etica` | `CodigoEtica.tsx` | Visualização e adesão |
| `/meu-projeto/configuracoes` | `ClienteConfiguracoes.tsx` | Perfil e configurações |

### Área do Consultor (`/consultor`)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/consultor` | `ConsultorDashboard.tsx` | Dashboard multi-cliente com gráficos |
| `/consultor/clientes` | `ConsultorClientes.tsx` | Gestão de clientes |
| `/consultor/clientes/:id` | `ConsultorClienteDetalhe.tsx` | **[NOVO]** Detalhe do cliente: atas FireFlies + documentos |
| `/consultor/agenda` | `ConsultorAgenda.tsx` | **[NOVO]** Calendário unificado (Google Calendar + tarefas) |
| `/consultor/documentos` | `ConsultorDocumentos.tsx` | Revisão de documentos |
| `/consultor/denuncias` | `ConsultorDenuncias.tsx` | Gestão de denúncias |
| `/consultor/tarefas` | `ConsultorTarefas.tsx` | Kanban de tarefas |
| `/consultor/codigo-etica` | `ConsultorCodigoEtica.tsx` | Geração de Código de Ética |
| `/consultor/atas` | `ConsultorAtas.tsx` | Atas geradas por IA |
| `/consultor/agendamento` | `ConsultorAgendamento.tsx` | Agendamento Google Calendar |
| `/consultor/adesao-etica` | `ConsultorAdesaoEtica.tsx` | Monitoramento de adesões |
| `/consultor/relatorios` | `ConsultorRelatorios.tsx` | Relatórios mensais em PDF |
| `/consultor/configuracoes` | `ConsultorConfiguracoes.tsx` | Configurações do consultor |

### Área do Admin (`/admin`)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/admin` | `AdminDashboard.tsx` | Dashboard geral com analytics |
| `/admin/usuarios` | `AdminUsuarios.tsx` | Gestão de usuários e roles |
| `/admin/consultores` | `AdminConsultores.tsx` | Pré-cadastro de consultores |
| `/admin/organizacoes` | `AdminOrganizacoes.tsx` | Gestão de organizações/tenants |
| `/admin/catalogo` | `AdminCatalogo.tsx` | Catálogo de documentos requeridos |
| `/admin/templates` | `Templates.tsx` | Biblioteca de templates |
| `/admin/relatorios/historico` | `HistoricoRelatorios.tsx` | Histórico de envios |
| `/admin/integracoes` | `AdminIntegracoes.tsx` | Configuração de integrações |
| `/admin/branding` | `Branding.tsx` | White-label por organização |
| `/admin/configuracoes` | `AdminConfiguracoes.tsx` | Configurações gerais + segurança |

### Funcionalidades transversais
- **Tutorial guiado:** 5 tutoriais interativos com progresso salvo no banco (personalizado por role)
- **Notificações internas:** Sistema de notificações em tempo real via Supabase Realtime
- **Kanban:** Tarefas com drag-and-drop (dnd-kit) e ordenação persistida
- **Analytics:** 5 tipos de gráficos (pizza, barras, linhas, área, barras horizontais)
- **Branding white-label:** CSS variables customizáveis por tenant (cores, logo, favicon)
- **Preview de PDF:** Visualização in-app com zoom e paginação (react-pdf)
- **Comentários em documentos:** Threads com 3 níveis de respostas
- **Histórico de versões:** Versionamento automático de documentos via trigger

---

## 8. Edge Functions (Backend)

Localizadas em `supabase/functions/`. Todas em TypeScript/Deno.

| Function | JWT | Secrets necessários | Descrição |
|----------|-----|---------------------|-----------|
| `ai-generate` | ✅ sim | `OPENAI_API_KEY` (ou `LOVABLE_API_KEY`) | Geração de documentos, atas, relatórios, chat multi-turn (case `"chat"` com contexto do sistema: orgs, tarefas, docs) |
| `google-drive` | ✅ sim | `GOOGLE_SERVICE_ACCOUNT` | CRUD de pastas e arquivos no Google Drive |
| `google-calendar` | ✅ sim | `GOOGLE_SERVICE_ACCOUNT` | Criar eventos com Google Meet; `action: "list_events"` usado por `ConsultorAgenda` |
| `send-email` | ✅ sim | `RESEND_API_KEY` | Envio de emails via Resend |
| `send-whatsapp` | ✅ sim | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Envio de mensagens via Twilio |
| `process-transcription` | ✅ sim | `OPENAI_API_KEY`, `TRANSCRIPTION_WEBHOOK_SECRET` | Webhook do Fireflies: gera ata via IA, salva em `ai_generations` + insere em `documentos` (visível no repositório da org). URL: `.../process-transcription?organizacao_id=<uuid>` |
| `generate-monthly-report` | ✅ sim | `OPENAI_API_KEY` | Geração de relatório mensal HTML; chama RPC `get_project_stats` |
| `send-monthly-reports` | ✅ sim | `RESEND_API_KEY` | Disparo de relatórios mensais por email (cron) |
| `document-reminders` | ✅ sim | `RESEND_API_KEY`, `CRON_SECRET` | Lembretes de documentos pendentes (cron) |
| `denuncias` | ❌ não | — | Canal de denúncias público (sem auth) |
| `integrations` | ✅ sim | `INTEGRATIONS_ENCRYPTION_KEY` | Hub de integrações configuradas por org |
| `clickup-sync` | ✅ sim | `WEBHOOK_SECRET` | Sincronização de tarefas com ClickUp |
| `trello-sync` | ✅ sim | `WEBHOOK_SECRET` | Sincronização de tarefas com Trello |

### Utilitário compartilhado `_shared/cors.ts`
- Criado em 2026-03-04 para centralizar headers CORS em todas as Edge Functions
- Lê `ALLOWED_ORIGIN` env var (ex: `https://sistema-gig.vercel.app`) com fallback para `*`
- Suporta múltiplas origens separadas por vírgula
- Retorna header `Vary: Origin` quando em modo restrito (não `*`)
- Importado por: `denuncias`, `ai-generate`, `trello-sync`, `clickup-sync`

### Issues identificados e resolvidos (audit E2E 2026-03-04)
- **`trello-sync` e `clickup-sync`:** Verificação de webhook adicionada (`X-Webhook-Secret` header + `WEBHOOK_SECRET` secret) ✅
- **`denuncias`:** Guard POST-only adicionado (retorna 405 para GET/outros métodos) ✅
- **`ai-generate`:** Timeout de 25s adicionado via `AbortController`; validação de schema (`VALID_TIPOS`, tipo de `input_data`) adicionada ✅
- **CORS em todas as 4 functions acima:** Migrado de `"*"` hardcoded para `buildCorsHeaders()` com `ALLOWED_ORIGIN` env var ✅
- **`send-email` e `send-monthly-reports`:** Domínio de email `from` pode estar hardcoded. Externalizar para secret `RESEND_FROM_EMAIL`.
- **`ai-generate` e `process-transcription`:** Dependem de `LOVABLE_API_KEY` (plataforma Lovable) ou `OPENAI_API_KEY`. No deploy pós-Lovable, usar `OPENAI_API_KEY` diretamente.
- **`integrations`:** Precisa de `INTEGRATIONS_ENCRYPTION_KEY` para criptografar/descriptografar credenciais do vault.

### Deploy das Edge Functions
```bash
# Deploy de todas as functions:
supabase functions deploy --project-ref fenfgjqlsqzvxloeavdc

# Configurar secrets necessários:
supabase secrets set --project-ref fenfgjqlsqzvxloeavdc \
  OPENAI_API_KEY=sk-xxx \
  RESEND_API_KEY=re_xxx \
  TWILIO_ACCOUNT_SID=ACxxx \
  TWILIO_AUTH_TOKEN=xxx \
  GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}' \
  CRON_SECRET=xxx \
  TRANSCRIPTION_WEBHOOK_SECRET=xxx \
  INTEGRATIONS_ENCRYPTION_KEY=xxx \
  WEBHOOK_SECRET=<hex-32-bytes> \
  ALLOWED_ORIGIN=https://<vercel-domain>.vercel.app
```

---

## 9. Integrações Externas

### Google Drive
- **Service Account:** JSON completo em secret `GOOGLE_SERVICE_ACCOUNT`
- **Configuração:** Admin → Integrações → ID da pasta raiz
- **Estrutura automática por cliente:**
  ```
  📁 [Nome do Cliente]
    ├── 01 - Documentos Recebidos
    ├── 02 - Diagnóstico
    ├── 03 - Políticas e Procedimentos
    ├── 04 - Código de Ética
    ├── 05 - Atas e Reuniões
    ├── 06 - Treinamentos
    ├── 07 - Relatórios
    └── 08 - Canal de Denúncias
  ```

### Google Calendar
- Usa a mesma Service Account do Drive
- Cria eventos com Google Meet automaticamente (Kickoff + reuniões mensais)

### Resend (Email)
- Secret: `RESEND_API_KEY`
- Emails automáticos: documento enviado, aprovado, rejeitado, lembretes
- Remetente: configurar domínio verificado no Resend

### Twilio (SMS/WhatsApp)
- Secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

### Fireflies.ai (Transcrição)
- Secret: `FIREFLIES_API_KEY`
- Webhook URL: `https://[SUPABASE_URL]/functions/v1/process-transcription`
- Fluxo: reunião gravada → Fireflies transcreve → webhook → IA gera ata

### OpenAI GPT-4
- Secret: (gerenciado pelo Supabase/Lovable nativamente)

---

## 10. Estrutura de Arquivos

```
cavendish-gig-main/
├── src/
│   ├── App.tsx                          ← SPA root (BrowserRouter + todas as rotas)
│   ├── app/                             ← Next.js App Router
│   │   ├── layout.tsx                   ← Root layout (html/body)
│   │   ├── providers.tsx                ← Providers para páginas Next.js puras
│   │   ├── globals.css                  ← Estilos globais + CSS variables
│   │   ├── (app)/auth/page.tsx          ← Página de auth
│   │   ├── (spa)/[[...slug]]/page.tsx   ← Catch-all → SPA
│   │   ├── denuncia/                    ← Canal de denúncias (público)
│   │   ├── consulta-protocolo/          ← Consulta de protocolo
│   │   └── onboarding/
│   ├── spa/pages/                       ← Páginas React Router
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx
│   │   ├── Denuncia.tsx
│   │   ├── ConsultaProtocolo.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Help.tsx
│   │   ├── NotFound.tsx
│   │   ├── admin/                       ← 10 páginas admin
│   │   ├── consultor/                   ← 13 páginas consultor
│   │   │   ├── ConsultorClienteDetalhe.tsx  ← [NOVO] Atas FireFlies + docs por cliente
│   │   │   └── ConsultorAgenda.tsx          ← [NOVO] Calendário unificado react-big-calendar
│   │   └── cliente/                     ← 8 páginas cliente
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx       ← spinner enquanto loading || (user && !rolesReady)
│   │   ├── agente/
│   │   │   └── AgenteChat.tsx           ← [NOVO] Chat flutuante IntelliX AI (botão âmbar)
│   │   ├── layout/
│   │   │   ├── BaseLayout.tsx           ← [NOVO] Componente base compartilhado pelos 3 layouts
│   │   │   ├── AdminLayout.tsx          ← usa BaseLayout
│   │   │   ├── ConsultorLayout.tsx      ← usa BaseLayout + renderiza <AgenteChat />
│   │   │   └── ClienteLayout.tsx        ← usa BaseLayout
│   │   ├── analytics/                   ← 5 componentes de gráficos
│   │   ├── branding/
│   │   │   └── TenantBrandingProvider.tsx
│   │   ├── documentos/                  ← PDFViewer, GoogleDriveViewer, Comentarios
│   │   ├── cliente/
│   │   │   └── WorkflowProgress.tsx
│   │   ├── tutorial/
│   │   │   ├── TutorialGuide.tsx
│   │   │   └── TutorialHelpButton.tsx
│   │   ├── notifications/
│   │   ├── templates/
│   │   └── ui/                          ← shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx              ← Estado de auth, user, roles, profile, rolesReady
│   ├── hooks/                           ← ~30 custom hooks
│   ├── config/
│   │   └── tutorials.ts                 ← 5 tutoriais interativos (47 steps)
│   ├── integrations/supabase/
│   │   ├── client.ts                    ← Cliente Supabase (lazy init + SSR proxy)
│   │   └── types.ts                     ← Tipos gerados do schema
│   ├── types/
│   │   └── database.ts                  ← Tipos TypeScript do banco
│   ├── lib/
│   │   └── utils.ts                     ← cn() e utilitários
│   └── utils/
│       └── pdfExport.ts                 ← Exportação PDF (jsPDF + html2canvas)
├── supabase/
│   ├── config.toml                      ← project_id = fenfgjqlsqzvxloeavdc
│   ├── functions/                       ← 13 Edge Functions
│   └── migrations/                      ← 20+ migrations
├── tools/
│   └── grantRole.mjs                    ← Script CLI para promover usuário a admin
├── next.config.mjs
├── vercel.json                          ← Headers de segurança, rewrites
├── tailwind.config.ts
└── SISTEMA_TECNICO.md                   ← Este arquivo
```

---

## 11. Variáveis de Ambiente

### Frontend (`.env.local` / Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://fenfgjqlsqzvxloeavdc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[chave_anon_do_supabase]
# ou
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[chave_publishable]
```

### Supabase Secrets (Edge Functions)
```bash
# Obrigatórios para deploy funcional:
OPENAI_API_KEY=sk-xxx                         # ai-generate, process-transcription, generate-monthly-report
RESEND_API_KEY=re_xxxx                        # send-email, send-monthly-reports, document-reminders
TWILIO_ACCOUNT_SID=ACxxx                      # send-whatsapp
TWILIO_AUTH_TOKEN=xxx                         # send-whatsapp
GOOGLE_SERVICE_ACCOUNT={"type":"..."}         # google-drive, google-calendar (JSON completo)
CRON_SECRET=xxx                               # document-reminders (header Authorization)
TRANSCRIPTION_WEBHOOK_SECRET=xxx              # process-transcription (webhook do Fireflies)
INTEGRATIONS_ENCRYPTION_KEY=xxx              # integrations (AES-256 para credenciais do vault)
FIREFLIES_API_KEY=ff_xxxx                     # (se Fireflies precisar de API key para polling)
WEBHOOK_SECRET=<hex-32-bytes>                # trello-sync + clickup-sync (verificação de webhook) ← CONFIGURADO em 2026-03-04
ALLOWED_ORIGIN=https://<vercel-domain>       # CORS restrito para todas as Edge Functions (a configurar pós-deploy Vercel)
# Opcional (se usando domínio verificado Resend):
RESEND_FROM_EMAIL=noreply@cavendish.com.br
```

---

## 12. Deploy e Infraestrutura

### Frontend
- **Plataforma:** Vercel
- **Framework preset:** Next.js
- **Build:** `npm run build` → `.next/`
- **Node.js:** `>=22.0.0`
- **Headers de segurança** configurados no `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Backend (Supabase)
- Aplicar migrations: `supabase db push --linked`
- Deploy functions: `supabase functions deploy`
- Secrets: `supabase secrets set KEY=value`

### Criar primeiro admin
```sql
-- No Supabase SQL Editor, após criar usuário via Auth
INSERT INTO public.user_roles (user_id, role)
VALUES ('[USER_UUID]', 'admin');
```
Ou via CLI: `npm run admin:promote` (promove `fmbp1981@gmail.com`)

---

## 13. Histórico de Implementações

### 2025-12-12 — Setup inicial e schema base
- Criação do projeto com Vite + React + TypeScript
- Schema inicial: profiles, user_roles, organizacoes, projetos, documentos, tarefas, treinamentos, denuncias, codigo_etica_adesoes, ai_generations, notificacoes
- ENUMs: app_role, fase_projeto, tipo_projeto, status_documento
- RLS em todas as tabelas
- Trigger `handle_new_user`: cria profile + role `cliente` no signup

### 2025-12-13 — Integrações e funcionalidades Phase 1
- **Google Drive + Notificações:** `drive_folder_id` em organizacoes, tabela `system_settings`, triggers de notificação automática
- **Campo drive_file_id:** Em documentos para acesso direto
- **Índices de performance:** 40+ índices estratégicos em todas as tabelas principais
- **Sistema de comentários:** Tabela `documento_comentarios` com threads (3 níveis), RLS por org
- **Sistema de tutoriais:** Tabela `tutorial_progress`, 5 tutoriais interativos (47 steps)

### 2025-12-14 — Versões de documentos
- Tabela `documento_versoes` com versionamento automático via trigger

### 2025-12-15 — Relatórios e segurança
- Tabela `relatorio_envios` para log de envios
- **Hardening de segurança:**
  - `is_admin()` baseada em role (removido hard-code de email)
  - `handle_new_user()` corrigida para não permitir criação de orgs para outros usuários
  - RLS policies revisadas

### 2025-12-16 — Templates
- Tabela `templates` com biblioteca de templates de documentos

### 2025-12-22 — Integrações vault, branding, Kanban
- **Kanban ordering:** `kanban_order` em tarefas (float com epoch)
- **Tenant branding:** Tabela `tenant_branding` com cores HSL, logo, favicon, CSS customizado
- **Integrations vault:** Credenciais criptografadas por organização

### 2025-12-27 — Auditoria, planos e sync
- **Audit logs:** Tabela append-only `audit_logs` (INSERT/UPDATE/DELETE/LOGIN/etc.)
- **Gestão de planos:** ENUM `plano_tipo`, coluna `plano` em organizacoes, tabela `plano_config`
- **Integration sync:** Sync bidirecional configurável

### 2026-01-07 — Pré-cadastro de consultores
- Tabela `consultant_pre_registrations`
- Admin cadastra email → ao fazer signup, usuário recebe role `consultor` automaticamente
- Página `/admin/consultores`

### 2026-01-xx — Migração Vite → Next.js
- Migração completa para Next.js 15 App Router
- Padrão híbrido: App Router (páginas públicas) + React Router SPA (autenticada)
- `supabase/client.ts` refatorado: lazy init + proxy SSR para evitar erros no build

### 2026-03-02 — Regeneração de tipos TypeScript e remoção de `as any`
- **`src/integrations/supabase/types.ts`** regenerado via Management API (GET `/v1/projects/fenfgjqlsqzvxloeavdc/types/typescript`)
- Arquivo passou de tipos parciais para **73.745 chars** cobrindo todas as 40 tabelas, ENUMs, funções RPC e views
- **116 instâncias de `as any`** removidas em 22 arquivos: `AuthContext.tsx`, todos os `use*.ts` hooks, componentes de admin/consultor
- `src/types/database.ts` atualizado para refletir o schema real:
  - `profiles`: removido `organizacao_id: string | null`, adicionado `telefone: string | null`
  - `projetos`: removido `consultor_id: string | null`, adicionados `data_inicio` e `data_fim_prevista`
- **0 erros TypeScript** após limpeza

### 2026-03-03 — Sistema de Logs de Erros implementado
- **Tabela `system_logs`** criada no Supabase (migration `20260303000001_create_system_logs.sql`)
  - Campos: `id`, `level` (error/warning/info), `source`, `function_name`, `message`, `details` (JSONB), `user_id`, `organizacao_id`, `resolved`, `resolved_at`, `resolved_by`, `resolution_notes`, `created_at`
  - RLS: admins leem/atualizam; autenticados inserem; service_role acesso total
- **`supabase/functions/_shared/logger.ts`** — utilitário `logToSystem()` e `logEdgeFunctionError()` para Edge Functions
- **4 Edge Functions atualizadas** com logging automático de erros: `ai-generate`, `send-email`, `integrations`, `google-drive`
- **`src/utils/errorLogger.ts`** — captura global de `window.error` e `unhandledrejection` no frontend
- **`src/hooks/useSystemLogs.ts`** — hook com filtros, stats, resolve/reopen
- **`src/spa/pages/admin/AdminLogs.tsx`** — página completa de logs:
  - 4 cards de stats (erros críticos, avisos, registros 24h, total resolvidos)
  - Filtros: nível, origem, status, período, busca textual
  - Tabela com hover-expand → dialog de detalhes
  - **Diagnóstico automático**: mapeia erros para "Causa provável" + "Como corrigir" (20+ padrões)
  - Ações: marcar como resolvido (com nota), reabrir
- **`AdminLayout.tsx`** — menu "Logs do Sistema" adicionado (ícone Bug)
- **Rota** `/admin/logs` adicionada ao App.tsx (protegida por role `admin`)
- Tipos TypeScript regenerados (inclui `system_logs`)

### 2026-03-03 — Tema Cavendish aplicado (visual premium)
- **Paleta de marca aplicada** ao design system via CSS variables em `src/app/globals.css`:
  - `--background`: Cream `40 25% 94%` (#F4F1EB) — fundo cálido, profissional
  - `--primary`: Forest Green `161 55% 23%` (#1A5B44) — cor principal
  - `--accent`: Cavendish Gold `46 87% 39%` (#B8970D) — destaque premium
  - `--secondary`: Teal `168 45% 35%` — complementar
  - `--sidebar-background`: Dark Navy `204 65% 14%` (#0C2B3C) — sidebar escura premium
  - `--sidebar-primary`: Gold `46 87% 39%` — itens ativos no sidebar
- **3 layouts atualizados** (AdminLayout, ConsultorLayout, ClienteLayout):
  - Sidebar migrada de `bg-card/border-border` para `bg-sidebar/border-sidebar-border`
  - Itens ativos: `bg-sidebar-primary text-sidebar-primary-foreground` (gold + navy)
  - Hover: `bg-sidebar-accent text-sidebar-accent-foreground` (navy claro)
  - Botões toggle sidebar: classes sidebar corretas (sem mais conflict com ghost variant)
  - Badge ADMIN: gold ao invés de destructive red
  - Badge "Acesso Total" no header: gold/amber ao invés de vermelho
- `0 erros TypeScript` após todas as mudanças

### 2026-03-04 — Suite E2E completa (217 testes) e correção de 9 bugs
- **Suite E2E executada** com metodologia VibeCODE 8 fases (217 testes, 187 passaram — 86.2%)
  - Fase 1 Smoke: 47/48 | Fase 2 Funcional: 9/18 (falsos positivos de hydration SPA) | Fase 3 Negativos: 29/30
  - Fase 4 Edge Cases: 22/22 (100%) | Fase 5 Segurança: 15/28 (dev artifacts) | Fase 6 UI/UX: 37/40
  - Fase 7 Stress: 20/20 (100%) | Fase 8 AI Security: 8/11 → **9 bugs reais identificados**
- **Relatório:** `tests/RELATORIO_E2E.md`
- **Scripts criados:** `tests/test_01_smoke.py` a `tests/test_08_ai_security.py`

#### Bugs corrigidos (2026-03-04):

**BUG-01 CRÍTICO — `denuncias` retornava 500 no GET**
- Edge Function não tinha guard de método; GET chamava `req.json()` sem body e explodía
- Fix: guard POST-only antes de qualquer lógica (retorna 405 para outros métodos)
- Arquivo: `supabase/functions/denuncias/index.ts`

**BUG-02 CRÍTICO — `trello-sync`/`clickup-sync` sem verificação de webhook**
- Ação `webhook` aceitava qualquer request com JWT válido sem verificar origem
- Fix: verificação do header `X-Webhook-Secret` contra o secret `WEBHOOK_SECRET` (condicional — sem o secret, segue sem verificação para backward compat)
- Arquivo: `supabase/functions/trello-sync/index.ts`, `supabase/functions/clickup-sync/index.ts`

**BUG-03 CRÍTICO — CORS `*` hardcoded nas Edge Functions**
- `"Access-Control-Allow-Origin": "*"` estava hardcoded em `denuncias`, `ai-generate`, `trello-sync`, `clickup-sync`
- Fix: criado `supabase/functions/_shared/cors.ts` com `buildCorsHeaders()` que lê `ALLOWED_ORIGIN` env var (fallback `*`)
- Suporta múltiplas origens separadas por vírgula + header `Vary: Origin` no modo restrito

**BUG-04 ALTO — `console.log` expondo dados sensíveis no AuthContext**
- 4 `console.log` expunham `userId`, `profileData`, `rolesData`, `mappedRoles` no console do browser
- Fix: todos removidos; mantidos apenas `console.error` para erros reais
- Arquivo: `src/contexts/AuthContext.tsx`

**BUG-05 ALTO — `ai-generate` sem timeout nas chamadas à IA**
- Chamadas `fetch()` para OpenAI/Gemini/Claude podiam travar indefinidamente
- Fix: `fetchWithTimeout(url, options, 25_000)` com `AbortController` + `clearTimeout` no finally
- Arquivo: `supabase/functions/ai-generate/index.ts`

**BUG-06 ALTO — `ai-generate` sem validação de schema de entrada**
- Campo `tipo` aceitava qualquer string; `input_data` aceitava qualquer tipo (null, array, etc.)
- Fix: constante `VALID_TIPOS` com 7 tipos válidos; validação retorna 400 para tipo inválido ou `input_data` não-objeto

**BUG-07 MÉDIO — Navegação por Tab não funciona corretamente em `/auth`**
- Campo de email não recebia foco automático no carregamento, dificultando navegação por teclado
- Fix: `autoFocus={mode === "login"}` e `autoComplete="email"` adicionados ao campo
- Arquivo: `src/spa/pages/Auth.tsx`

**BUG-08 MÉDIO — Favicon ausente nos metadados do Next.js**
- `layout.tsx` não tinha configuração de `icons`, apenas title/description
- Fix: `icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' }` adicionado
- Arquivo: `src/app/layout.tsx` (favicon.ico já existia em `/public/`)

**BUG-09 — Falso positivo** (placeholder já existia — teste rodou antes da hydration SPA)

- **4 Edge Functions re-deployadas** após as correções: `denuncias`, `ai-generate`, `trello-sync`, `clickup-sync`
- **`WEBHOOK_SECRET` configurado** via `supabase secrets set` (hex 32 bytes)
- **`ALLOWED_ORIGIN`** a configurar quando o domínio Vercel for definido

### 2026-03-03 — Deploy das Edge Functions e configuração de secrets
- **13 Edge Functions** deployadas via `supabase functions deploy --project-ref fenfgjqlsqzvxloeavdc`
- **Secrets internos** configurados via `supabase secrets set`:
  - `INTEGRATIONS_ENCRYPTION_KEY` — chave AES-256-GCM (base64, 32 bytes) para criptografar credenciais no `integrations_vault`
  - `CRON_SECRET` — token de autorização para o cron job `document-reminders`
  - `TRANSCRIPTION_WEBHOOK_SECRET` — secret para verificar webhooks do Fireflies
- Credenciais de integração (OpenAI, Resend, Twilio, Google, Fireflies) serão configuradas pelo usuário via `/admin/integracoes` → armazenadas criptografadas na tabela `integrations`
- Env vars do Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) confirmadas como já configuradas para Development/Preview/Production

### 2026-03-09 — AgenteChat IntelliX AI + Calendário Unificado
- **`src/components/agente/AgenteChat.tsx`** — Chat flutuante no Portal do Consultor
  - Botão âmbar fixo no canto inferior direito em todas as páginas do consultor
  - Sugestões de perguntas na tela inicial; conversa multi-turn com histórico
  - Chama `ai-generate` com `tipo: "chat"` passando histórico de mensagens e contexto do usuário
  - Minimizar / fechar / limpar conversa
- **`src/components/layout/ConsultorLayout.tsx`** — `<AgenteChat />` inserido no layout
- **`src/spa/pages/consultor/ConsultorAgenda.tsx`** — Calendário unificado
  - `react-big-calendar` (instalado: `^1.19.4`) com locale PT-BR
  - Fontes: Google Calendar (verde = reuniões GIG, azul = outros) + Tarefas com prazo (laranja)
  - Views: Mês / Semana / Dia / Agenda; botão "Sincronizar"
  - Clique no evento abre painel de detalhes
- **`src/spa/pages/consultor/ConsultorClienteDetalhe.tsx`** — Detalhe do cliente
  - Aba "Atas de Reunião": lista atas geradas via FireFlies (documentos com `nome LIKE 'Ata - %'`)
  - Aba "Documentos": lista documentos aprovados da organização
  - Visualizar ata em modal + baixar como `.md`
- **Rota `/consultor/agenda`** e **`/consultor/clientes/:id`** registradas no `App.tsx`
- **Item "Agenda"** (`CalendarDays`) adicionado ao menu lateral do ConsultorLayout

### 2026-03-09 — `rolesReady` no AuthContext (proteção definitiva contra race condition)
- **`src/contexts/AuthContext.tsx`** — estado `rolesReady: boolean` adicionado à interface e ao provider
  - `rolesReady = false` na inicialização e ao receber evento `SIGNED_IN`
  - `rolesReady = true` somente no `finally` de `fetchUserData` (mesmo em erro de rede)
- **`src/spa/pages/Auth.tsx`** — redirect depende de `rolesReady`: `user && !authLoading && rolesReady`
- **`src/components/auth/ProtectedRoute.tsx`** — spinner enquanto `loading || (user && !rolesReady)`

### 2026-03-09 — FireFlies → repositório de documentos
- **`supabase/functions/process-transcription/index.ts`** atualizado:
  - Lê `?organizacao_id=<uuid>` da URL do webhook
  - Após gerar a ata: upload do markdown em `documentos/{organizacao_id}/atas/{meetingId}.md` no Storage
  - Insere registro em `documentos` com `nome = "Ata - {título} ({data})"`, `tipo = "ata_reuniao"`, `status = "aprovado"`
  - Mantém insert em `ai_generations` para auditoria
- Ata fica visível na aba "Atas de Reunião" em `ConsultorClienteDetalhe` e no `RepositorioDocumentos` do cliente

### 2026-03-09 — Refatoração de layouts (BaseLayout) + hub de email
- **`src/components/layout/BaseLayout.tsx`** — componente base compartilhado
  - Eliminou ~600 linhas duplicadas entre AdminLayout, ConsultorLayout e ClienteLayout
  - Props: `navItems`, `homeHref`, `headerTitle`, `userRole`, `settingsHref`, `extraMenuItems`, `children`
- **`supabase/functions/_shared/email.ts`** — `sendEmail()` centralizado
  - Lê API key do integrations vault; fallback para `RESEND_API_KEY` env var
  - Usado por `document-reminders` e `send-monthly-reports` (código duplicado removido)
- **`src/hooks/emailNotifications.ts`** — hook frontend para disparar emails via `send-email` Edge Function
- **Removidos:** `src/lib/supabase.ts` (antigo), `src/hooks/useNotificacoesEmail.ts`, `src/spa/pages/Dashboard.tsx` (obsoletos)

### 2026-03-09 — 9 novas migrations (módulos de compliance avançado)
- `20260304000010_politicas.sql` — `politicas` (gestão de políticas corporativas)
- `20260304000011_conflito_interesses.sql`
- `20260304000012_lgpd.sql`
- `20260304000013_riscos.sql` — `riscos` (gestão formal de riscos)
- `20260304000014_due_diligence.sql`
- `20260304000015_kpis.sql` — `kpis_compliance`
- `20260304000016_incidentes.sql`
- `20260304000017_auditorias.sql` — `auditorias_internas` + não conformidades
- `20260304000018_relatorios_regulatorios.sql` — tipos: CGU, CVM, BACEN, ANPD, TCU, CADE
- **Pendente:** aplicar no Supabase via `supabase db push`

### 2026-03-09 — Fixes de UI
- **Fix dupla numeração Google Drive** (`src/spa/pages/admin/AdminIntegracoes.tsx`): strings de instrução tinham prefixo manual `"1. texto"` dentro de `<ol list-decimal>`, gerando `1. 1. texto`. Prefixos removidos com `sed`.
- **Fix botão X do Tour** (`src/app/globals.css`): `.driver-popover-close-btn` recebia `position: relative; z-index: 9999; pointer-events: auto !important` — botão agora recebe cliques corretamente.

### 2026-03-02 — RPC `get_project_stats` criada
- Edge Function `generate-monthly-report` referenciava `get_project_stats(p_projeto_id)` que não existia no DB
- Criada via Management API com retorno JSONB:
  - `total_documentos`, `documentos_aprovados`, `documentos_pendentes`
  - `total_tarefas`, `tarefas_concluidas`, `progresso_projeto` (%)
  - Calcula progresso baseado em documentos aprovados vs total requeridos
- Migração completa para Next.js 15 App Router
- Padrão híbrido: App Router (páginas públicas) + React Router SPA (autenticada)
- `supabase/client.ts` refatorado: lazy init + proxy SSR para evitar erros no build

---

## 14. Bugs Corrigidos

### 2026-03-02 — Correções no sistema de autenticação
**Arquivo:** `src/contexts/AuthContext.tsx`, `src/spa/pages/Auth.tsx`, `src/components/auth/ProtectedRoute.tsx`

#### BUG 1 — CRÍTICO: Password reset redirecionava antes de salvar nova senha
- **Causa:** `useEffect` em `Auth.tsx` detectava `user != null` (sessão de recovery) e redirecionava para o dashboard antes do formulário de reset ser usado
- **Fix:** `mode !== "reset-password"` adicionado à condição do `useEffect`; `mode` adicionado às dependências

#### BUG 2 — ALTA: Campo `company` do cadastro era descartado
- **Causa:** `signUp` em `AuthContext` só aceitava `{ nome? }` no metadata; campo `company` do formulário nunca era passado
- **Fix:** Assinatura atualizada para `{ nome?: string; empresa?: string }`; `Auth.tsx` agora passa `empresa: formData.company`

#### BUG 3 — ALTA: Race condition — `fetchUserData` chamado duas vezes no boot
- **Causa:** Tanto `onAuthStateChange` (com `setTimeout`) quanto `getSession()` chamavam `fetchUserData` para o mesmo `userId` na inicialização
- **Fix:** `useRef fetchingUserIdRef` — se já estiver buscando para aquele userId, ignora a segunda chamada

#### BUG 4 — MÉDIA: Role `parceiro` sem redirecionamento em `ProtectedRoute`
- **Causa:** Fallback sem tratamento para a role `parceiro`, redirecionava para `/` (landing page) sem destino adequado
- **Fix:** `roles.includes('parceiro')` adicionado com redirect para `/meu-projeto`

#### BUG 5 — MÉDIA: Type mismatch `Error | null` vs `AuthError | null`
- **Causa:** Interface `AuthContextType` declarava `{ error: Error | null }` mas Supabase retorna `AuthError`
- **Fix:** `import { AuthError }` adicionado; todos os métodos de auth tipados corretamente com `AuthError | null`

### 2026-03-02 — Admin redirecionado para dashboard errado
**Arquivo:** `src/spa/pages/Index.tsx`

#### BUG 6 — CRÍTICO: Admin via `/` era enviado para `/dashboard` (ConsultorDashboard) em vez de `/admin`
- **Causa:** `Index.tsx` tinha `if (isAdmin || isConsultor) → /dashboard`. Como `isConsultor = hasRole('consultor') || hasRole('admin')`, admins também eram incluídos e iam para `/dashboard` (que mapeia para `ConsultorDashboard`)
- **Fix:** Separado em dois `if` independentes: `isAdmin → /admin`, `isConsultor → /consultor`, default → `/meu-projeto`

### 2026-03-09 — AgenteChat + Tour (3 bugs)

#### BUG 8 — ALTA: AgenteChat enviava messages array mas edge function lia campo inexistente
- **Causa:** `AgenteChat.tsx` enviava `input_data: { messages: newMessages }`, mas edge function `ai-generate` no `chat` case lia `input_data.mensagem || input_data.prompt` (sempre `undefined`) → `userPrompt = ""` → AI retornava resposta vazia/erro
- **Fix (edge function):** Adicionado suporte a `input_data.messages` (array) no `chat` case com passagem do histórico completo para `callAI` (novo parâmetro opcional `conversationMessages`). OpenAI/Lovable/Claude recebem messages array nativo; Gemini usa `contents[]` + `systemInstruction`. Fix: `AgenteChat.tsx` também agora envia `mensagem: text` como fallback.
- **Arquivos:** `supabase/functions/ai-generate/index.ts`, `src/components/agente/AgenteChat.tsx`

#### BUG 9 — ALTA: Edge function retornava 500 quando nenhum provedor de IA configurado
- **Causa:** `getAIConfig()` lançava `Error("Nenhum provedor...")` e o catch global retornava 500, sem mensagem útil para o usuário
- **Fix:** Bloco `try/catch` em torno de `getAIConfig()` retorna 503 com a mensagem amigável em vez de 500. `AgenteChat.tsx` agora exibe `data.error` como mensagem `⚠️` no chat.
- **Arquivo:** `supabase/functions/ai-generate/index.ts`

#### BUG 10 — ALTA: Tour X button não limpava sessão / cross-page nav sessão zerada imediatamente
- **Causa 1:** `onDestroyStarted` (chamado por `d.destroy()`) limpava `sessionStorage` mesmo durante navegação cross-page, zerando a sessão que `onNextClick`/`onPrevClick` acabara de salvar → tour nunca retomava na próxima página
- **Causa 2:** driver.js v1.4 não chama `onDestroyStarted` quando o usuário clica no X do popover → sessão ficava presa no storage e o tour reiniciava na próxima navegação
- **Fix:** Adicionado `isNavigatingRef` (flag boolean) que é `true` durante `saveTourSession → d.destroy() → navigate()`; `onDestroyStarted` só limpa sessão quando `!isNavigatingRef.current`. Adicionado `onCloseClick` explícito que chama `clearTourSession()` + `d.destroy()` (necessário em driver.js v1.x onde o botão X não destrói automaticamente).
- **Arquivo:** `src/contexts/TourContext.tsx`

### 2026-03-02 — Bug: `.eq()` com array em vez de `.in()`
**Arquivo:** `src/hooks/useClienteProjeto.ts`

#### BUG 7 — ALTA: Consulta de documentos requeridos usava `.eq()` com array (sempre retornava vazio)
- **Causa:** `.eq("documento_requerido_id", documentos?.map(d => d.id) || [])` — `.eq()` aceita um único valor escalar, não array
- **Fix:** Substituído por `.in("documento_requerido_id", documentos?.map(d => d.id) || [])` — operador SQL `IN` correto
- **Impacto:** Checklist de documentos do cliente (`DocumentosNecessarios.tsx`) não exibia status de nenhum documento

### 2026-03-02 — Schema de banco de dados incompleto
**Contexto:** Apenas 14 das ~39 tabelas estavam presentes no Supabase `fenfgjqlsqzvxloeavdc`

**Migrations aplicadas manualmente via Management API:**
- `has_role`, `is_admin`, `get_user_tenant_id` functions ✅
- `denuncias`, `consultor_organizacoes`, `tarefas`, `ai_generations` ✅
- `diagnostico_perguntas`, `diagnosticos`, `diagnostico_respostas` + 50 perguntas seed ✅
- `treinamentos`, `treinamento_conteudos`, `treinamento_quiz`, `treinamento_inscricoes`, `treinamento_certificados` ✅
- RLS policies + triggers para todos os módulos acima ✅
- Seed: 5 treinamentos, 3 conteúdos, 5 quizzes (Código de Ética) ✅
- `codigo_etica_versoes`, `codigo_etica_adesoes` + RLS + seed (1 versão inicial) ✅
- `system_settings` + seed (2 registros) ✅
- `20251214` `documento_versoes` + functions + triggers ✅
- `20251215` `relatorio_envios` + functions + views ✅
- `20251215190000` security/RLS fixes ✅
- `20251216` `templates`, `template_versoes`, `documentos_gerados` ✅
- `20251222` `integrations`, `tenant_branding`, `integration_sync`, kanban ✅
- `20251227` `audit_logs` + triggers em todas as tabelas ✅
- `20251227000001` `plano_config` ✅
- `20251227000002` `integration_sync` ✅
- `20260107` `consultor_pre_registrations` ✅

**Status final:** 40 tabelas no schema público, RLS ativo em todas, seed data carregado.

---

## 15. Pendências e Roadmap

### Alta prioridade
- [x] **Configurar variáveis de ambiente no Vercel** — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — JÁ ESTAVAM CONFIGURADAS (há 76 dias)
- [x] **Aplicar todas as migrations** no Supabase de produção — CONCLUÍDO em 2026-03-02
- [x] **Regenerar tipos TypeScript** — CONCLUÍDO em 2026-03-02 (73.745 chars, 40 tabelas)
- [x] **Remover `as any`** — CONCLUÍDO em 2026-03-02 (116 instâncias removidas, 0 erros TS)
- [x] **Deploy das Edge Functions** — CONCLUÍDO em 2026-03-03 (13 functions deployadas)
- [x] **Configurar secrets internos das Edge Functions** — CONCLUÍDO em 2026-03-03:
  - `INTEGRATIONS_ENCRYPTION_KEY` (AES-256-GCM, 32 bytes base64) ✅
  - `CRON_SECRET` (hex 32 bytes) ✅
  - `TRANSCRIPTION_WEBHOOK_SECRET` (hex 32 bytes) ✅
  - Credenciais de integração (OpenAI, Resend, Twilio, Google) → configurar via painel Admin → Integrações
- [ ] **Configurar integrações via painel Admin** — Acessar `/admin/integracoes` e inserir as chaves:
  - Provider `resend`: `RESEND_API_KEY`
  - Provider `openai`: `OPENAI_API_KEY` (+ selecionar modelo)
  - Provider `google`: JSON do Service Account
  - Provider `twilio`: `ACCOUNT_SID` + `AUTH_TOKEN`
  - Provider `fireflies`: `FIREFLIES_API_KEY`
- [ ] **Webhook Fireflies** apontar para `https://fenfgjqlsqzvxloeavdc.supabase.co/functions/v1/process-transcription` (header `X-Webhook-Secret: <TRANSCRIPTION_WEBHOOK_SECRET>`)
- [x] **Adicionar verificação de webhook** em `trello-sync` e `clickup-sync` — CONCLUÍDO em 2026-03-04 (`WEBHOOK_SECRET` configurado)
- [x] **Externalizar email `from`** nas Edge Functions `send-email`/`send-monthly-reports` — CONCLUÍDO em 2026-03-04 (usa `RESEND_FROM_EMAIL` env var; fallback: `noreply@cavendish.com.br`)
- [x] **Rota `/parceiro`** dedicada — CONCLUÍDO em 2026-03-04 (página `ParceiroDashboard.tsx`, layout `ClienteLayout`, redirect correto em `Index.tsx` e `ProtectedRoute.tsx`)
- [x] **Envio automático de relatórios mensais** (pg_cron) — CONCLUÍDO em 2026-03-04:
  - `pg_cron` já habilitado no projeto
  - Job `monthly-reports` criado: `0 11 1 * *` (dia 1, 11:00 UTC = 08:00 BRT)
  - Chama `public.trigger_monthly_reports()` (SECURITY DEFINER) que lê CRON_SECRET da `system_settings` e chama a Edge Function via `pg_net`
  - Migrations: `20260304000001_pg_cron_monthly_reports.sql`, `20260304000002_cron_wrapper_function.sql`
- [x] **Notificações Realtime** — JÁ ESTAVA IMPLEMENTADO em `useNotificacoes.ts` (subscriptions INSERT + UPDATE + refetchInterval 30s)

### 🔴 CRÍTICO — Gaps identificados vs. mercado GRC (ver Seção 16)
- [ ] **Módulo de Gestão de Riscos** — Risk Register + Heatmap 5×5 + Planos de mitigação (tabelas: `riscos`, `riscos_mitigacao`, `riscos_avaliacoes`)
- [ ] **Compliance Calendar** — Agenda regulatória com obrigações LGPD/Lei 12.846/CVM + alertas de vencimento
- [ ] **LGPD Compliance Module** — Inventário de dados (ROPA), consentimentos, DSR workflow, DPIA
- [ ] **Gestão de Investigações** — Fluxo formal atrelado ao canal de denúncias (Recebida→Concluída) com SLA e evidências sigilosas

### 🔴 ALTA — Gaps competitivos importantes
- [ ] **Conflitos de Interesse** — Formulário de disclosure periódico + workflow aprovação gestor
- [ ] **Gestão de Políticas Corporativas** — Biblioteca de políticas + workflow criação→aprovação→publicação + aceite digital
- [ ] **Third-Party Risk** — Cadastro de fornecedores críticos + due diligence automatizada + score de risco
- [ ] **Canal de denúncias melhorado** — Triagem por IA, dashboard KPIs, link/QR público para denúncias externas sem login

### Média prioridade
- [ ] **White-label completo com subdomínio** por organização
- [ ] **ESG Dashboard** — indicadores ambientais, sociais e de governança para diretoria
- [ ] **Board Reporting** — dashboard executivo read-only para membros do conselho
- [ ] **Benchmark setorial no diagnóstico** — comparar score GIG com média do setor
- [ ] **SSO / SAML** — para tenants enterprise (Azure AD, Google Workspace)
- [ ] **SCORM player** — importar cursos externos de e-learning

### Baixa prioridade / Future
- [ ] API pública REST para integrações customizadas
- [ ] Integração ERP (TOTVS Protheus)
- [ ] Mobile app nativo (PWA suficiente por ora)
- [ ] i18n multi-idioma (inglês + espanhol)
- [ ] Analytics avançado (cohort, funil)

### Simplificar / Remover
- [ ] **Desativar edge functions ClickUp/Trello sync** — deployadas mas sem uso real (reduz custo compute)
- [ ] **Remover Kanban visual complexo** — simplificar para lista de tarefas com status
- [ ] **Limpar referências Lovable AI** — variáveis e comentários residuais no código

---

## 16. Análise Competitiva — Mercado GRC (atualizado 2026-03-09)

> Pesquisa realizada com base em fontes públicas (Pathlock, VComply, Gartner, G2, CompliancePME.br, GoPliance, NAVEX, Diligent, clickCompliance) e inteligência de mercado.

### Principais Sistemas GRC do Mercado

| Sistema | Foco | Público | Presença no BR | Destaques |
|---|---|---|---|---|
| **NAVEX One** (EthicsPoint) | GRC completo | Enterprise+ | Parcial | Líder em canal de denúncias; 13.000 org.; IA em triagem de reports; training insights |
| **Diligent One** | Board + GRC | Enterprise | Não | Único a unir board management + GRC + ESG + audit; heatmap de riscos; board reporting |
| **MetricStream** | GRC / CyberGRC / ESGRC | Enterprise | Não | Líder Gartner/Forrester; 3 linhas de produto; risk quantification |
| **OneTrust** | Privacy + GRC | Enterprise/PME | Sim | Líder em LGPD/GDPR; risk assessment automatizado; policy management |
| **LogicGate** | Risk / GRC workflows | Mid-Market | Não | Drag-and-drop workflows; risk register; monitoramento contínuo |
| **VComply** | Compliance ops | PME–Mid | Não | Interface intuitiva; compliance tracking; policy management; audit |
| **AuditBoard** | Audit + Risk | Mid-Enterprise | Não | Líder em audit management; SOXHUB; risk heatmap |
| **IBM OpenPages** | GRC Enterprise | Enterprise | Sim (IBM BR) | Máxima integração com ERP; AI Watson; altíssimo custo |
| **clickCompliance** | Compliance PME | PME | **Sim (BR)** | 7 módulos; canal de denúncias com IA + WhatsApp + voz; chatbot; conflitos de interesse |
| **Contato Seguro** | Canal de denúncias | PME | **Sim (BR)** | Especialista em whistleblowing; integração com Pró-Ética |
| **GoPliance** | Compliance PME | PME | **Sim (BR)** | Solução brasileira; diagnóstico, código de ética, treinamentos, canal de denúncias |

### O que Todo Sistema GRC Sério Oferece (Top 12 funcionalidades padrão)

1. **Canal de denúncias anônimo** — web + telefone + WhatsApp; triagem por IA; gestão de investigações formais; dashboard de KPIs de denúncias; anti-represália
2. **Gestão de riscos (Risk Register + Matriz)** — cadastro de riscos, probabilidade × impacto, heatmap visual, planos de mitigação, monitoramento contínuo
3. **Política e código de ética** — criação, versionamento, workflow de aprovação, aceite digital rastreável por colaborador, renovação periódica
4. **Treinamentos e-learning** — biblioteca de cursos, quiz, certificado, rastreamento de conclusão, relatório de adesão por departamento
5. **Gestão de documentos** — upload, workflow aprovação/rejeição, controle de versões, expiração automática, classificação por categoria
6. **Compliance calendar** — calendário de obrigações regulatórias, prazos legais, alertas de vencimento (LGPD, Lei Anticorrupção, BACEN, CVM)
7. **Third-party risk** — cadastro de fornecedores, due diligence automatizada, score de risco de terceiros
8. **Audit trail completo** — log imutável de todas as ações; exportação para auditores; rastreabilidade por usuário/data/ação
9. **Conflitos de interesse** — formulários de disclosure, workflow de aprovação, registro histórico
10. **Diagnóstico de maturidade** — questionários por pilares (OCDE, ISO 37001, CGU), scoring, benchmark setorial, plano de ação gerado automaticamente
11. **Board/ESG reporting** — dashboards executivos para diretoria; indicadores ESG; relatório para conselho
12. **Integrações** — SSO/SAML; ERP (SAP, TOTVS, TOTVS Protheus); Active Directory; API pública

### Comparativo: Sistema GIG vs. Mercado

| Funcionalidade | Mercado | Sistema GIG | Gap |
|---|---|---|---|
| Canal de denúncias anônimo | ✅ Padrão | ✅ Implementado | — |
| Denúncias: IA triagem + WhatsApp | ✅ Top players | ❌ Não tem | 🔴 ALTA |
| Denúncias: gestão de investigação formal | ✅ Padrão | ❌ Não tem | 🔴 ALTA |
| Diagnóstico de maturidade | ✅ Padrão | ✅ Implementado | — |
| Diagnóstico: benchmark setorial | ✅ Top players | ❌ Não tem | 🟡 MÉDIA |
| Código de ética (geração IA) | ✅ Padrão | ✅ Implementado | — |
| Código de ética: aceite digital por colaborador | ✅ Padrão | ✅ `codigo_etica_adesoes` | — |
| Treinamentos e-learning + quiz + certificado | ✅ Padrão | ✅ Implementado | — |
| Treinamentos: SCORM / vídeo externo | ✅ Top players | ❌ Não tem | 🟡 MÉDIA |
| Gestão de documentos com aprovação | ✅ Padrão | ✅ Implementado | — |
| **Gestão de riscos (Risk Register + Heatmap)** | ✅ Padrão | ❌ Não tem | 🔴 **CRÍTICO** |
| Planos de mitigação de riscos | ✅ Padrão | ❌ Não tem | 🔴 **CRÍTICO** |
| **Compliance calendar / Agenda regulatória** | ✅ Padrão | ❌ Não tem | 🔴 **CRÍTICO** |
| Conflitos de interesse (disclosure) | ✅ Padrão | ❌ Não tem | 🔴 ALTA |
| **Third-party risk (fornecedores)** | ✅ Padrão | ❌ Não tem | 🔴 ALTA |
| Políticas corporativas (workflow revisão) | ✅ Padrão | ❌ Não tem | 🔴 ALTA |
| Audit trail completo | ✅ Padrão | ✅ `audit_logs` em 40 tabelas | — |
| ESG reporting | ✅ Top players | ❌ Não tem | 🟡 MÉDIA |
| Board reporting dashboard | ✅ Top players | ❌ Não tem | 🟡 MÉDIA |
| Relatórios mensais automáticos | ✅ Padrão | ✅ Implementado (pg_cron) | — |
| Agente de IA (chat) | ✅ Emergente | ✅ Implementado | — |
| IA para geração de documentos | ✅ Emergente | ✅ Implementado (5 tipos) | — |
| **LGPD compliance module** | ✅ Padrão BR | ❌ Não tem | 🔴 **CRÍTICO** |
| Multi-tenant (organização + consultores) | ✅ Padrão SaaS | ✅ Implementado | — |
| Portal do cliente | ✅ Padrão | ✅ Implementado | — |
| Gestão de projetos/tarefas | ✅ Padrão | ✅ Implementado | — |
| Google Calendar (reuniões) | Diferencial | ✅ Implementado | — |
| Transcrição de reuniões (Fireflies) | Diferencial | ✅ Implementado | — |
| SSO / SAML enterprise | ✅ Padrão enterprise | ❌ Não tem | 🟡 MÉDIA |
| API pública para integrações | ✅ Padrão | ❌ Não tem | 🟡 MÉDIA |
| Integração ERP (SAP/TOTVS) | ✅ Enterprise | ❌ Não tem | 🔵 BAIXA |
| Mobile app nativo | ✅ Top players | ❌ Não tem | 🔵 BAIXA |

### O que Implementar (por prioridade)

#### 🔴 CRÍTICO — Sem isso o GIG não compete no core do mercado

1. **Módulo de Gestão de Riscos**
   - Risk Register: cadastro de riscos com categoria, responsável, probabilidade, impacto
   - Matriz de riscos visual (heatmap 5×5)
   - Planos de mitigação com tarefas e prazos
   - Monitoramento e reavaliação periódica
   - Tabelas: `riscos`, `riscos_mitigacao`, `riscos_avaliacoes`

2. **Compliance Calendar (Agenda Regulatória)**
   - Calendário de obrigações por lei (Lei 12.846, LGPD, BACEN, CVM, Simples Nacional)
   - Alertas de vencimento de prazo
   - Integração com Google Calendar existente
   - Tabelas: `compliance_obrigacoes`, `compliance_alertas`

3. **LGPD Compliance Module**
   - Inventário de dados pessoais (ROPA — Record of Processing Activities)
   - Gestão de consentimentos
   - Workflow de Data Subject Requests (DSR)
   - Relatório de impacto (DPIA)
   - Tabelas: `lgpd_ativos_dados`, `lgpd_consentimentos`, `lgpd_solicitacoes`

4. **Gestão de Investigações (vinculado ao canal de denúncias)**
   - Fluxo formal: Recebida → Em análise → Investigando → Concluída → Arquivada
   - Assignee (responsável pela investigação)
   - Registro de evidências e notas internas sigilosas
   - Prazo de resposta com SLA

#### 🔴 ALTA — Diferencial competitivo importante

5. **Conflitos de Interesse (Disclosure)**
   - Formulário de declaração periódica por colaborador/consultor
   - Workflow de aprovação pelo gestor
   - Histórico de declarações por pessoa
   - Tabelas: `conflitos_interesse`, `conflitos_historico`

6. **Gestão de Políticas Corporativas**
   - Biblioteca de políticas (Política de Privacidade, Código de Conduta, Política Anticorrupção, etc.)
   - Workflow de criação → revisão → aprovação → publicação
   - Aceite digital rastreável (complementa o código de ética)
   - Diferente de "documentos" — é uma categoria própria com workflow rígido

7. **Third-Party Risk (Fornecedores)**
   - Cadastro de fornecedores críticos
   - Questionário de due diligence automatizado
   - Score de risco calculado
   - Alertas de renovação de avaliação
   - Tabelas: `fornecedores`, `fornecedores_avaliacoes`

8. **Canal de Denúncias: Melhorias**
   - Triagem/categorização automática por IA (ex: assédio, fraude, corrupção, LGPD)
   - Dashboard de KPIs: volume por categoria, tempo médio de resposta, taxa de anonimato
   - Link/QR code público para denúncias externas (sem login)

#### 🟡 MÉDIA — Agrega valor mas não é blocker

9. **ESG Dashboard** — indicadores ambientais, sociais e de governança para diretoria
10. **Board Reporting** — dashboard executivo read-only para membros do conselho
11. **Benchmark setorial** no diagnóstico de maturidade (comparar score com média do setor)
12. **SCORM player** para importar cursos externos de e-learning
13. **SSO / SAML** para tenants enterprise (SAML2, Azure AD, Google Workspace)

#### 🔵 BAIXA — Futuro ou raramente usado por PMEs

14. API pública REST para integrações customizadas
15. Integração ERP (TOTVS Protheus) — apenas para PMEs médias/grandes
16. Mobile app nativo (PWA é suficiente no curto prazo)
17. i18n multi-idioma (inglês + espanhol para expansão regional)

### O que Simplificar ou Remover

| Item | Situação | Recomendação |
|---|---|---|
| **Integração Trello** | Implementada mas nunca usada | Remover ou manter apenas como "Em breve" sem edge function ativa |
| **Kanban complexo** | PMEs preferem lista simples | Simplificar para lista de tarefas com status; remover board visual |
| **Geração de contrato via IA** | Diferencial, mas periférico | Manter como template editável, não como geração IA autônoma (risco jurídico) |
| **`plano_config` table** | Existe mas sem UI | Definir planos reais ou remover |
| **Lovable AI Gateway** | Removido do código | Limpar referências residuais em comentários e variáveis |
| **`integration_sync` table** | Sync de dados externos sem uso real | Manter schema, mas não implementar UI ainda |
| **ClickUp/Trello sync edge functions** | Deployadas mas sem cliente usando | Desativar para reduzir custos de compute; reativar sob demanda |

### Diferenciais Competitivos do GIG vs. Mercado

O GIG já possui funcionalidades que muitos concorrentes de mesmo porte **não têm**:

| Diferencial | Por que é relevante |
|---|---|
| **Agente de IA conversacional** integrado | Apenas top players (NAVEX, Diligent) têm; nenhum nacional tem |
| **Transcrição automática de reuniões** (Fireflies) → geração de atas via IA | Único no segmento PME BR |
| **Geração de documentos via IA** (código de ética, análise, ata, contrato) | Diferencial tecnológico forte |
| **Multi-tenant white-label** com roles granulares | Permite revenda/consultoria (modelo Cavendish) |
| **Consultores como intermediários** (modelo único) | GoPliance, clickCompliance são direto ao cliente; GIG tem camada de consultoria |
| **Google Calendar nativo** para agendamento de reuniões de compliance | Nenhum concorrente BR tem isso nativo |

---

## 17. Decisões de Arquitetura

### Por que Next.js + React Router (híbrido)?
O projeto foi inicialmente desenvolvido com Vite + React (SPA pura) e depois migrado para Next.js. Para preservar toda a lógica de roteamento existente sem reescrita, optou-se pela abordagem de catch-all: o Next.js gerencia páginas públicas com SSR/build estático, enquanto a SPA autenticada roda inteiramente no cliente via React Router.

### Por que `supabase/client.ts` com proxy SSR?
O Next.js executa imports durante o build (SSR). O cliente Supabase falha se as env vars não estiverem presentes. O proxy com `typeof window !== 'undefined'` garante que o cliente real só seja instanciado no browser, com no-ops no servidor.

### `as any` no código Supabase — status após 2026-03-02
O arquivo `integrations/supabase/types.ts` foi regenerado via Management API após aplicar todas as migrations e agora cobre as 40 tabelas completas. As 116 instâncias de `as any` foram removidas e substituídas por:
- Tipos corretos das tabelas (para queries simples)
- `as unknown as T` (para joins com tipos compostos que o gerador não infere perfeitamente, ex: `ProjetoComOrganizacao`)
- `as any` mantido apenas nos 2 casos justificados: upsert parcial em `ConsultorTarefas.tsx` e insert de `Partial<Template>` em `useTemplates.ts` (campo obrigatório `categoria` ausente em criação programática)
- Para regenerar tipos no futuro: `GET https://api.supabase.com/v1/projects/fenfgjqlsqzvxloeavdc/types/typescript` (header: `Authorization: Bearer sbp_xxx`)

### Por que `handle_new_user` atribui role `cliente` por padrão?
Por segurança: nenhum usuário deve ter acesso privilegiado automaticamente. Consultores são pré-cadastrados via `consultant_pre_registrations` e recebem a role no signup. Admins são promovidos manualmente via SQL ou script `tools/grantRole.mjs`.

### Por que `fetchingUserIdRef` em vez de remover o `getSession()`?
A chamada dupla acontece porque o pattern recomendado pelo Supabase era usar ambos (antes do `INITIAL_SESSION` event). O `useRef` é a correção menos invasiva — não altera o comportamento de inicialização, apenas deduplicação as queries.
