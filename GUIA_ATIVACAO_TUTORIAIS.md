# 📋 GUIA COMPLETO - Ativação do Sistema de Tutoriais

## 🎯 Visão Geral
Este guia detalha **exatamente** como ativar e testar o sistema de tutoriais interativos que foi implementado no sistema GIG.

---

## 📍 PASSO 1: Abrir Terminal no Diretório Correto

### Windows (PowerShell):
1. Pressione `Windows + X`
2. Selecione "Windows PowerShell" ou "Terminal"
3. Digite o comando:

```powershell
cd C:\Projects\CCE\Sistema_GIG\cavendish-gig-main
```

### Windows (CMD):
1. Pressione `Windows + R`
2. Digite `cmd` e pressione Enter
3. Digite o comando:

```cmd
cd C:\Projects\CCE\Sistema_GIG\cavendish-gig-main
```

### Verificar se está no diretório correto:
```bash
dir
# ou
ls
```

**✅ Você deve ver:**
- package.json
- src/
- supabase/
- node_modules/
- next.config.mjs

---

## 📍 PASSO 2: Instalar Dependências Necessárias

### Execute:
```bash
npm install
```

**⏱️ Tempo estimado:** 2-5 minutos

**O que acontece:**
- Instala todas as bibliotecas necessárias
- Cria/atualiza pasta `node_modules`
- Baixa pacotes do NPM

**✅ Como saber que funcionou:**
```
added 1234 packages in 3m
```

**❌ Se der erro:**
- Verifique se tem Node.js instalado: `node --version`
- Deve mostrar algo como `v16.x.x` ou superior
- Se não tiver, baixe em: https://nodejs.org

---

## 📍 PASSO 3: Configurar Supabase (Banco de Dados)

### 3.1. Verificar se Supabase CLI está instalado

```bash
supabase --version
```

**Se não estiver instalado:**

**Windows (via NPM):**
```bash
npm install -g supabase
```

**Windows (via Scoop):**
```bash
scoop install supabase
```

### 3.2. Verificar se Supabase está rodando

```bash
supabase status
```

**Se aparecer erro "Supabase not initialized":**
```bash
supabase init
```

**Se aparecer "Service not running":**
```bash
supabase start
```

**⏱️ Tempo estimado primeira vez:** 5-10 minutos (baixa containers Docker)

**✅ Como saber que funcionou:**
Você verá algo como:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbG...
service_role key: eyJhbG...
```

### 3.3. Aplicar Migrations (Criar Tabelas)

```bash
supabase db push
```

**O que acontece:**
- Cria tabela `tutorial_progress` (salva progresso dos tutoriais)
- Cria tabela `documento_comentarios` (comentários em documentos)
- Adiciona campo `drive_file_id` em documentos
- Cria 40+ índices para performance

**✅ Como saber que funcionou:**
```
Applying migration 20251213050000_add_drive_file_id.sql...
Applying migration 20251213051000_performance_indexes.sql...
Applying migration 20251213052000_documento_comentarios.sql...
Applying migration 20251213053000_tutorial_system.sql...
✔ All migrations applied successfully!
```

**❌ Se der erro "already exists":**
- Significa que já foi aplicado antes
- Está OK! Pode continuar

### 3.4. Verificar tabelas criadas (Opcional)

```bash
supabase db diff
```

**Se mostrar "No schema changes detected"** = ✅ Perfeito!

---

## 📍 PASSO 4: Iniciar Servidor de Desenvolvimento

### Execute:
```bash
npm run dev
```

**✅ Como saber que funcionou:**
```
   ready - started server on 0.0.0.0:3000

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**⚠️ IMPORTANTE:**
- **NÃO FECHE ESTE TERMINAL!**
- Deixe rodando enquanto usa o sistema
- Para parar: Pressione `Ctrl + C`

---

## 📍 PASSO 5: Acessar Sistema no Navegador

### 5.1. Abrir navegador
1. Abra Chrome, Edge, Firefox ou qualquer navegador
2. Digite na barra de endereço: `http://localhost:5173`
3. Pressione Enter

