# MASTER-ARCHITECTURE.md — Sistema GIG (Cavendish)

## Stack Canônica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript strict (zero any) |
| Estilo | Tailwind CSS + shadcn/ui |
| Banco | Supabase (PostgreSQL + Auth + RLS) |
| Estado | TanStack Query v5 |
| Roteamento SPA | React Router DOM v6 |
| Formulários | React Hook Form + Zod |

## Estrutura de Pastas

```
src/
├── app/                    ← Next.js App Router (páginas públicas + SSR)
│   ├── (app)/auth/         ← Autenticação
│   ├── (spa)/[[...slug]]/ ← Catch-all → SPA
│   ├── denuncia/           ← Canal público
│   └── onboarding/
├── spa/pages/              ← Páginas React Router (SPA autenticada)
│   ├── admin/
│   ├── consultor/
│   ├── cliente/
│   └── parceiro/
├── components/             ← Componentes reutilizáveis
│   ├── ui/                 ← shadcn/ui components
│   ├── layout/             ← AdminLayout, ConsultorLayout, ClienteLayout
│   ├── documentos/         ← DocumentoUploadModal, PDFViewer, etc.
│   ├── auth/               ← ProtectedRoute
│   └── agente/             ← AgenteChat
├── hooks/                  ← Custom React hooks
├── contexts/               ← AuthContext, TenantBrandingProvider
├── types/                  ← database.ts (tipos TypeScript do schema)
├── integrations/supabase/  ← client.ts, types.ts (gerado)
└── lib/                    ← utils.ts
```

## Padrões Obrigatórios

### TypeScript
- Strict mode ativo — zero `any`
- Tipos explícitos em parâmetros de funções
- Return types em hooks e funções de query
- Usar tipos de `@/types/database` ou `@/integrations/supabase/types`

### Supabase / PostgREST
- **NUNCA** usar embedded FK joins: `.select("*, tabela(...)")`
- Usar queries separadas + combinação em JavaScript
- RLS ativo em todas as tabelas
- Usar `maybeSingle()` para queries que podem retornar null

### Hooks de Dados
- Usar TanStack Query v5 (useQuery, useMutation)
- Query keys devem ser arrays: `["entidade", id]`
- Invalidar caches corretos no `onSuccess`
- `enabled` condicional quando parâmetros podem ser undefined

### Componentes
- Mobile-first (Tailwind)
- shadcn/ui para componentes base
- Validação via Zod + React Hook Form em formulários

## Tabelas Principais

- `organizacoes` — Tenants (plano, branding, drive_folder_id)
- `projetos` — Por organização (fase_atual, tipo)
- `documentos` — Arquivos enviados (storage_path, url, drive_file_id)
- `documentos_requeridos` — Catálogo por projeto (formatos_aceitos, tamanho_maximo_mb)
- `documentos_requeridos_status` — Status por documento (UNIQUE: documento_requerido_id)
- `profiles` — Perfil do usuário
- `user_roles` — RBAC (admin | consultor | cliente | parceiro)
- `organization_members` — Vínculo usuário ↔ organização
