# Módulo Finder — SPEC (Fases 4-9, ✅ core completo)

> Adaptado da disciplina Epic-Workflow (`/spec → /break → /plan → /execute`) para a arquitetura
> real deste repositório. **Nota de adaptação:** o template original da skill assume Next.js App
> Router com `app/(pages)/[rota]/behaviors/[nome]/{index.ts, actions.ts, test.ts}` e agentes
> especializados por tipo de arquivo — isso **não existe** no `cavendish-gig` (SPA React Router +
> TanStack Query + Supabase direto do client + Edge Functions). Aqui, "behavior" = uma unidade de
> comportamento isolada e testável, mas mapeada para os caminhos reais do projeto: hooks em
> `src/hooks/`, páginas em `src/spa/pages/`, lógica de servidor em `supabase/functions/`. Ver
> `FINDER_MODULE_SPEC.md §7` para o histórico dessa decisão.

## Overview

O Finder automatiza a geração de pipeline comercial da Cavendish: encontra leads B2B (Google
Places), qualifica via WhatsApp + agente de IA, funil kanban por representante, agenda reunião de
fechamento com Alberto respeitando a agenda dele, e converte o lead numa organização real do
Sistema GIG.

## Regras invioláveis (herdadas do Epic-Workflow, válidas aqui)

1. **Thin client, fat server** — segredos (API keys, tokens) e lógica de negócio sensível vivem em
   Edge Functions, nunca no client. Já seguido em todas as fases (`loadIntegration()`, vault).
2. **Nenhum arquivo fora do que está listado em "Files to Create/Modify" de cada issue** sem
   sinalizar antes e ajustar o plano.
3. **RLS sempre habilitado** na mesma migration que cria a tabela — sem exceção.
4. **`tsc --noEmit` + `npm run build` + `eslint` limpos antes de cada commit.**
5. Nunca avançar para a próxima fase sem apresentar o que foi feito e aguardar sinal do usuário
   (mesmo que informal — "continue", "siga para a fase X").

## Fases já concluídas (PR #1)

| Fase | Entregável | Status |
|---|---|---|
| 1 | RBAC `representante` + schema `prospeccao_*` + RLS | ✅ |
| 2 | Hooks + KanbanBoard genérico + páginas Leads/Funil (admin+representante) | ✅ |
| 3 | Busca Google Places + enriquecimento via `url_context` (Gemini) + telas de busca | ✅ |
| 4 | WhatsApp dual-provider (Evolution API + Cloud API oficial, sem credenciais ainda) + `prospeccao-agent` (function-calling, só Gemini) + `ConversaPanel` | ✅ |
| 5 | Follow-up automático (`pg_cron`), recálculo de `ai_score` (SQL puro), campanhas em massa | ✅ |
| 6 | Agendamento automático de fechamento (`freebusy` + evento + `reunioes` + notificação lead/admin) | ✅ |
| 7 | Conversão lead → organização/parceiro (`prospeccao-converter-lead` + pré-registro vinculado a organização) | ✅ |
| 8 | Dashboard admin (totais do mês, ranking por representante, funil agregado, reuniões próximas) + CRUD de metas | ✅ |
| 9 | Configuração de agentes por categoria (`AdminFinderConfiguracoes.tsx`, 7 categorias) | ✅ |

**Core do módulo Finder completo** (Fases 1-9). Revisão end-to-end feita ao fechar a Fase 9 — ver
seção própria abaixo. Resta só a Fase 10 (RAG), opcional e fora deste plano por padrão.

## Fase restante (opcional)

### Fase 10 — RAG (opcional, fora deste plano)
Só entra se o time decidir usar base de conhecimento por agente — requer `pgvector`, ainda não
habilitado no projeto. `usa_rag` já existe no schema de `prospeccao_agent_configs` (Fase 1) e a UI
da Fase 9 já mostra o toggle (desabilitado, com essa explicação) — nenhum trabalho extra de UI
necessário quando essa fase for priorizada, só a Edge Function/embedding pipeline em si.

## Revisão end-to-end do módulo (ao fechar a Fase 9)

Conferência de que a cadeia completa está de fato conectada, não só que cada fase compila
isoladamente:

- **Busca → Leads**: `prospeccao-search` grava em `prospeccao_leads` com `funil_etapa_id` da
  primeira etapa do funil padrão da categoria (seed da Fase 2) — leads buscados aparecem direto no
  Kanban, sem etapa manual.
- **Kanban → Agente**: mover um lead no funil (`useMoverLeadEtapa`) e acionar o agente
  (`ConversaPanel`) atualizam a mesma linha de `prospeccao_leads` que a busca criou — sem tabela
  paralela.
