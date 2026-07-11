# Fase 6 — Agendamento de fechamento comercial (Alberto Cavendish)

> ✅ **Concluído**, com dois desvios do desenho original abaixo (ambos reduzem escopo, não
> aumentam): (1) `alberto_google_calendar_id` não virou uma coluna/linha em `system_settings` —
> ficou como `config.alberto_calendar_id` na própria integração `google-calendar` já existente no
> vault, reaproveitando a UI de configuração que já existe em vez de criar uma segunda fonte de
> configuração; (2) a notificação "sem slot" e o email de confirmação reaproveitam,
> respectivamente, a tabela `notificacoes` já existente (nenhuma mudança necessária) e uma chamada
> direta ao Resend dentro da própria `prospeccao-agendar-fechamento` (não o `send-email`, que teria
> exigido afrouxar sua checagem de role admin/consultor para aceitar uma chamada
> servidor-a-servidor sem JWT de usuário). Nenhuma migration nova foi necessária — `reunioes`,
> `prospeccao_leads.reuniao_fechamento_id` e o enum `tipo_reuniao` já tinham tudo desde a Fase 1.

Implementa o requisito mais delicado do módulo — decisões de produto já fechadas em conversa
anterior (ver `FINDER_MODULE_SPEC.md §3` e `docs/FINDER_SPEC.md`): Opção A de calendário, modelo
Gate, 09h-18h dias úteis, 30 min, antecedência mínima 24h, janela de busca 5 dias úteis, sem slot
→ notifica admin.

## Functional Specification

### Behavior: consultar-disponibilidade (nova ação `freebusy`)

Precondition: Alberto compartilhou seu Google Calendar pessoal com o e-mail da Service Account
(`client_email` do JSON já configurado em `google-calendar`), permissão "Fazer alterações em
eventos". `system_settings.alberto_google_calendar_id` preenchido manualmente uma vez.

Happy path:
- Adiciona `case "freebusy"` ao `switch(action)` existente em
  `supabase/functions/google-calendar/index.ts` (reaproveita `getAccessToken()` já existente)
- Input: `{ action: "freebusy", calendarId, timeMin, timeMax }`
- Chama `POST https://www.googleapis.com/calendar/v3/freeBusy` → retorna intervalos ocupados

Edge cases: calendário não compartilhado corretamente (permissão insuficiente) → erro claro,
propagado até a UI ("Verifique se o calendário do Alberto está compartilhado corretamente").

### Behavior: agendar-reuniao-fechamento

Precondition: lead com `status` avançado o suficiente (definido pela UI — botão "Agendar reunião
com Alberto" no kanban/drawer), `alberto_google_calendar_id` configurado.

Happy path (`prospeccao-agendar-fechamento`, novo):
1. Lê `calendarId` de `system_settings`
2. Chama `freebusy` (dias úteis, 09h-18h, começando em `now() + 24h`, janela de 5 dias úteis)
3. Calcula primeiro slot livre de 30 min dentro da janela
4. Se encontrar: cria evento via `google-calendar` (`action: "create"`, `calendarId` de Alberto,
   convida Alberto + representante + contato do lead, Google Meet automático)
5. Grava em `reunioes` (`tipo: 'fechamento_comercial'`, `lead_id`, `representante_id`,
   `organizacao_id: null` — já suportado pelo `CHECK` da Fase 1)
6. Atualiza `prospeccao_leads.reuniao_fechamento_id` + `status = 'negociando'`
7. Notifica lead (email via `send-email`; WhatsApp via `send-whatsapp` se telefone existir)

Edge cases: nenhum slot livre na janela de 5 dias úteis → **não falha silenciosamente** — cria uma
notificação/tarefa para o admin (mecanismo a definir no `/plan`: notificação in-app existente?
tabela `notificacoes` já existe no projeto? verificar antes de inventar uma nova) e avisa o
representante que o agendamento automático não encontrou horário.

Error cases: Google Calendar API fora do ar → erro claro, não marca `reuniao_fechamento_id`, lead
permanece no status anterior.

## Database Schema

Nenhuma nova tabela — `reunioes.lead_id`/`representante_id`/`organizacao_id` nullable já existem
desde a Fase 1.

## Files

### Files to Create
- `supabase/functions/prospeccao-agendar-fechamento/index.ts`
- `src/hooks/useAgendarFechamento.ts`
- `src/components/prospeccao/agendar-fechamento-button.tsx` (kanban + drawer)

### Files to Modify
- `supabase/functions/google-calendar/index.ts` — adicionar `case "freebusy"`
- `src/components/prospeccao/lead-detail-drawer.tsx` — botão de agendamento
- `src/components/prospeccao/lead-card.tsx` — já tem o ícone de reunião agendada (Fase 2), sem
  mudança necessária

## Notes

- **Investigar antes do `/plan`**: existe mecanismo de notificação in-app no projeto (tabela
  `notificacoes`, componente `NotificationBell` já visto em `BaseLayout.tsx`)? Reaproveitar em vez
  de criar um novo canal para "sem slot disponível".
- Confirmar que `alberto_google_calendar_id` já foi cadastrado manualmente em `system_settings`
  antes de testar em produção — sem isso a Fase 6 inteira não funciona (pré-requisito humano, fora
  do código).

## Tasks
- [ ] Ação `freebusy` em `google-calendar`
- [ ] `prospeccao-agendar-fechamento` (regras de negócio: horário, antecedência, janela)
- [ ] Notificação de "sem slot disponível" (reaproveitando mecanismo existente, se houver)
- [ ] Botão de agendamento no kanban/drawer
- [ ] Notificação ao lead (email + WhatsApp se aplicável)
- [ ] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [ ] Confirmar: nenhum arquivo fora da lista acima foi modificado
