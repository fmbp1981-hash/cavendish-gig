# Fase 5 — Automação (follow-up, score, campanhas)

Depende da Fase 4 (WhatsApp funcional) — follow-up e campanhas disparam mensagens reais.

## Functional Specification

### Behavior: followup-automatico

Precondition: lead com `proximo_followup_em` no passado e `modo_humano = false`.

Happy path:
- `pg_cron` chama `trigger_prospeccao_followup()` (wrapper `SECURITY DEFINER`, lê `cron_secret` de
  `system_settings`, mesmo padrão de `compliance-alerts`) → `POST prospeccao-followup-cron`
- Edge Function processa `prospeccao_fila_followup` com `status='pendente'` e `enviar_em <= now()`
  → dispara `send-whatsapp` por item → atualiza `status` (`enviado`/`falhou`)

Edge cases: lead respondeu entre o agendamento e o disparo → checar `ultimo_contato_em` antes de
enviar; se mais recente que o agendamento, cancelar o follow-up (`status = 'ignorado'`).

Error cases: Evolution API fora do ar → `status = 'falhou'`, `erro` preenchido, não trava o resto
da fila.

### Behavior: recalculo-score

Happy path: `pg_cron` diário → `prospeccao-score-cron` → recalcula `ai_score` de leads ativos
(não `convertido`/`perdido`) com base em sinais simples (tempo desde último contato, quantidade de
interações, presença de `website`/`ai_resumo`) — **regra de score exata é decisão de produto a
confirmar antes do `/plan`**, não inventar uma fórmula arbitrária sem validar.

### Behavior: disparo-campanhas

Happy path:
- Admin/representante cria `prospeccao_campanhas` (nome, categoria, `funil_etapa_id` alvo) e
  associa leads via `prospeccao_campanha_leads`
- Ação "Disparar" (manual, `status: rascunho → executando`) ou agendada (`agendada_para`, via
  `pg_cron` similar aos outros) → `prospeccao-campaign-dispatch` envia `send-whatsapp` em lote
  (com throttle — não estourar rate limit da Evolution API), atualiza `total_enviados`

Edge cases: lead sem telefone/WhatsApp na campanha → pula, conta em `total_falhas` (adicionar essa
coluna se não existir, ou usar `total_leads - total_enviados - total_respostas` como falhas
implícitas — decidir no `/plan`).

## Files

### Files to Create
- `supabase/migrations/YYYYMMDDHHMMSS_finder_cron_followup_score.sql` — `pg_cron` jobs
- `supabase/functions/prospeccao-followup-cron/index.ts`
- `supabase/functions/prospeccao-score-cron/index.ts`
- `supabase/functions/prospeccao-campaign-dispatch/index.ts`
- `src/hooks/useProspeccaoCampanhas.ts`
- `src/spa/pages/admin/AdminFinderCampanhas.tsx` + `src/spa/pages/representante/RepresentanteFinderCampanhas.tsx`
- `src/components/prospeccao/campanha-form-dialog.tsx`

### Files to Modify
- `src/App.tsx` — rotas `/admin/finder/campanhas`, `/representante/finder/campanhas`
- `src/components/layout/AdminLayout.tsx`, `RepresentanteLayout.tsx` — item de menu

## Notes

- Regra de recálculo de `ai_score` precisa de decisão de produto antes do `/plan` desta issue —
  não implementar um algoritmo especulativo.
- Throttle de envio em campanha: confirmar limite de mensagens/minuto da conta Evolution API do
  cliente antes de fixar um valor.

## Tasks
- [ ] Migration `pg_cron` (followup + score)
- [ ] `prospeccao-followup-cron`
- [ ] `prospeccao-score-cron` (regra de score confirmada com o usuário antes de implementar)
- [ ] `prospeccao-campaign-dispatch`
- [ ] Hooks + telas de campanhas (admin + representante)
- [ ] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [ ] Confirmar: nenhum arquivo fora da lista acima foi modificado
