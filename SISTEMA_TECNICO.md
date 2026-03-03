# SISTEMA_TECNICO.md — Sistema GIG (Cavendish)
> Documento vivo de contexto técnico completo. Atualizar a cada modificação, feature, fix ou decisão relevante.

**Última atualização:** 2026-03-02 (schema DB completo — 39 tabelas + fix admin redirect)
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
16. [Decisões de Arquitetura](#16-decisões-de-arquitetura)

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

### Funções e Triggers
- `handle_new_user()` — Trigger `after insert on auth.users`: cria `profile` + role `cliente` padrão
- `is_admin(user_id)` — Verifica se usuário tem role `admin` via `user_roles`
- `has_role(user_id, role)` — Verifica role específica
- `create_client_onboarding(...)` — RPC SECURITY DEFINER para onboarding completo

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
signIn(email, password)
signUp(email, password, { nome?, empresa? })
signOut()
resetPassword(email)
updatePassword(newPassword)
hasRole(role: AppRole)
isAdmin, isConsultor, isCliente
```

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

| Function | JWT | Descrição |
|----------|-----|-----------|
| `ai-generate` | ✅ sim | Geração de documentos, atas, relatórios com GPT-4 |
| `google-drive` | ✅ sim | CRUD de pastas e arquivos no Google Drive |
| `google-calendar` | ✅ sim | Criar eventos com Google Meet |
| `send-email` | ✅ sim | Envio de emails via Resend |
| `send-whatsapp` | ✅ sim | Envio de mensagens via Twilio |
| `process-transcription` | ✅ sim | Ingestão de transcrição do Fireflies + geração de ata |
| `generate-monthly-report` | ✅ sim | Geração de relatório mensal HTML |
| `send-monthly-reports` | ✅ sim | Disparo de relatórios mensais por email |
| `document-reminders` | ✅ sim | Lembretes de documentos pendentes (cron) |
| `denuncias` | ❌ não | Canal de denúncias público (sem auth) |
| `integrations` | ✅ sim | Hub de integrações configuradas por org |
| `clickup-sync` | ✅ sim | Sincronização de tarefas com ClickUp |
| `trello-sync` | ✅ sim | Sincronização de tarefas com Trello |

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
│   │   ├── consultor/                   ← 11 páginas consultor
│   │   └── cliente/                     ← 8 páginas cliente
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── ConsultorLayout.tsx
│   │   │   └── ClienteLayout.tsx
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
│   │   └── AuthContext.tsx              ← Estado de auth, user, roles, profile
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
RESEND_API_KEY=re_xxxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}  # JSON completo
FIREFLIES_API_KEY=ff_xxxx
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

**Status final:** 39 tabelas no schema público, RLS ativo em todas, seed data carregado.

---

## 15. Pendências e Roadmap

### Alta prioridade
- [ ] **Configurar variáveis de ambiente no Vercel** (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY)
- [x] **Aplicar todas as migrations** no Supabase de produção — CONCLUÍDO em 2026-03-02
- [ ] **Deploy das Edge Functions** (`supabase functions deploy`)
- [ ] **Configurar Resend** (domínio verificado + API key)
- [ ] **Webhook Fireflies** apontar para URL da Edge Function

### Média prioridade
- [ ] **White-label completo com subdomínio** por organização
- [ ] **Envio automático de relatórios mensais** (cron no Supabase pg_cron)
- [ ] **Notificações push / Realtime** no frontend (Supabase Realtime subscriptions)
- [ ] **Rota `/parceiro`** dedicada para usuários com role `parceiro`

### Baixa prioridade / Future
- [ ] SSO corporativo (SAML/OAuth2 enterprise)
- [ ] Analytics avançado (cohort, funil)
- [ ] i18n multi-idioma
- [ ] Templates com editor drag-and-drop
- [ ] Chatbot interno

---

## 16. Decisões de Arquitetura

### Por que Next.js + React Router (híbrido)?
O projeto foi inicialmente desenvolvido com Vite + React (SPA pura) e depois migrado para Next.js. Para preservar toda a lógica de roteamento existente sem reescrita, optou-se pela abordagem de catch-all: o Next.js gerencia páginas públicas com SSR/build estático, enquanto a SPA autenticada roda inteiramente no cliente via React Router.

### Por que `supabase/client.ts` com proxy SSR?
O Next.js executa imports durante o build (SSR). O cliente Supabase falha se as env vars não estiverem presentes. O proxy com `typeof window !== 'undefined'` garante que o cliente real só seja instanciado no browser, com no-ops no servidor.

### Por que `as any` em `supabase.from('profiles')`?
Os tipos gerados em `integrations/supabase/types.ts` nem sempre incluem todas as tabelas (depende de regeneração via `supabase gen types`). O `as any` é um workaround temporário. A solução definitiva é rodar `supabase gen types typescript --project-id [ID] > src/integrations/supabase/types.ts` após aplicar as migrations.

### Por que `handle_new_user` atribui role `cliente` por padrão?
Por segurança: nenhum usuário deve ter acesso privilegiado automaticamente. Consultores são pré-cadastrados via `consultant_pre_registrations` e recebem a role no signup. Admins são promovidos manualmente via SQL ou script `tools/grantRole.mjs`.

### Por que `fetchingUserIdRef` em vez de remover o `getSession()`?
A chamada dupla acontece porque o pattern recomendado pelo Supabase era usar ambos (antes do `INITIAL_SESSION` event). O `useRef` é a correção menos invasiva — não altera o comportamento de inicialização, apenas deduplicação as queries.
