# Manual Formal — Sistema GIG (Cavendish)

**Versão:** 1.0

## 1. Objetivo do sistema
O Sistema GIG (Gestão Integrada de Governança) é uma plataforma web para operar um programa de Governança e Compliance por **organização**, concentrando:
- diagnóstico de maturidade;
- coleta e validação de evidências (documentos);
- gestão de tarefas/pendências;
- treinamentos com avaliação e certificado;
- código de ética (geração, publicação e adesão);
- canal de denúncias com protocolo;
- relatórios e indicadores de acompanhamento;
- integrações e automações (Drive, calendário, e-mail, WhatsApp/SMS, IA, relatórios/l lembretes).

O foco é **rastreabilidade**, **padronização** e **visibilidade executiva** do programa.

## 2. Perfis (papéis) e responsabilidades
O sistema é orientado a papéis (roles). Em alto nível:

### 2.1 Admin
- governa configurações do sistema;
- gerencia usuários, organizações e integrações;
- acesso a telas administrativas (rotas `/admin/*`).

### 2.2 Consultor
- conduz a implantação/recorrência por organizações atribuídas;
- valida documentos (aprova/rejeita com observações);
- opera tarefas (Kanban);
- trata denúncias no painel;
- emite relatórios e pode disparar rotinas operacionais (ex.: envios).

### 2.3 Cliente / Colaborador
- executa as atividades do programa:
  - responde diagnóstico;
  - envia documentos/evidências;
  - realiza treinamentos (quiz + certificado);
  - registra adesão ao Código de Ética;
  - acompanha progresso do projeto.

### 2.4 Público (sem login)
- acesso ao Canal de Denúncias e consulta por protocolo (sem autenticação).

## 3. Arquitetura e tecnologia (visão resumida)
- **Frontend:** Next.js + React + TypeScript + Tailwind + shadcn-ui.
- **Arquitetura de rotas:** Next.js App Router hospedando um SPA (React Router) via rota catch-all.
- **Backend:** Supabase (Auth, DB/Postgres, Storage, RLS) + Edge Functions.
- **Relatórios/PDF:** geração client-side via `html2canvas` + `jsPDF`.
- **Analytics:** gráficos com Recharts.

## 4. Módulos funcionais (por persona)

### 4.1 Cliente / Colaborador
#### 4.1.1 Meu Projeto (visão geral)
- acompanha fase do programa (Diagnóstico → Implementação → Recorrência);
- indicadores de progresso (ex.: documentos aprovados/pedentes);
- ações rápidas para execução.

#### 4.1.2 Diagnóstico de maturidade
- questionário em dimensões (estrutura societária, governança, compliance, gestão, planejamento);
- score geral e por dimensão;
- nível de maturidade e recomendações (pontos fortes/pontos de atenção, quando disponíveis).

#### 4.1.3 Documentos (evidências)
- lista de documentos requeridos (obrigatórios e complementares) com status;
- upload/envio de documentos;
- reenvio quando rejeitado;
- repositório de documentos aprovados com download e visualização.

#### 4.1.4 Treinamentos
- trilhas com conteúdos;
- avaliação via quiz;
- aprovação por nota mínima;
- emissão/consulta de certificados.

#### 4.1.5 Código de Ética
- acesso à versão ativa do Código de Ética;
- registro de adesão formal (termo de adesão) por usuário.

### 4.2 Consultor
#### 4.2.1 Dashboard do Consultor
- visão consolidada por organizações atribuídas;
- indicadores por status de documentos, evolução, tarefas e progresso.

#### 4.2.2 Gestão e validação de documentos
- fila de documentos enviados para análise;
- aprovar/rejeitar com observação;
- notificações automáticas (quando integrações habilitadas).

#### 4.2.3 Tarefas (Kanban)
- quadro com colunas por status;
- drag-and-drop;
- ordenação e acompanhamento;
- utilidade típica: plano de ação, pendências e atividades recorrentes.

#### 4.2.4 Canal de denúncias (painel)
- visualiza denúncias registradas;
- atualiza status e adiciona observações internas.

#### 4.2.5 IA — geração de documentos
- geração de Código de Ética e outros artefatos conforme fluxos de IA;
- modo streaming (texto aparece progressivamente);
- exportação/cópia do conteúdo.

#### 4.2.6 IA — atas de reunião
- preenchimento guiado (organização, data/hora, participantes, notas);
- geração de ata em markdown;
- exportação/cópia.

#### 4.2.7 Relatório mensal (dashboard + PDF)
- seleção de organização;
- consolidação de indicadores do mês:
  - documentos (total/aprovados/pendentes/rejeitados/enviados);
  - diagnóstico (score, níveis e pontos fortes/atenção);
  - adesões ao Código de Ética;
  - conclusão de treinamentos;