### 5.2. Fazer Login

**Se é primeira vez:**
1. Clique em "Criar conta" ou "Sign Up"
2. Preencha:
   - Email: `teste@exemplo.com`
   - Senha: `senha123` (ou qualquer senha)
3. Clique em "Cadastrar"
4. Faça login com as credenciais

**Se já tem conta:**
1. Digite email e senha
2. Clique em "Entrar"

---

## 📍 PASSO 6: Testar Sistema de Tutoriais

### 6.1. Localizar Botão de Ajuda

Após login, procure no **canto superior direito** da tela:

```
┌─────────────────────────────────────────┐
│  [Logo]  Portal do Consultor    🔔 ❓ 👤 │
│                                  ↑       │
│                                  │       │
│                            BOTÃO AQUI    │
└─────────────────────────────────────────┘
```

**Características:**
- Ícone: **?** (interrogação)
- Cor: Mesma do tema
- **Bolinha pulsante vermelha/azul** se tutorial não foi completado
- Ao lado do sino de notificações

### 6.2. Clicar no Botão ?

Abrirá um menu dropdown com opções:

**Para Consultor/Admin:**
```
┌─────────────────────────────────┐
│ Ajuda e Tutoriais              │
├─────────────────────────────────┤
│ 🎬 Tour de Boas-vindas         │
│    Conheça as principais...     │
│                                 │
│ 🤖 Gerar Documentos com IA     │
│    Aprenda a usar a IA...       │
│                                 │
├─────────────────────────────────┤
│ 👥 Ver Todos os Tutoriais      │
└─────────────────────────────────┘
```

**Para Cliente:**
```
┌─────────────────────────────────┐
│ Ajuda e Tutoriais              │
├─────────────────────────────────┤
│ 🎬 Tour de Boas-vindas         │
│    Conheça as principais...     │
│                                 │
│ 📄 Como Enviar Documentos      │
│    Aprenda a fazer upload...    │
│                                 │
│ 📋 Como Responder Diagnóstico  │
│    Guia completo para...        │
│                                 │
├─────────────────────────────────┤
│ 👥 Ver Todos os Tutoriais      │
└─────────────────────────────────┘
```

### 6.3. Selecionar um Tutorial

1. Clique em "Tour de Boas-vindas"
2. O menu fecha
3. **Em 1 segundo**, aparece:

```
┌──────────────────────────────────────┐
│ ✕                                    │
│                                       │
│ Bem-vindo ao GIG!                    │
│                                       │
│ Olá! Vou te guiar pelas principais  │
│ funcionalidades do sistema. Este     │
│ tutorial levará cerca de 5 minutos. │
│                                       │
│ ▓▓▓░░░░░░░░░░░░░░░░  1 de 9         │
│                                       │
│ [ Pular Tutorial ]     [ Próximo → ] │
└──────────────────────────────────────┘
```

**Características:**
- **Fundo escuro** cobrindo toda a tela (overlay)
- **Card branco** com o tutorial no centro ou perto do elemento
- **Borda azul** destacando o elemento que está sendo explicado
- **Barra de progresso** mostrando quantos passos faltam

### 6.4. Navegar pelo Tutorial

**Botões disponíveis:**
- **Próximo →** - Avança para próximo passo
- **← Anterior** - Volta um passo (aparece após 1º passo)
- **Pular Tutorial** - Marca como completo sem fazer
- **✕** (X no canto) - Fecha o tutorial (progresso salvo)

**O que acontece em cada passo:**
1. Tooltip se move para posição do elemento
2. Elemento é destacado com borda azul brilhante
3. Página rola automaticamente para mostrar o elemento
4. Barra de progresso atualiza
5. Conteúdo muda para explicar aquele elemento

### 6.5. Testar Persistência de Progresso

1. Avance alguns passos (ex: 3 de 9)
2. Clique no **X** para fechar
3. **Recarregue a página** (F5)
4. Clique no **?** novamente
5. Clique em "Tour de Boas-vindas"
6. ✅ **Deve continuar do passo 3!** (onde parou)

---

## 📍 PASSO 7: Testar com Diferentes Perfis

