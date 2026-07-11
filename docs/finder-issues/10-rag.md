# Fase 10 — RAG por categoria (opcional)

> ✅ **Concluído.** Fase originalmente marcada como opcional/fora do plano padrão — implementada a
> pedido do usuário. `pgvector` habilitado via `CREATE EXTENSION IF NOT EXISTS vector;` na própria
> migration desta fase (não precisou de nenhuma ação manual fora de migration).

## Functional Specification

### Behavior: crud-base-conhecimento

Precondition: só admin (`prospeccao_agent_knowledge` é RLS-restrita a `is_admin()`, mesma regra de
`prospeccao_agent_configs`).

Happy path: painel embutido em `AdminFinderConfiguracoes.tsx` (dentro do form de cada categoria,
visível só quando `usa_rag` está ativo) — lista os chunks da categoria, formulário simples de
título + conteúdo. Adicionar chama `prospeccao-embed-knowledge` (Edge Function), que gera o
embedding via Gemini `text-embedding-004` (768 dimensões) e grava. Remover é um delete direto
(RLS já restringe a admin).

Edge cases: provider de IA ativo não é Gemini → a Edge Function recusa com mensagem clara ("Base
de conhecimento requer o Gemini como provider ativo"), mesma limitação já existente pro
function-calling do agente (Fase 4) — RAG não é uma exceção nova, seria inconsistente ter uma regra
diferente aqui.

### Behavior: consultar-rag-na-conversa

Precondition: `prospeccao_agent_configs.usa_rag = true` para a categoria do lead, provider ativo é
Gemini.

Happy path: em `prospeccao-agent`, antes de chamar o Gemini para gerar a resposta, embeda a última
mensagem do lead (`role='user'` mais recente no histórico) e busca os `rag_top_k` chunks mais
similares (`rag_similarity_threshold` mínimo) via a função SQL `buscar_conhecimento_similar`
(distância de cosseno via pgvector `<=>`). Os trechos encontrados são injetados no `system_prompt`
antes da chamada — não é uma tool nova (não é uma ação, é contexto adicional).

Error cases: falha ao gerar o embedding ou consultar o banco → loga e segue sem contexto RAG (não
bloqueia a resposta do agente — a base de conhecimento é um complemento, não uma dependência
crítica do fluxo de conversa).

## Database Schema

- `CREATE EXTENSION IF NOT EXISTS vector;`
- `prospeccao_agent_knowledge` (nova): `id`, `categoria`, `titulo`, `conteudo`, `embedding
  vector(768)`, timestamps. RLS admin-only.
- `buscar_conhecimento_similar(p_categoria, p_embedding, p_top_k, p_threshold)` — função SQL de
  busca por similaridade.
- Sem índice `ivfflat`/`hnsw` de propósito — volume esperado de chunks é baixo (dezenas a poucas
  centenas por categoria), sequential scan ordenado por distância é suficiente. Revisitar se o
  volume crescer (mesmo raciocínio já usado no dashboard da Fase 8).

## Files

### Files to Create
- `supabase/migrations/20260709000000_finder_rag_knowledge.sql`
- `supabase/functions/_shared/gemini-embeddings.ts`
- `supabase/functions/prospeccao-embed-knowledge/index.ts`
- `src/hooks/useProspeccaoKnowledge.ts`
- `src/components/prospeccao/knowledge-base-panel.tsx`

### Files to Modify
- `supabase/functions/prospeccao-agent/index.ts` — busca e injeta contexto RAG antes da chamada ao Gemini
- `src/components/prospeccao/agent-config-form.tsx` — habilita o toggle `usa_rag` (antes sempre desabilitado), expõe `rag_top_k`/`rag_similarity_threshold`, embute o `KnowledgeBasePanel`
- `src/types/prospeccao.ts` — novo tipo `ProspeccaoAgentKnowledge`
- `supabase/config.toml` — `[functions.prospeccao-embed-knowledge] verify_jwt = true`

## Notes

- Embeddings só são gerados no momento de criar/editar um chunk (não há reprocessamento em lote se
  o texto for editado depois — editar hoje é "remover e adicionar de novo", não há UI de edição
  in-place, suficiente pro volume esperado).
- `usa_rag` sem nenhum chunk cadastrado pra categoria simplesmente não injeta contexto (a função de
  busca retorna vazio) — não é um erro, o agente responde normalmente sem RAG.

## Tasks
- [x] Migration: `pgvector` + `prospeccao_agent_knowledge` + `buscar_conhecimento_similar`
- [x] `_shared/gemini-embeddings.ts` + `prospeccao-embed-knowledge`
- [x] Integrar busca RAG no `prospeccao-agent`
- [x] `useProspeccaoKnowledge.ts` + `knowledge-base-panel.tsx`
- [x] Habilitar toggle `usa_rag` no `agent-config-form.tsx`
- [x] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [x] Confirmar: nenhum arquivo fora da lista acima foi modificado