- download do relatório em PDF.

### 4.3 Admin
- gestão de usuários, consultores e organizações;
- configuração e governança de integrações;
- visões administrativas e segurança (conforme rotas `/admin/*`).

## 5. Integrações e automações

### 5.1 E-mail (Resend)
- e-mails transacionais (ex.: documento aprovado, rejeitado, enviado, lembrete de documentos pendentes);
- acesso protegido: apenas `admin`/`consultor` podem acionar funções sensíveis.

### 5.2 WhatsApp/SMS (Twilio)
- envio de WhatsApp/SMS para notificações operacionais;
- templates prontos para:
  - documento pendente;
  - documento aprovado;
  - documento rejeitado.

### 5.3 Lembretes de documentos (cron)
- Edge Function que varre documentos obrigatórios pendentes/rejeitados;
- envia lembretes por e-mail;
- exige `CRON_SECRET` via header `x-cron-secret`.

### 5.4 Relatórios mensais por e-mail (cron)
- geração/envio automático de relatórios mensais (Rotina de cron) e log de envios.

### 5.5 Google Drive
- estrutura de pastas padrão por cliente;
- upload e preview/embeds conforme integração.

### 5.6 IA (Edge Function)
- geração de documentos e artefatos de governança;
- suporte a múltiplos “tipos” de geração e modo streaming.

## 6. Segurança, governança de dados e evidências

### 6.1 Multi-tenant e RLS
- o acesso a dados é controlado por **RLS (Row Level Security)**;
- consultores tendem a ver apenas organizações atribuídas;
- admins operam configurações e dados com base em role.

### 6.2 Papéis (roles) e checagem server-side
- o frontend usa roles para habilitar portais e rotas;
- Edge Functions sensíveis validam role (`admin`/`consultor`) no backend.

### 6.3 Canal de denúncias (privacidade)
- o fluxo público gera **protocolo + segredo** para consulta;
- objetivo: permitir acompanhamento sem exigir identificação do denunciante.

### 6.4 Evidências típicas para auditoria
- status e histórico de documentos;
- comentários e observações de análise;
- registro de adesão ao Código de Ética;
- certificados de treinamento;
- relatórios mensais (PDF);
- logs de envio de relatórios (tabela/visão de envios).

## 7. Procedimentos operacionais (runbook)

### 7.1 Rodar localmente (resumo)
- instalar dependências: `npm install`
- subir dev server: `npm run dev`
- Supabase local (se aplicável): `supabase start` + `supabase db push`

Para passos detalhados, consulte: `GUIA_ATIVACAO_TUTORIAIS.md`.

### 7.2 Variáveis/segredos (alto nível)
- Supabase URL/keys (frontend e service role para automações administrativas)
- Resend: `RESEND_API_KEY`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Cron: `CRON_SECRET`

### 7.3 Gestão de acessos — promover admin (robusto)
**Recomendação (robustez):** manter a lógica de admin **role-based** (sem “admin por email”) e promover usuários via operação controlada (SQL/Script) usando `service_role`.

#### Opção A — SQL no Supabase (manual e direta)
1) localizar o usuário:
```sql
select id, email, nome from public.profiles where lower(email) = lower('fmbp1981@gmail.com');
```
2) promover a admin:
```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from public.profiles
where lower(email) = lower('fmbp1981@gmail.com')
on conflict do nothing;
```

#### Opção B — Script (recomendado para repetibilidade)
Use o script `tools/grantRole.mjs` (ver seção 7.4).

### 7.4 Script de promoção (admin)
- Pré-requisitos: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- Execução:
```bash
npm run admin:promote
```

### 7.5 Gestão de acessos — promover consultor (via operação controlada)
Observação: o sistema já permite ao Admin promover usuários a consultor pela UI em `/admin/usuarios`.
Em cenários de bootstrap/migração, você pode promover via script:

```bash
npm run admin:grant-role -- --email usuario@exemplo.com --role consultor
```

## 8. Troubleshooting (rápido)
- **Não consigo acessar `/admin`:** confirme que o usuário tem role `admin` em `user_roles`.
- **E-mails não saem:** confirme integração Resend habilitada e `RESEND_API_KEY` configurada.
- **WhatsApp/SMS não envia:** confirme Twilio habilitado e credenciais configuradas.
- **Cron não executa:** confirme que o job envia `x-cron-secret` e que `CRON_SECRET` está definido.

## 9. Referências internas
- Implementações: `IMPLEMENTACOES_COMPLETAS.md`
- Migrações/DB: `ALL_MIGRATIONS_COMPLETO.md`, `MIGRATIONS_MANUAL.md`
- Deploy: `DEPLOY_VERCEL.md`, `CONFIGURACAO_DEPLOY.md`
