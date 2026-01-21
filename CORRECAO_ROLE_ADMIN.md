# 🔧 Correção: Adicionar Role Admin ao Usuário

## ❌ Problema Identificado

O usuário `fmbp1981@gmail.com` está acessando o sistema apenas como **Cliente** porque:

1. O trigger `handle_new_user()` cria TODOS os novos usuários com role `'cliente'` por padrão
2. A role `'admin'` não foi adicionada manualmente ao usuário
3. O script `grantRole.mjs` tinha um bug que foi **CORRIGIDO AGORA**

---

## ✅ SOLUÇÃO 1: SQL Direto (RECOMENDADO - Mais Rápido)

### Passo a Passo:

1. **Acesse o Supabase Dashboard:**
   - URL: https://fenfgjqlsqzvxloeavdc.supabase.co
   - Entre com suas credenciais

2. **Vá para SQL Editor:**
   - Menu lateral → **SQL Editor**
   - Clique em **+ New query**

3. **Execute este SQL:**

```sql
-- Adiciona role 'admin' ao usuário fmbp1981@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'fmbp1981@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar roles do usuário
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'fmbp1981@gmail.com'
ORDER BY ur.created_at;
```

4. **Clique em RUN**

5. **Resultado Esperado:**
   - Você verá 2 roles para o usuário:
     - `cliente` (criada automaticamente)
     - `admin` (recém adicionada)

6. **Faça logout e login novamente** no sistema

---

## ✅ SOLUÇÃO 2: Via Script Node.js

### Pré-requisitos:

1. **Obter SUPABASE_SERVICE_ROLE_KEY:**
   - Acesse Supabase Dashboard
   - Settings → API
   - Copie a **service_role key** (⚠️ Mantenha em segredo!)

2. **Adicionar ao `.env.local`:**

```bash
# Adicione estas linhas ao arquivo .env.local:
SUPABASE_URL=https://fenfgjqlsqzvxloeavdc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### Executar o Script:

```bash
npm run admin:promote
```

Ou manualmente:

```bash
node tools/grantRole.mjs --email fmbp1981@gmail.com --role admin
```

---

## 🔍 Verificação

Após executar uma das soluções acima:

1. **Faça logout** do sistema
2. **Faça login** com:
   - Email: `fmbp1981@gmail.com`
   - Senha: `Admin@123`
3. **Abra o Console do Navegador** (F12)
4. **Verifique os logs** do `[AuthContext]`:
   ```
   [AuthContext] Mapped roles: ["cliente", "admin"]
   ```

5. **Acesse funcionalidades de Admin** - agora devem estar disponíveis!

---

## 📝 Notas Técnicas

### O que foi corrigido no `grantRole.mjs`:

**ANTES (com bug):**
```javascript
.upsert({ user_id: profile.id, role }, { onConflict: "user_id" });
```

**DEPOIS (corrigido):**
```javascript
.insert({ user_id: profile.id, role });
// Se o erro for de violação de unique constraint (role já existe), ignorar
if (insertRoleError && insertRoleError.code !== "23505") {
  console.error("Erro gravando user_roles:", insertRoleError);
  process.exit(1);
}
```

### Como funciona o sistema de roles:

- Um usuário pode ter **múltiplas roles** simultaneamente
- Constraint: `UNIQUE(user_id, role)` permite várias roles por usuário
- O AuthContext verifica:
  - `isAdmin`: tem role 'admin'?
  - `isConsultor`: tem role 'consultor' OU 'admin'?
  - `isCliente`: tem role 'cliente'?

---

## 🚀 Próximos Passos

Após adicionar a role admin:

1. ✅ Usuário terá acesso total ao sistema
2. ✅ Poderá acessar configurações administrativas
3. ✅ Poderá gerenciar outros usuários e organizações
4. ✅ Terá permissões de Consultor E Cliente também

---

## ⚠️ Importante

- **NUNCA** compartilhe a `SUPABASE_SERVICE_ROLE_KEY`
- Não commite o `.env.local` no git (já está no `.gitignore`)
- A role 'admin' dá acesso total ao sistema - use com cuidado
