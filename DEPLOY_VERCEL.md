# 🚀 Guia de Deploy no Vercel - Sistema GIG

## 📋 Pré-requisitos

- ✅ Conta no GitHub
- ✅ Repositório GitHub com o código
- ✅ Conta no Vercel (pode fazer login com GitHub)
- ✅ Projeto Supabase configurado e rodando

---

## 📍 PASSO 1: Preparar Repositório GitHub

### 1.1 Verificar arquivos essenciais

Certifique-se que estes arquivos existem:
- ✅ `.gitignore` - Ignora arquivos sensíveis
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ `vercel.json` - Configuração do Vercel
- ✅ `package.json` - Dependências do projeto

### 1.2 Commit e Push para GitHub

```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: Sistema de tutoriais e melhorias Phase 2

- Adiciona sistema de tutoriais interativos guiados
- Implementa preview de PDF e Google Drive viewer
- Cria dashboards analíticos com 5 gráficos
- Adiciona sistema de comentários em documentos
- Otimiza queries com 40+ índices estratégicos
- Adiciona workflow visual de progresso
- Configura deploy para Vercel

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push para GitHub
git push origin main
```

---

## 📍 PASSO 2: Deploy no Vercel

### 2.1 Acessar Vercel

1. Acesse: https://vercel.com
2. Clique em **Sign Up** ou **Login**
3. Escolha **Continue with GitHub**
4. Autorize o Vercel a acessar seus repositórios

### 2.2 Importar Projeto

1. No dashboard do Vercel, clique em **Add New...**
2. Selecione **Project**
3. Procure por: `cavendish-gig-main` (ou nome do seu repositório)
4. Clique em **Import**

### 2.3 Configurar Projeto

**Framework Preset:** Next.js

**Root Directory:** `./` (deixe em branco)

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```bash
npm install
```

### 2.4 Configurar Variáveis de Ambiente

⚠️ **IMPORTANTE:** Adicione estas variáveis de ambiente:

Clique em **Environment Variables** e adicione:

| Nome | Valor | Onde obter |
|------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGc...` | Supabase → Settings → API → anon/public key |
| `NEXT_PUBLIC_SUPABASE_PROJECT_ID` | `seu-project-id` | Supabase → Settings → General → Reference ID |

⚠️ **Observação:** o projeto usa Next.js. Variáveis públicas devem começar com `NEXT_PUBLIC_`.

**Onde encontrar no Supabase:**
1. https://app.supabase.com/
2. Selecione seu projeto
3. **Settings** → **API**
4. Copie os valores

### 2.5 Deploy!

1. Clique em **Deploy**
2. Aguarde 2-5 minutos
3. ✅ Deploy completo!

**Você receberá uma URL:** `https://seu-projeto.vercel.app`

---

## 📍 PASSO 3: Configurar Domínio (Opcional)

### 3.1 Adicionar Domínio Customizado

1. No projeto do Vercel, vá em **Settings**
2. Clique em **Domains**
3. Digite seu domínio: `gig.cavendish.com.br`
4. Clique em **Add**

### 3.2 Configurar DNS

No seu provedor de domínio (Registro.br, GoDaddy, etc.), adicione:

**Tipo A:**
```
Host: @
Value: 76.76.21.21
```

**Tipo CNAME:**
```
Host: www
Value: cname.vercel-dns.com
```

Aguarde propagação (5min - 48h)

---

## 📍 PASSO 4: Configurar Supabase para Produção

### 4.1 Adicionar URL do Vercel nas configurações

1. Acesse Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Em **Site URL**, adicione: `https://seu-projeto.vercel.app`
4. Em **Redirect URLs**, adicione:
   - `https://seu-projeto.vercel.app/**`
   - `https://seu-projeto.vercel.app/auth/callback`

### 4.2 Configurar CORS

1. **Project Settings** → **API**
2. Em **CORS**, adicione: `https://seu-projeto.vercel.app`

---

## 📍 PASSO 5: Testar Deploy

### 5.1 Acessar aplicação

1. Abra: `https://seu-projeto.vercel.app`
2. Verifique se carrega corretamente
3. Teste login
4. Teste funcionalidades principais

### 5.2 Verificar Logs

Se houver erro:
1. No Vercel, vá em **Deployments**
2. Clique no deploy mais recente
3. Vá em **Functions** → **View Logs**
4. Cheque por erros

---

## 🔄 Atualizações Futuras

### Deploy Automático

Toda vez que você fizer `git push origin main`, o Vercel automaticamente:
1. Detecta o push
2. Executa build
3. Faz deploy
4. Atualiza a URL

### Preview Deployments

Branches e Pull Requests geram URLs de preview:
- Branch `dev` → `https://seu-projeto-dev.vercel.app`
- PR #5 → `https://seu-projeto-git-pr-5.vercel.app`

---

## 🛠️ Troubleshooting

### Erro: "Build failed"

**Solução:**
```bash
# Teste o build localmente primeiro
npm run build

# Se der erro, corrija e commit
git add .
git commit -m "fix: Corrige erro de build"
git push
```

### Erro: "Module not found"

**Solução:** Verifique se todas as dependências estão no `package.json`
```bash
npm install
git add package.json package-lock.json
git commit -m "chore: Atualiza dependências"
git push
```

### Erro: "Cannot connect to Supabase"

**Solução:** Verifique variáveis de ambiente no Vercel:
1. **Settings** → **Environment Variables**
2. Confirme que todas as 3 variáveis estão corretas
3. **Redeploy** o projeto

### Erro: "Redirect URI mismatch"

**Solução:** Adicione a URL do Vercel no Supabase:
1. Supabase → **Authentication** → **URL Configuration**
2. Adicione a URL completa do Vercel

---

## ✅ Checklist Final

- ✅ Código commitado e pushed para GitHub
- ✅ Projeto importado no Vercel
- ✅ Variáveis de ambiente configuradas
- ✅ Deploy realizado com sucesso
- ✅ URL do Vercel adicionada no Supabase
- ✅ CORS configurado
- ✅ Aplicação testada e funcionando
- ✅ Login funciona corretamente
- ✅ Tutoriais aparecem e funcionam

---

## 📊 Monitoramento

### Vercel Analytics

O Vercel fornece analytics gratuitos:
- **Visitors:** Número de visitantes
- **Page Views:** Visualizações de página
- **Performance:** Core Web Vitals
- **Errors:** Erros de runtime

Acesse em: **Analytics** no menu do projeto

### Logs em Tempo Real

Para debug em produção:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ver logs ao vivo
vercel logs seu-projeto --follow
```

---

## 🔐 Segurança

### Configurações Recomendadas

O `vercel.json` já inclui headers de segurança:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`

### Variáveis Secretas

⚠️ **NUNCA** commite:
- `.env` (já está no `.gitignore`)
- Chaves de API
- Senhas
- Tokens secretos

Use sempre **Environment Variables** no Vercel.

---

## 📞 Suporte

**Documentação Vercel:** https://vercel.com/docs
**Documentação Supabase:** https://supabase.com/docs
**Documentação Next.js:** https://nextjs.org/docs

---

## 🎯 Próximos Passos Após Deploy

1. **Configurar CI/CD** - Testes automáticos antes do deploy
2. **Adicionar domínio customizado** - `gig.cavendish.com.br`
3. **Configurar SSL** - HTTPS automático (Vercel fornece grátis)
4. **Setup monitoring** - Sentry, LogRocket para erros
5. **Performance optimization** - Code splitting, lazy loading
6. **SEO** - Meta tags, sitemap, robots.txt

---

**✅ FIM DO GUIA - Deploy completo!** 🚀