- **Agente → Agendamento**: `transferir_para_humano` (tool do agente) não cria a reunião sozinho —
  o representante aciona `AgendarFechamentoButton` manualmente no drawer, que já reflete
  `reuniao_fechamento_id` tanto no card (`CalendarCheck`) quanto no dashboard (reuniões próximas).
- **Agendamento → Conversão**: o Gate (`reunioes.status = 'realizada'`) só pode ser satisfeito pelo
  botão adicionado na Fase 7 dentro do próprio `ConverterLeadDialog` — confirmado que não existe
  nenhum outro caminho no sistema que marque isso, então o fluxo não fica travado sem UI.
- **Conversão → Dashboard**: `converter_organizacao`/`converter_parceiro` fazem `status =
  'convertido'`, que é exatamente o filtro usado pelos totais/ranking do dashboard (Fase 8) — os
  números batem sem transformação adicional.
- **Config de agentes → Agente**: `prospeccao-agent` lê `prospeccao_agent_configs` por
  `categoria + ativo=true` a cada chamada (não cacheia) — mudar o prompt/provider na tela da Fase 9
  tem efeito imediato na próxima mensagem, sem precisar reiniciar nada.
- **Rotas e menu**: todas as 6 páginas admin do Finder (`/admin/finder`, `/busca`, `/leads`,
  `/funil`, `/campanhas`, `/configuracoes`) têm rota em `App.tsx` e item correspondente em
  `AdminLayout.tsx`; representante tem as 4 que fazem sentido pro papel dele (`/busca`, `/leads`,
  `/funil`, `/campanhas` — sem dashboard/configurações, que são admin-only por design).

Nenhuma lacuna de integração encontrada nessa revisão — os pontos que precisavam de teste manual
real (credenciais de WhatsApp/Google Places/Calendar) continuam listados no test plan do PR, já
que não há como validar isso sem as credenciais de produção configuradas.

## Decisões de produto já fechadas (não reabrir sem motivo novo)

- Acesso ao Finder: só `admin` + `representante`.
- Calendário do Alberto: Opção A (compartilhamento direto do Google Calendar pessoal).
- Reunião de fechamento é **Gate**: só converte em organização depois da reunião confirmada
  (`reunioes.status = 'realizada'` — Fase 7, já implementado).
- Parâmetros de agenda: 09h-18h dias úteis, 30 min, antecedência mínima 24h, busca em 5 dias úteis.
- Sem slot disponível → notifica admin.
- Firecrawl descartado; enriquecimento via `url_context` do Gemini (Fase 3, já implementado).
- Gemini no free tier do Google AI Studio por enquanto (decisão consciente sobre uso de dados pelo Google).
- `xlsx`(npm)/SheetJS descartado por CVEs — `exceljs` no lugar (Fase 2, já implementado).
- Regra de `ai_score` (Fase 5, já implementado): +8/etapa avançada (até 40) + 10/resposta do lead
  (até 30) + 5 cada por email/website/cnpj preenchidos (até 15) − 2/dia de inatividade além de
  3 dias de folga (até −20). Recalculado 1x/dia via SQL puro, só para leads sem contato nas
  últimas 24h (não sobrescreve o score que o agente setou numa conversa ativa). Ver
  `supabase/migrations/20260708140000_finder_score_recalc_cron.sql`.
- ID do calendário do Alberto (Fase 6, já implementado): não é uma linha em `system_settings` —
  fica em `integrations.config.alberto_calendar_id` da própria integração `google-calendar`
  (Admin → Integrações), reaproveitando o vault que já existe em vez de criar uma segunda fonte de
  configuração. Convenção: esse ID é o email do calendário pessoal do Alberto.
- Convite de contato na conversão (Fase 7, já implementado): não existe (nem existia antes desta
  fase) nenhum mecanismo de criação/convite de usuário server-side no projeto — só
  `user_pre_registrations` (email → role, aplicado no signup via `handle_new_user()`). Estendido
  com uma coluna `organizacao_id` nullable em vez de criar um sistema de convite por email novo; a
  pessoa ainda precisa se cadastrar sozinha com o mesmo email (é avisada disso por WhatsApp/email).
  Ver `supabase/migrations/20260708150000_finder_pre_registration_org_link.sql`.
- Dashboard do Finder (Fase 8, já implementado): `FINDER_MODULE_SPEC.md §4.1` (mockup citado na
  issue original) nunca existiu no repositório — spec usada foi só a lista de bullets da própria
  issue. Agregações client-side (sem VIEW/RPC dedicada); `convertidos`/`taxa` usam `updated_at`
  como proxy de "quando converteu" e `contatados` usa `status <> 'novo'` como proxy de "já
  contatado" — limitações conhecidas, não novas migrations. `responderam` reaproveita o mesmo
  sinal de `role='user'` em `prospeccao_conversas` já usado pelo `ai_score` (Fase 5).
