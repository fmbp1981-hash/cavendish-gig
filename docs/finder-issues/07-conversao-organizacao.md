# Fase 7 — Conversão lead → organização/parceiro

A ponte real entre o funil de vendas e o produto. Depende da Fase 6 (reunião confirmada, modelo
Gate) para o caminho `cliente`; a categoria `parceiro_indicador` não depende de reunião.

## Functional Specification

### Behavior: converter-lead-organizacao

Precondition: `status = 'negociando'`, `reuniao_fechamento_id` preenchido, reunião marcada como
realizada e confirmada (por Alberto ou pelo representante em nome dele — ação manual na UI).

Happy path:
1. Reaproveita exatamente o fluxo de `AdminOrganizacoes.tsx` (`supabase.from("organizacoes").insert({nome, cnpj})`)
   — **não reimplementar**, chamar a mesma mutation/lógica (extrair para um hook compartilhado se
   ainda não existir um `useCreateOrganizacao` reaproveitável)
2. Cria/convida o usuário de contato da PME, insere em `organization_members` com `role = 'cliente'`
   (**investigar o fluxo real de convite de usuário existente no projeto antes de implementar** —
   não inventar um novo)
3. Marca `prospeccao_leads.organizacao_id` e `status = 'convertido'`

Edge cases: contato do lead já é um usuário existente no sistema (outro papel) → decisão de produto
a confirmar (vincula à organização mantendo o papel, ou bloqueia?).

### Behavior: converter-lead-parceiro

Precondition: `categoria = 'parceiro_indicador'`.

Happy path: cria/convida usuário com `role = 'parceiro'` (role já existe no RBAC) em vez de criar
organização. Marca `status = 'convertido'` (sem `organizacao_id`).

## Files

### Files to Create
- `src/hooks/useConverterLead.ts` — `useConverterLeadOrganizacao`, `useConverterLeadParceiro`
- `src/components/prospeccao/converter-lead-dialog.tsx`

### Files to Modify
- `src/components/prospeccao/lead-detail-drawer.tsx` — ação "Converter" (ramifica por categoria)
- `supabase/functions/_shared/prospeccao-tools.ts` — implementar de fato as tools
  `converter_lead_organizacao`/`converter_lead_parceiro` já previstas na Fase 4 (hoje só
  reservadas, sem implementação)

## Notes

- **Pré-requisito de investigação antes do `/plan`**: ler o fluxo real de convite/criação de
  usuário do zero no `cavendish-gig` (onboarding, `user_pre_registrations`?) — reaproveitar, não
  duplicar. Mencionado como pendência desde o `FINDER_MODULE_SPEC.md` original.
- Esta é a issue que efetivamente fecha o "produto" do Finder — testar manualmente o fluxo
  completo (lead → conversão → aparece em `/admin/organizacoes` e no onboarding do cliente) antes
  de considerar a fase concluída.

## Tasks
- [ ] Investigar fluxo real de criação/convite de usuário (não assumir)
- [ ] `useConverterLead.ts` reaproveitando `organizacoes`/`organization_members`/convite existentes
- [ ] Ação de conversão no drawer do lead
- [ ] Implementar as tools do agente (`converter_lead_organizacao`/`converter_lead_parceiro`)
- [ ] Teste manual do fluxo completo end-to-end
- [ ] `tsc --noEmit` + `npm run build` + `eslint` limpos
- [ ] Confirmar: nenhum arquivo fora da lista acima foi modificado
