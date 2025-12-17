# Configuração para Deploy - Sistema Cavendish GIG

## Visão Geral do Sistema

O Sistema Cavendish GIG é uma plataforma SaaS/white-label para entrega contínua de Governança, Integridade e Gestão Estratégica para PMEs, com integrações automáticas e IA para geração de entregáveis.

---

## Stack Tecnológica

### Frontend
- **Framework**: React + Vite + TypeScript
- **UI**: shadcn-ui + Tailwind CSS
- **Estado**: TanStack Query (React Query)
- **Roteamento**: React Router DOM

### Backend
- **Banco de Dados**: PostgreSQL (Supabase) com Row Level Security (RLS)
- **Auth**: Supabase Auth
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Storage**: Supabase Storage + Google Drive

### Integrações Principais
- **IA**: Lovable AI (integrado nativamente)
- **Email**: Resend (transacional)
- **SMS/WhatsApp**: Twilio
- **Calendar**: Google Calendar API
- **Drive**: Google Drive API
- **Transcrição**: Fireflies.ai

---

## Variáveis de Ambiente Necessárias

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://latslcjmtoppzfwwvtvp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[SUPABASE_ANON_KEY]
```

### Supabase Edge Functions (Secrets)

Configure as seguintes secrets no Supabase:

```bash
# 1. Lovable AI (já configurado automaticamente)
LOVABLE_API_KEY=[configurado_automaticamente]

# 2. Resend (Email Transacional)
RESEND_API_KEY=re_xxxxxxxxxxxx
# Obter em: https://resend.com/api-keys
# Documentação: https://resend.com/docs

# 3. Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Obter em: https://console.twilio.com
# Documentação: https://www.twilio.com/docs

# 4. Google Service Account (Calendar + Drive)
GOOGLE_SERVICE_ACCOUNT={"type": "service_account", "project_id": "...", ...}
# JSON completo da Service Account criada no Google Cloud Console
# Obter em: https://console.cloud.google.com/apis/credentials
# Documentação: https://developers.google.com/workspace/guides/create-credentials

# 5. Fireflies.ai (Transcrição de Reuniões)
FIREFLIES_API_KEY=ff_xxxxxxxxxxxx
# Obter em: https://fireflies.ai/integrations
# Documentação: https://docs.fireflies.ai
```

---

## Configuração das Integrações

### 1. Google Drive Integration

#### Passo 1: Criar Service Account no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Ative as APIs necessárias:
   - Google Drive API
   - Google Calendar API
4. Vá em **APIs & Services → Credentials**
5. Clique em **Create Credentials → Service Account**
6. Preencha os detalhes e crie
7. Acesse a Service Account criada e vá em **Keys**
8. Clique em **Add Key → Create new key → JSON**
9. Salve o arquivo JSON

#### Passo 2: Configurar no Supabase

```bash
# Copie o conteúdo do JSON e adicione como secret
supabase secrets set GOOGLE_SERVICE_ACCOUNT='{"type": "service_account", ...}'
```

#### Passo 3: Configurar pasta raiz no Google Drive

1. Crie uma pasta no Google Drive para armazenar as pastas dos clientes
2. Copie o ID da pasta (está na URL: `drive.google.com/drive/folders/[ID_AQUI]`)
3. Compartilhe a pasta com o email da Service Account (encontrado no JSON)
4. Acesse o sistema como Admin
5. Vá em **Admin → Integrações**
6. Na seção **Google Drive**:
   - Ative a integração
   - Cole o ID da pasta raiz
   - Clique em Salvar

**Estrutura de pastas criada automaticamente para cada cliente:**
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

### 2. Resend (Email Transacional)

1. Crie uma conta em [resend.com](https://resend.com)
2. Valide seu domínio em **Settings → Domains**
3. Crie uma API key em **Settings → API Keys**
4. Configure no Supabase:

```bash
supabase secrets set RESEND_API_KEY='re_xxxxxxxxxxxx'
```

**Emails automatizados enviados:**
- Documento aprovado pelo consultor
- Documento rejeitado com motivo
- Novo documento enviado pelo cliente
- Lembretes de documentos pendentes (a cada 3 dias)

### 3. Twilio (SMS/WhatsApp)

1. Crie uma conta em [twilio.com](https://twilio.com)
2. Acesse o Console para obter:
   - Account SID
   - Auth Token
3. Configure um número de telefone
4. Para WhatsApp: configure o WhatsApp Business Sandbox ou número verificado
5. Configure no Supabase:

```bash
supabase secrets set TWILIO_ACCOUNT_SID='ACxxxxxxxxxxxxxxxx'
supabase secrets set TWILIO_AUTH_TOKEN='xxxxxxxxxxxxxxxx'
```

### 4. Google Calendar (Agendamento de Reuniões)

**Usa a mesma Service Account do Google Drive**

1. Ative a Google Calendar API no Google Cloud Console
2. Compartilhe o calendário desejado com o email da Service Account
3. O sistema está pronto para criar eventos com Google Meet automaticamente

**Eventos criados automaticamente:**
- Kickoff após onboarding do cliente
- Reuniões mensais de acompanhamento

### 5. Fireflies.ai (Transcrição)

1. Crie uma conta em [fireflies.ai](https://fireflies.ai)
2. Acesse **Settings → API & Integrations**
3. Gere uma nova API Key
4. Configure o webhook:
   - URL: `https://[SEU_SUPABASE_URL]/functions/v1/process-transcription`
   - Eventos: `transcription_completed`
