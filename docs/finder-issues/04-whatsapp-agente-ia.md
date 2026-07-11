# Fase 4 — WhatsApp + Agente de IA conversacional

> ✅ **Concluído**, com uma expansão de escopo pedida pelo usuário: transporte WhatsApp
> dual-provider (Evolution API **e** WhatsApp Cloud API oficial da Meta, selecionável no vault),
> não só Evolution API como especificado originalmente abaixo. Nenhum dos dois provedores tem
> credenciais configuradas ainda — a estrutura está pronta para recebê-las. Function-calling do
> agente só implementado para Gemini (único provider testável hoje); OpenAI/Claude transferem
> para humano em vez de tentar function-calling não implementado.

Substitui o stub 503 de `send-whatsapp`, cria o webhook inbound e o orquestrador de IA com
function-calling que qualifica leads via conversa e transfere para o representante humano.

## Functional Specification

### Behavior: enviar-mensagem-whatsapp

Precondition: integração `evolution-api` configurada no vault (`AdminIntegracoes.tsx`, novo
provider — `baseUrl`/`instanceName` em `config`, `apiKey` em `secrets`).

Happy path:
- Input: `{ telefone, mensagem, leadId? }` via `supabase.functions.invoke("send-whatsapp", ...)`
- Workflow: carrega integração do vault → POST para a instância Evolution API
  (`{baseUrl}/message/sendText/{instanceName}`) → registra em `prospeccao_conversas`
  (`role: "assistant"`, `tipo: "texto"`) se `leadId` presente
- Output: `{ success: true, messageId }`

Edge cases: telefone sem WhatsApp válido (Evolution retorna erro específico) → resposta 422 com
motivo, não lança exceção genérica.

