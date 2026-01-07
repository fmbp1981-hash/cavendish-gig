# Sistema GIG (Cavendish) — Gestão Integrada de Governança e Compliance

Plataforma web para operar programas de Governança e Compliance por organização, com diagnóstico, documentos/evidências, tarefas (Kanban), treinamentos, código de ética, canal de denúncias, relatórios e integrações.

## Documentação

- Manual formal: [docs/MANUAL_SISTEMA_GIG.md](docs/MANUAL_SISTEMA_GIG.md)
- Implementações e roadmap: [IMPLEMENTACOES_COMPLETAS.md](IMPLEMENTACOES_COMPLETAS.md), [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md)
- Migrations / banco: [ALL_MIGRATIONS_COMPLETO.md](ALL_MIGRATIONS_COMPLETO.md), [MIGRATIONS_MANUAL.md](MIGRATIONS_MANUAL.md)
- Deploy: [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md), [CONFIGURACAO_DEPLOY.md](CONFIGURACAO_DEPLOY.md)
- Guia (tutoriais): [GUIA_ATIVACAO_TUTORIAIS.md](GUIA_ATIVACAO_TUTORIAIS.md)

## Requisitos

- Node.js (veja `package.json` → `engines.node`)

## Rodar localmente

```bash
npm install
npm run dev
```

Se você usa Supabase local, aplique as migrations conforme o guia: [GUIA_ATIVACAO_TUTORIAIS.md](GUIA_ATIVACAO_TUTORIAIS.md).
