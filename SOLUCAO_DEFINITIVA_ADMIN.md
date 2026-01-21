# 🔧 SOLUÇÃO DEFINITIVA: Problema de Role Admin

## 🔍 PROBLEMA IDENTIFICADO

Após análise detalhada, encontrei **conflito entre migrations**:

1. **Migration 2** (`20251212130310`) criava role 'admin' automaticamente para `fmbp1981@gmail.com`
2. **Migration 15** (`20251215190000`) **SOBRESCREVEU** o trigger, removendo essa lógica
3. Resultado: O usuário foi criado apenas com role 'cliente'

### Logs Atuais:
```
[AuthContext] Mapped roles: Array(1)  ← Apenas 1 role (cliente)
```

### Esperado:
```
[AuthContext] Mapped roles: ["cliente", "admin"]  ← 2 roles
```

---

## ✅ SOLUÇÃO RECOMENDADA: SQL Direto (Executar Agora)

### Passo 1: Acesse o Supabase Dashboard

1. URL: https://fenfgjqlsqzvxloeavdc.supabase.co
2. Login com suas credenciais
3. Menu lateral → **SQL Editor**
4. Clique em **+ New query**

### Passo 2: Execute o SQL de Correção

**COPIE TODO O CONTEÚDO** do arquivo `FIX_ADMIN_ROLE.sql` e execute:

```bash
# O arquivo está em:
C:\Projects\Sistema_GIG\cavendish-gig-main\FIX_ADMIN_ROLE.sql
```

Ou copie diretamente daqui:

```sql
-- Inserir role 'admin' (ignora se já existir)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar resultado
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'fmbp1981@gmail.com'
ORDER BY ur.created_at;
```

### Passo 3: Verificar Resultado

Você deve ver **2 linhas**:
```
email                 | role     | created_at
----------------------|----------|---------------------------
fmbp1981@gmail.com    | cliente  | 2026-01-XX XX:XX:XX
fmbp1981@gmail.com    | admin    | 2026-01-XX XX:XX:XX
```

---

## 🔄 TESTE: Verificar Acesso Admin

1. **Faça LOGOUT** do sistema
2. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
3. **Faça LOGIN** novamente:
   - Email: `fmbp1981@gmail.com`
   - Senha: `Admin@123`

4. **Abra o Console do Navegador** (F12)
5. **Procure por** `[AuthContext]` nos logs

### Resultado Esperado:
```
[AuthContext] Fetching user data for: 373d256e-4263-4ae4-b99d-ca40b4c8243c
[AuthContext] Profile result: { profileData: {...}, profileError: null }
[AuthContext] Roles result: { rolesData: [{role: "cliente"}, {role: "admin"}], rolesError: null }
[AuthContext] Mapped roles: ["cliente", "admin"]  ← ✅ CORRETO!
```

---

## 🔬 DIAGNÓSTICO ALTERNATIVO: Via Script Node.js

Se o SQL não funcionar, use este método para diagnóstico detalhado:

### Pré-requisito:

Obtenha a **SUPABASE_SERVICE_ROLE_KEY**:
1. Supabase Dashboard → **Settings** → **API**
2. Copie a **service_role key** (⚠️ SECRETA!)

### Adicione ao `.env.local`:

```bash
SUPABASE_URL=https://fenfgjqlsqzvxloeavdc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### Execute o Diagnóstico:

```bash
cd C:\Projects\Sistema_GIG\cavendish-gig-main
node tools/checkUserRoles.mjs --email fmbp1981@gmail.com
```

Este script irá:
- ✅ Verificar se o usuário existe
- ✅ Verificar roles no banco
- ✅ Adicionar role 'admin' automaticamente se não existir
- ✅ Mostrar diagnóstico completo

---

## 🛠️ SE AINDA NÃO FUNCIONAR

### Possíveis Causas:

1. **Cache do Navegador**: Limpe o cache (Ctrl + Shift + Delete)
2. **Sessão Antiga**: Faça logout e login novamente
3. **RLS Bloqueando**: Verifique no SQL Editor:

```sql
-- Desabilitar temporariamente RLS para teste
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verificar roles
SELECT * FROM public.user_roles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'fmbp1981@gmail.com'
);

-- Reabilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### Verificar AuthContext:

Adicione logs extras no `src/contexts/AuthContext.tsx` linha 86:

```typescript
console.log('[AuthContext] Roles result:', { rolesData, rolesError });
console.log('[AuthContext] Raw rolesData:', JSON.stringify(rolesData, null, 2));
```

---

## 📝 CORREÇÃO PERMANENTE (Para Evitar no Futuro)

Atualize o trigger `handle_new_user()` para sempre criar role 'admin' para este email:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );

  -- Verificar se é o email do admin principal
  IF NEW.email = 'fmbp1981@gmail.com' THEN
    -- Admin principal tem ambas as roles
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  ELSE
    -- Usuários normais começam como cliente
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  END IF;

  RETURN NEW;
END;
$function$;
```

---

## 🎯 RESUMO DO FLUXO

```
┌─────────────────────────────────────┐
│ 1. Execute FIX_ADMIN_ROLE.sql       │
│    no Supabase SQL Editor           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Verifique que retornou 2 roles   │
│    (cliente + admin)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Faça LOGOUT do sistema           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Limpe cache do navegador         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. Faça LOGIN novamente              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 6. Verifique console: deve mostrar  │
│    Mapped roles: ["cliente","admin"]│
└─────────────────────────────────────┘
               │
               ▼
        ✅ SUCESSO!
    Acesso Admin Liberado
```

---

## ⚠️ IMPORTANTE

- A role 'admin' dá acesso TOTAL ao sistema
- NUNCA compartilhe a SERVICE_ROLE_KEY
- Não commite `.env.local` no git (já está no .gitignore)
- Após correção, você poderá:
  - ✅ Acessar configurações administrativas
  - ✅ Gerenciar usuários e organizações
  - ✅ Ver todos os projetos e documentos
  - ✅ Gerenciar roles de outros usuários

---

## 📞 SE PRECISAR DE AJUDA

1. Execute `checkUserRoles.mjs` e envie o output
2. Tire screenshot do console do navegador (F12)
3. Tire screenshot do resultado da query SQL acima
4. Verifique se realmente executou logout/login após a correção