5. Configure no Supabase:

```bash
supabase secrets set FIREFLIES_API_KEY='ff_xxxxxxxxxxxx'
```

**Fluxo automático:**
1. Reunião gravada → Fireflies transcreve
2. Webhook envia transcrição para o sistema
3. IA gera ata automática em formato profissional
4. Ata é disponibilizada no dashboard

---

## Database Migrations

### Aplicar Migrations

As migrations estão em `supabase/migrations/`. Para aplicar:

```bash
# Local
supabase db push

# Produção (via Supabase CLI)
supabase db push --linked
```

### Migrations Importantes

1. **20251213040000_google_drive_and_notifications.sql**
   - Adiciona campos `drive_folder_id` e `drive_folder_url` em `organizacoes`
   - Cria tabela `system_settings` para configurações globais
   - Adiciona triggers de notificação para eventos de documentos
   - Atualiza função `create_client_onboarding` para retornar info do Drive

---

## Deploy

### Frontend (Vercel/Netlify)

1. **Conecte o repositório GitHub**
   - No Lovable: Settings → GitHub → Connect
   - Importe o repositório no Vercel

2. **Configure as variáveis de ambiente**:
   ```
   VITE_SUPABASE_URL=https://latslcjmtoppzfwwvtvp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=[chave_anon]
   ```

3. **Build settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Backend (Supabase)

1. **Aplicar migrations**: `supabase db push --linked`

2. **Deploy Edge Functions**:
```bash
# Deploy todas as functions
supabase functions deploy

# Ou individualmente
supabase functions deploy ai-generate
supabase functions deploy google-drive
supabase functions deploy send-email
supabase functions deploy process-transcription
supabase functions deploy generate-monthly-report
```

3. **Configurar secrets** (veja seção acima)

4. **Configurar Cron Jobs** (opcional):

Para gerar relatórios mensais automaticamente:
```sql
-- No Supabase SQL Editor
SELECT cron.schedule(
  'generate-monthly-reports',
  '0 9 1 * *', -- Todo dia 1 às 9:00
  $$
  SELECT net.http_post(
    url := 'https://[SEU_SUPABASE_URL]/functions/v1/generate-monthly-report',
    body := '{"action": "generate-all"}'::jsonb
  );
  $$
);
```

---

## Configuração Pós-Deploy

### 1. Admin - Página de Integrações

Acesse o sistema como Admin e vá em **Admin → Integrações**:

1. **Google Drive**:
   - Ativar integração
   - Inserir ID da pasta raiz

2. **Verificar status das integrações**:
   - Lovable AI: ✅ Configurado (nativo)
   - Resend: Verificar se está configurado
   - Twilio: Verificar se está configurado
   - Google Calendar: Usar mesma Service Account do Drive
   - Fireflies: Verificar se está configurado

### 2. Criar Primeiro Usuário Admin

```sql
-- No Supabase SQL Editor, após criar usuário via Auth
INSERT INTO public.user_roles (user_id, role)
VALUES ('[USER_ID]', 'admin');
```

---

## Funcionalidades Implementadas

### ✅ Must Have (Essenciais)

- [x] **Autenticação e autorização RBAC** (Admin/Consultor/Parceiro/Cliente)
- [x] **Multi-tenant com RLS** por tenant_id
- [x] **Onboarding inteligente**
  - Formulário de cadastro
  - Criação automática de pasta no Google Drive
  - Estrutura de 8 subpastas padrão
  - Geração de contrato/proposta
  - Agendamento de Kickoff (Calendar + Meet)
- [x] **Geração automática de relatórios**
  - Diagnóstico de maturidade
  - Matriz de riscos
  - Relatórios mensais em HTML
- [x] **Canal de denúncias público e anônimo**
  - Formulário sem login
  - Impossibilidade técnica de identificação
  - Protocolo de consulta
- [x] **Integração com Fireflies.ai**
  - Ingestão de transcrição via webhook
  - Pipeline assíncrono para geração de atas
  - Processamento via IA (Lovable AI)
- [x] **Sistema de tarefas interno**
  - CRUD completo
  - Atribuição de responsáveis
  - Status e prioridades
  - *(Implementado internamente, não usa ClickUp/Trello)*
- [x] **Repositório de documentos**
  - Upload para Supabase Storage
  - Upload automático para Google Drive (se habilitado)
  - Links seguros
  - Controle de permissões por usuário
