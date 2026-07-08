# Fase 9 — Configuração de agentes de IA por categoria

## Functional Specification

### Behavior: crud-agent-configs

Precondition: só admin (`prospeccao_agent_configs` já é RLS-restrita a `is_admin()` desde a
Fase 1).

Happy path: `AdminFinderConfiguracoes.tsx` — uma aba/seção por categoria (7 categorias fixas, ver
`PROSPECCAO_CATEGORIAS`), CRUD de `prospeccao_agent_configs`: nome, `system_prompt` (textarea
grande), `ai_provider` (select gemini/openai/claude), `temperatura`, `max_iteracoes`, `usa_rag`
(toggle — desabilitado/explicado como "requer Fase 10" se `pgvector` não estiver habilitado),
`ativo` (só 1 ativo por categoria — já garantido pelo unique index parcial da Fase 1, a UI só
precisa avisar se tentar ativar um segundo).

Edge cases: tentar salvar 2 configs ativas pra mesma categoria → a constraint do banco já impede,
a UI só precisa tratar o erro (`23505`) com uma mensagem clara em vez de erro genérico.

## Files

### Files to Create
- `src/hooks/useProspeccaoAgentConfig.ts` — `useAgentConfigs()`, `useUpdateAgentConfig`,
  `useCreateAgentConfig`
- `src/spa/pages/admin/AdminFinderConfiguracoes.tsx`
- `src/components/prospeccao/agent-config-form.tsx`

### Files to Modify
- `src/App.tsx` — rota `/admin/finder/configuracoes`
- `src/components/layout/AdminLayout.tsx` — item de menu

## Notes

- Última fase do "core" do módulo antes do RAG opcional (Fase 10).
- Ao terminar esta fase, revisar o módulo Finder inteiro de ponta a ponta (busca → funil → agente
  → agendamento → conversão → dashboard) antes de considerar pronto pra uso real pela equipe
  comercial da Cavendish.

## Tasks
- [ ] `useProspeccaoAgentConfig.ts`
- [ ] `AdminFinderConfiguracoes.tsx` (7 categorias)
- [ ] Tratamento de erro 23505 (config duplicada ativa)
- [ ] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [ ] Confirmar: nenhum arquivo fora da lista acima foi modificado
- [ ] Revisão end-to-end do módulo Finder completo