Error cases: integração desabilitada/ausente → 400 claro ("WhatsApp não configurado, Admin →
Integrações"); Evolution API fora do ar → 502, log via `logEdgeFunctionError`.

### Behavior: receber-mensagem-whatsapp (novo)

Precondition: webhook da Evolution API configurado apontando para
`{SUPABASE_URL}/functions/v1/whatsapp-webhook`.

Happy path:
- Input: payload do webhook Evolution API (formato `MESSAGES_UPSERT`)
- Workflow: valida payload → extrai telefone do remetente → resolve `prospeccao_leads` por
  `telefone` (`responsavel_id` não importa aqui, é lookup global por telefone com `service` role)
  → grava mensagem em `prospeccao_conversas` (`role: "user"`) → se `modo_humano = false`, invoca
  `prospeccao-agent` (function-to-function) para gerar resposta
- Output: 200 sempre (webhooks não devem re-tentar em loop por erro de negócio)

Edge cases: telefone não corresponde a nenhum lead → loga e ignora (não é um lead nosso).
Mensagem duplicada (retry do webhook) → idempotência simples por `message_id` do payload, se
disponível, senão aceitar duplicata ocasional (não crítico).

Error cases: payload malformado → 200 com log de erro (nunca 4xx/5xx para o webhook não reentregar
infinitamente sem necessidade — decisão a validar com o time se causar problema).

### Behavior: conversar-com-agente (`prospeccao-agent`, novo)

Precondition: `prospeccao_agent_configs` tem uma linha `ativo=true` para a `categoria` do lead.

Happy path:
- Input: `{ leadId }`
- Workflow: resolve config do agente por categoria → monta contexto (lead + etapa do funil +
  histórico de `prospeccao_conversas`, + RAG se `usa_rag` — fora de escopo até Fase 10) → chama
  `getAIConfig()` (reaproveitado de `_shared/ai-provider.ts`) → envia para o provider com as
  ferramentas da seção "Tools" abaixo → executa `tool_calls` retornados → persiste resposta em
  `prospeccao_conversas` (`role: "assistant"`) → dispara `send-whatsapp`
- Output: mensagem enviada + eventuais efeitos das tools (mudança de etapa, transferência etc.)

Tools do agente (function-calling — só Gemini/OpenAI/Claude com suporte a tools; se o provider
ativo não suportar, degrada para resposta de texto simples sem tools):

| Tool | Efeito |
|---|---|
| `mover_etapa_funil` | Atualiza `funil_etapa_id`, deriva `status` via `deriveTerminalStatus()` (reaproveita `src/lib/prospeccao/funil-utils.ts` — precisa de uma versão Deno-compatível ou duplicar a função pequena, mesma decisão já tomada para `normalizePhone`) |
| `atualizar_lead` | Update parcial de `ai_score`/`observacoes`/`tags`/`status` |
| `transferir_para_humano` | `modo_humano = true`, cancela follow-ups pendentes em `prospeccao_fila_followup` |
| `agendar_followup` | Insere em `prospeccao_fila_followup` |

`converter_lead_organizacao`/`converter_lead_parceiro` ficam para a Fase 7 — não implementar aqui
ainda, mas deixar o desenho das tools já contemplando o nome para não ter que renomear depois.

Edge cases: lead sem `prospeccao_agent_configs` ativo pra categoria → fallback pra
`transferir_para_humano` automático (não deixa o lead sem resposta).

Error cases: provider de IA falha → não envia mensagem quebrada, loga erro, marca
`prospeccao_conversas` com uma nota de falha (campo `metadata` da conversa, se necessário — avaliar
se vale adicionar).

## Database Schema

Nenhuma alteração de schema nesta fase — todas as tabelas já existem desde a Fase 1
(`prospeccao_conversas`, `prospeccao_fila_followup`, `prospeccao_agent_configs`).

## Files

### Files to Create
- `supabase/functions/whatsapp-webhook/index.ts` — recebe mensagens inbound
- `supabase/functions/prospeccao-agent/index.ts` — orquestrador com function-calling
- `supabase/functions/_shared/prospeccao-tools.ts` — implementação das 4 tools acima
- `src/hooks/useProspeccaoConversas.ts` — `useConversasDoLead(leadId)`, realtime opcional
- `src/components/prospeccao/conversa-panel.tsx` — painel de histórico de conversa no drawer do lead

### Files to Modify
- `supabase/functions/send-whatsapp/index.ts` — substituir stub 503 por implementação real
- `supabase/config.toml` — `[functions.whatsapp-webhook] verify_jwt = false` (webhook externo, sem
  JWT de usuário — validar por outro mecanismo, ver Notes), `[functions.prospeccao-agent]
  verify_jwt = true`
- `src/spa/pages/admin/AdminIntegracoes.tsx` — adicionar entrada `evolution-api` no vault
- `src/components/prospeccao/lead-detail-drawer.tsx` — embutir `conversa-panel.tsx`

## External Dependencies

Nenhuma nova dependência npm — tudo via `fetch()` na Edge Function (mesmo padrão de
`prospeccao-search`).

## Notes

- **Autenticação do webhook**: `whatsapp-webhook` não tem JWT de usuário (é a Evolution API
  chamando). Precisa de um segredo compartilhado (header custom, ex. `x-evolution-secret`),
  guardado em `system_settings` ou no `config` da integração — mesmo padrão do `x-cron-secret`
  já usado em `compliance-alerts`/`reuniao-lembrete`.
- **`deriveTerminalStatus` em Deno**: a função já existe em `src/lib/prospeccao/funil-utils.ts`
  (frontend). Edge Functions não importam de `src/` — duplicar a função (é pequena, ~10 linhas) em
  `_shared/prospeccao-tools.ts` em vez de tentar compartilhar entre runtimes.
- Esta é a fase de **maior esforço novo** do módulo (nada de WhatsApp funciona hoje no
  `cavendish-gig`) — considerar quebrar em duas issues menores (`04a-enviar-receber-whatsapp` +
  `04b-agente-ia`) se o `/plan` mostrar mais de ~10 arquivos.

## Tasks
- [ ] Registrar integração `evolution-api` no vault
- [ ] Implementar `send-whatsapp` real
- [ ] Implementar `whatsapp-webhook` + segredo compartilhado
- [ ] Implementar `_shared/prospeccao-tools.ts` (4 tools)
- [ ] Implementar `prospeccao-agent` com function-calling
- [ ] `useProspeccaoConversas.ts` + `conversa-panel.tsx`
- [ ] Embutir painel de conversa no drawer do lead
- [ ] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [ ] Confirmar: nenhum arquivo fora da lista acima foi modificado