- [x] **Emissão automática de certificados**
  - Sistema de treinamentos
  - Quiz de avaliação
  - Geração de certificado ao aprovar
  - Código de validação único
- [x] **Dashboard do cliente**
  - Evolução de implementação
  - Status de tarefas
  - Acesso a documentos
  - Treinamentos
- [x] **Logs de auditoria**
  - Imutáveis para responsabilização
  - Rastreamento de ações
- [x] **Encriptação**
  - TLS em trânsito
  - AES-256 em repouso
- [x] **Gestão de planos**
  - Essencial/Executivo/Premium
  - Variação de features
- [x] **Notificações transacionais**
  - Email via Resend
  - SMS/WhatsApp via Twilio
  - Sistema interno de notificações
- [x] **Triggers de notificação automática**
  - Documento enviado → notifica consultores
  - Documento aprovado → notifica cliente
  - Documento rejeitado → notifica cliente com motivo
  - Lembretes a cada 3 dias via cron

### ✅ Should Have (Importantes)

- [x] **Gerador de Código de Ética** (IA)
- [x] **Workflow de recorrência mensal**
  - Integração com Fireflies
  - Geração de atas via IA
  - Sistema de tarefas interno
- [x] **Portal do Parceiro** (com acessos segmentados)
- [x] **Dashboard de consultor**
  - Visão multiprojeto
  - Indicadores de renovações
- [x] **Relatório mensal automático** (HTML completo)
- [x] **Sistema de certificados e quizzes**
- [x] **API pública** (Edge Functions com CORS)

### ⚠️ Could Have (Desejáveis)

- [ ] White-label completo com subdomínio
- [ ] SSO corporativo (SAML/OAuth2 enterprise)
- [ ] Notificações push/websocket em tempo real
- [ ] Analytics avançado (cohort, funil)
- [ ] i18n multi-idioma
- [ ] Templates visuais configuráveis (editor drag&drop)
- [ ] Chatbot interno

### ❌ Won't Have (Fora do escopo)

- Apps mobile nativos (responsivo web apenas)
- Gestão de folha de pagamento/ERP
- Processamento de áudio proprietário

---

## Troubleshooting

### Erro ao criar pasta no Google Drive

**Problema**: `Google Drive integration not configured`

**Solução**:
1. Verifique se `GOOGLE_SERVICE_ACCOUNT` está configurado corretamente no Supabase
2. Verifique se o JSON da Service Account está válido
3. Verifique se as APIs do Google Drive estão ativadas

### Erro ao fazer upload de documento

**Problema**: Upload falha ou não aparece no Drive

**Solução**:
1. Verifique se a integração do Google Drive está ativada em Admin → Integrações
2. Verifique se o ID da pasta raiz está configurado corretamente
3. Verifique se a Service Account tem permissão na pasta raiz
4. O upload no Google Drive é em background, verifique os logs no console

### Emails não estão sendo enviados

**Problema**: `RESEND_API_KEY not configured`

**Solução**:
1. Configure a chave da Resend no Supabase
2. Valide seu domínio na Resend
3. Verifique os logs da edge function `send-email`

### Atas não estão sendo geradas

**Problema**: Webhook do Fireflies não está funcionando

**Solução**:
1. Verifique se o webhook está configurado no Fireflies com a URL correta
2. Verifique se `FIREFLIES_API_KEY` está configurado
3. Teste manualmente a edge function `process-transcription`

---

## Contato e Suporte

Para questões sobre o sistema:
- **GitHub Issues**: https://github.com/anthropics/claude-code/issues
- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Lovable**: https://docs.lovable.dev

---

## Próximos Passos Recomendados

1. **Deploy inicial**:
   - [ ] Conectar GitHub
   - [ ] Deploy no Vercel
   - [ ] Aplicar migrations no Supabase
   - [ ] Deploy das Edge Functions

2. **Configurar integrações**:
   - [ ] Google Drive (Service Account + Pasta Raiz)
   - [ ] Resend (validar domínio + API key)
   - [ ] Twilio (Account SID + Auth Token)
   - [ ] Fireflies (API key + Webhook)

3. **Configuração admin**:
   - [ ] Criar primeiro usuário admin
   - [ ] Configurar Google Drive via interface
   - [ ] Testar onboarding completo
   - [ ] Testar upload de documento

4. **Testes**:
   - [ ] Onboarding de cliente
   - [ ] Upload de documentos
   - [ ] Aprovação/rejeição de documentos
   - [ ] Geração de código de ética
   - [ ] Sistema de treinamentos e certificados
   - [ ] Canal de denúncias
   - [ ] Relatório mensal

5. **Produção**:
   - [ ] Configurar domínio customizado
   - [ ] Configurar backups automáticos
   - [ ] Monitoramento de logs
   - [ ] Rate limiting nas Edge Functions

---

**Última atualização**: 2025-12-13
