# Módulo Finder — SPEC (Fases 4-9)

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

## Fases restantes — behaviors por fase

Cada fase abaixo tem um arquivo de issue em `docs/finder-issues/NN-nome.md` com a especificação
completa (Functional Spec, Files to Create/Modify, Notes, Tasks). Ordem de execução é sequencial
— uma fase só começa depois do `/plan` da fase anterior fechado com checklist verde.

### Fase 4 — WhatsApp + Agente de IA conversacional
- **enviar-mensagem-whatsapp**: substitui o stub 503 de `send-whatsapp` por implementação real via Evolution API
- **receber-mensagem-whatsapp**: novo webhook `whatsapp-webhook`, resolve lead por telefone
- **conversar-com-agente**: `prospeccao-agent` orquestra IA com function-calling (ferramentas do blueprint §8.1)
- **transferir-para-humano**: ferramenta do agente marca `modo_humano = true`, cancela follow-ups

### Fase 5 — Automação (cron)
- **followup-automatico**: `pg_cron` dispara `prospeccao-followup-cron`
- **recalculo-score**: `pg_cron` dispara `prospeccao-score-cron`
- **disparo-campanhas**: `prospeccao-campaign-dispatch` + tela de campanhas em massa

### Fase 6 — Agendamento de fechamento (Alberto Cavendish)
- **consultar-disponibilidade**: nova ação `freebusy` na Edge Function `google-calendar`
- **agendar-reuniao-fechamento**: `prospeccao-agendar-fechamento`, aplica regras de negócio (horário comercial, antecedência, janela de busca — decisões já tomadas em conversa anterior)
- **notificar-sem-slot**: fallback quando não há horário livre (notifica admin — decisão já tomada)

### Fase 7 — Conversão lead → organização/parceiro
- **converter-lead-organizacao**: cria `organizacoes` + `organization_members` (role `cliente`), só depois da reunião confirmada (modelo Gate — decisão já tomada)
- **converter-lead-parceiro**: cria usuário `role = 'parceiro'` para a categoria `parceiro_indicador`

### Fase 8 — Dashboard e ranking
- **dashboard-finder-admin**: `AdminFinderDashboard.tsx` — funil agregado, ranking por representante, reuniões próximas
- **crud-metas-representante**: tela simples de definição de metas mensais

### Fase 9 — Configuração de agentes por categoria
- **crud-agent-configs**: `AdminFinderConfiguracoes.tsx` — prompt de sistema, provider, temperatura, RAG toggle por categoria

### Fase 10 — RAG (opcional, fora deste plano)
Só entra se o time decidir usar base de conhecimento por agente — requer `pgvector`, ainda não
habilitado no projeto.

## Decisões de produto já fechadas (não reabrir sem motivo novo)

- Acesso ao Finder: só `admin` + `representante`.
- Calendário do Alberto: Opção A (compartilhamento direto do Google Calendar pessoal).
- Reunião de fechamento é **Gate**: só converte em organização depois da reunião confirmada.
- Parâmetros de agenda: 09h-18h dias úteis, 30 min, antecedência mínima 24h, busca em 5 dias úteis.
- Sem slot disponível → notifica admin.
- Firecrawl descartado; enriquecimento via `url_context` do Gemini (Fase 3, já implementado).
- Gemini no free tier do Google AI Studio por enquanto (decisão consciente sobre uso de dados pelo Google).
- `xlsx`(npm)/SheetJS descartado por CVEs — `exceljs` no lugar (Fase 2, já implementado).
