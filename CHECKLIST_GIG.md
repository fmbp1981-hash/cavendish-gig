# Checklist GIG — Ondas de Desenvolvimento

**Última atualização:** 2026-05-18  
**TypeScript:** ✅ Zero erros (`npx tsc --noEmit` — exit 0)

---

## ONDA 1 — Infraestrutura e Correções ✅ CONCLUÍDA

| # | Item | Status | Notas |
|---|------|--------|-------|
| 1 | Migrations aplicadas (39 tabelas) | ✅ | `db push` OK |
| 2 | trello-sync deletado (Supabase + repo) | ✅ | Secrets nunca existiram |
| 3 | clickup-sync deletado (Supabase + repo) | ✅ | |
| 4 | send-email edge function deployada | ✅ | Fix `.limit(1)` em integrations.ts |
| 5 | Twilio/Trello secrets nunca configurados | ✅ | |
| 6 | Correções auth (6 bugs) | ✅ | |
| 7 | Admin redirect corrigido | ✅ | |
| 8 | Schema DB: 39 tabelas, todas com RLS | ✅ | |
| 9 | Google Calendar — persistência local + fallback resiliente | ✅ | Item 10 do backlog |

---

## ONDA 2 — Features UX ✅ TOTALMENTE IMPLEMENTADA

> Auditoria de 2026-05-18: todos os itens estão com código de produção real.  
> Nenhum stub, placeholder ou TODO encontrado.

| # | Item | Arquivo(s) | Linhas | Status |
|---|------|-----------|--------|--------|
| 1 | **Biblioteca (Admin)** — upload, categorias, busca | `src/spa/pages/admin/AdminBiblioteca.tsx` | 542 | ✅ |
| 2 | **Biblioteca (Consultor)** — visualização read-only | `src/spa/pages/consultor/ConsultorBiblioteca.tsx` | 155 | ✅ |
| 2b | Hook useBiblioteca (6 hooks + upload + delete) | `src/hooks/useBiblioteca.ts` | 377 | ✅ |
| 2c | BibliotecaCard (card + download counter + delete) | `src/components/biblioteca/BibliotecaCard.tsx` | 206 | ✅ |
| 3 | **Upload múltiplos arquivos** — drag-drop, validação, sequencial | `src/components/documentos/DocumentoUploadModal.tsx` | 257 | ✅ |
| 3b | useUploadDocumento — storage + DB + OneDrive + email | `src/hooks/useUploadDocumento.ts` | 280 | ✅ |
| 4 | **MinhaAgenda (cliente)** — próximas/histório/ICS download | `src/spa/pages/cliente/MinhaAgenda.tsx` | 256 | ✅ |
| 4b | AgendaTimeline — agrupamento por mês, ícones de status | `src/components/agenda/AgendaTimeline.tsx` | 94 | ✅ |
| 5 | **ConsultorAgenda** — calendário unificado (react-big-calendar) | `src/spa/pages/consultor/ConsultorAgenda.tsx` | 329 | ✅ |
| 5b | ConsultorAgendamento — criar reuniões + atas para revisar | `src/spa/pages/consultor/ConsultorAgendamento.tsx` | 677 | ✅ |
| 10 | **Google Calendar** — create/list/delete + templates kickoff/acompanhamento | `src/hooks/useGoogleCalendar.ts` | 138 | ✅ |

### Rotas Registradas (App.tsx)

| Rota | Componente | Role |
|------|-----------|------|
| `/admin/biblioteca` | AdminBiblioteca | admin |
| `/consultor/biblioteca` | ConsultorBiblioteca | consultor + admin |
| `/consultor/agenda` | ConsultorAgenda | consultor + admin |
| `/consultor/agendamento` | ConsultorAgendamento | consultor + admin |
| `/meu-projeto/agenda` | MinhaAgenda | cliente + admin + consultor |

---

## ONDA 3 — A Definir

> Baseado no `PROXIMOS_PASSOS_DESENVOLVIMENTO.md` — Fase 2 do roadmap original.

### Quick Wins sugeridos (alto impacto, baixo esforço)

| Feature | Esforço | Impacto |
|---------|---------|---------|
| Preview de PDF embutido (react-pdf) | 2 dias | Alto |
| Exportação de relatórios em PDF (jsPDF ou Puppeteer) | 3 dias | Alto |
| Visualização de documentos Google Drive inline | 3 dias | Alto |
| Otimização de queries + índices Supabase | 3 dias | Alto |

### Features médio prazo

| Feature | Esforço | Impacto |
|---------|---------|---------|
| Workflow visual de progresso (Diagnóstico → Implementação → Recorrência) | 4 dias | Alto |
| Dashboards analíticos avançados (Recharts) | 6 dias | Alto |
| Sistema de comentários em documentos | 5 dias | Médio |
| Biblioteca de templates editáveis | 5 dias | Alto |
| Envio automático de relatórios mensais (cron + Resend) | 2 dias | Médio |

---

## Estado Técnico

| Indicador | Status |
|-----------|--------|
| TypeScript strict | ✅ Zero erros |
| Supabase migrations | ✅ Aplicadas (db push) |
| Edge Functions deployadas | ✅ send-email, onedrive, google-calendar |
| Edge Functions removidas | ✅ trello-sync, clickup-sync |
| RLS ativo | ✅ Todas as tabelas |
| Build production | A verificar (`npm run build`) |
| Deploy Vercel | A verificar (env vars configuradas?) |
