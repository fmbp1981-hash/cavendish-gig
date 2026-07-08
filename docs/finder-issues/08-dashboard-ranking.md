# Fase 8 — Dashboard e ranking por representante

## Functional Specification

### Behavior: dashboard-finder-admin

Happy path: `AdminFinderDashboard.tsx` mostra (ver mockup em `FINDER_MODULE_SPEC.md §4.1`):
- Totais do mês: leads prospectados, responderam, convertidos, taxa de conversão
- Ranking por representante (leads / contatados / convertidos / taxa), comparando com
  `prospeccao_metas_representante`
- Funil agregado (todas categorias, contagem por `status`)
- Reuniões de fechamento com Alberto nos próximos 7 dias (`reunioes` filtradas por
  `tipo = 'fechamento_comercial'`)

Fonte de dados: agregações sobre `prospeccao_leads` — sem embedded joins (convenção do projeto).
Se o volume justificar, considerar uma `VIEW`/RPC dedicada (`finder_ranking_representantes(periodo
date)`) em vez de agregar tudo no client — decisão de performance a avaliar no `/plan` com o
volume real de leads na época.

### Behavior: crud-metas-representante

Happy path: tela simples de admin — lista representantes (via `useRepresentantes`, já existe),
define `meta_leads_contatados`/`meta_conversoes` por mês (`prospeccao_metas_representante`, já
existe desde a Fase 1). CRUD básico, sem lógica especial.

## Files

### Files to Create
- `src/hooks/useProspeccaoDashboard.ts` — agregações do dashboard
- `src/hooks/useProspeccaoMetas.ts` — CRUD de metas
- `src/spa/pages/admin/AdminFinderDashboard.tsx`
- `src/components/prospeccao/ranking-representantes.tsx`
- `src/components/prospeccao/metas-form-dialog.tsx`

### Files to Modify
- `src/App.tsx` — rota `/admin/finder` (dashboard como home do módulo pro admin)
- `src/components/layout/AdminLayout.tsx` — reordenar/ajustar item de menu "Finder" pra apontar
  pro dashboard em vez de ir direto pra Leads

## Notes

- Só admin vê o dashboard geral — representante só vê o próprio número (já coberto pelas páginas
  de Leads/Funil existentes com escopo próprio, sem necessidade de tela nova pro representante).
- Se `prospeccao_leads` já tiver volume relevante nesse ponto, medir o tempo de resposta das
  agregações no client antes de decidir pela RPC/VIEW.

## Tasks
- [ ] `useProspeccaoDashboard.ts` (agregações client-side)
- [ ] `useProspeccaoMetas.ts` (CRUD)
- [ ] `AdminFinderDashboard.tsx` + componentes de ranking/reuniões
- [ ] Tela de metas
- [ ] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [ ] Confirmar: nenhum arquivo fora da lista acima foi modificado