### 7.1. Criar usuário Consultor

1. Abra Supabase Studio: `http://localhost:54323`
2. Vá em "Authentication" → "Users"
3. Crie usuário: `consultor@teste.com`
4. Vá em "Table Editor" → tabela `profiles`
5. Edite o perfil e adicione role: `consultor`

### 7.2. Testar tutorial de Consultor

1. Faça logout do sistema
2. Login com `consultor@teste.com`
3. Clique no **?**
4. Verá tutoriais:
   - Tour de Boas-vindas (9 passos)
   - Gerar Documentos com IA (8 passos)

### 7.3. Criar usuário Cliente

1. No Supabase Studio, crie: `cliente@teste.com`
2. Na tabela `profiles`, adicione role: `cliente`
3. Na tabela `organization_members`, vincule a uma organização

### 7.4. Testar tutorial de Cliente

1. Logout e login com `cliente@teste.com`
2. Clique no **?**
3. Verá tutoriais:
   - Tour de Boas-vindas (10 passos)
   - Como Enviar Documentos (6 passos)
   - Como Responder Diagnóstico (7 passos)

---

## 📍 PASSO 8: Verificar Dados no Banco

### 8.1. Abrir Supabase Studio

```
http://localhost:54323
```

### 8.2. Ver progresso salvo

1. Clique em "Table Editor"
2. Selecione tabela `tutorial_progress`
3. Verá registros como:

```
| id   | user_id | tutorial_type | current_step | is_completed | last_seen_at        |
|------|---------|---------------|--------------|--------------|---------------------|
| 1    | abc123  | onboarding    | 3            | false        | 2024-12-13 10:30:00 |
```

**Isso confirma que:**
- ✅ Tutorial está salvando progresso
- ✅ Pode retomar de onde parou
- ✅ Sistema está 100% funcional

---

## 🎯 RESUMO DOS COMANDOS

**Executar em sequência (copy/paste):**

```bash
# 1. Navegar até o projeto
cd C:\Projects\CCE\Sistema_GIG\cavendish-gig-main

# 2. Instalar dependências
npm install

# 3. Iniciar Supabase (se não estiver rodando)
supabase start

# 4. Aplicar migrations
supabase db push

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

**Depois:**
- Abrir navegador em `http://localhost:5173`
- Fazer login
- Clicar no **?** no canto superior direito
- Escolher tutorial
- Aproveitar! 🎉

---

## ❓ Troubleshooting (Resolução de Problemas)

### Problema: "Supabase not found"
**Solução:**
```bash
npm install -g supabase
```

### Problema: "Port 5173 already in use"
**Solução:**
```bash
# Parar processo usando a porta
netstat -ano | findstr :5173
taskkill /PID [número_do_PID] /F

# Ou usar outra porta
npm run dev -- --port 3000
```

### Problema: "Cannot find module"
**Solução:**
```bash
# Deletar node_modules e reinstalar
rm -rf node_modules
npm install
```

### Problema: Tutorial não aparece
**Verificar:**
1. Migrations foram aplicadas? `supabase db push`
2. Componentes UI existem? Checar `src/components/ui/`
3. Console do navegador (F12) mostra erros?

### Problema: Botão ? não aparece
**Verificar:**
1. Você está logado?
2. Refresh a página (Ctrl + F5)
3. Abra DevTools (F12) → Console → procure erros

---

## 📞 Suporte

**Arquivos importantes para revisar:**
- `IMPLEMENTACOES_COMPLETAS.md` - Documentação completa
- `src/config/tutorials.ts` - Configuração dos tutoriais
- `src/components/tutorial/TutorialGuide.tsx` - Componente principal
- `src/hooks/useTutorial.ts` - Lógica de estado

**Verificar se tudo está OK:**
```bash
# Ver status do Supabase
supabase status

# Ver migrations aplicadas
supabase migration list

# Ver logs do servidor
# (já aparece no terminal onde rodou npm run dev)
```

---

**✅ FIM DO GUIA**

Se seguiu todos os passos, o sistema de tutoriais está **100% funcional**! 🎉
