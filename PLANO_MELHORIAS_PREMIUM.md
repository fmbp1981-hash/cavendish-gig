# 🎨 Plano de Melhorias Premium - Sistema GIG

**Branch:** `feature/premium-ux-improvements`
**Data:** 20/01/2026
**Objetivo:** Transformar o Sistema GIG em uma plataforma Premium de governança corporativa

---

## 📊 ANÁLISE ATUAL

### ✅ **O Que Já Existe e Funciona:**

1. **Sistema de Tutoriais** (`src/components/tutorial/`)
   - ✅ Componente TutorialGuide interativo
   - ✅ Hook useTutorial com controle de estado
   - ✅ Tutoriais criados para todos os perfis:
     - Consultor Onboarding (9 passos)
     - Cliente Onboarding (10 passos)
     - Colaborador Onboarding (6 passos)
     - Tutoriais específicos (documentos, diagnóstico, IA)
   - ✅ Sistema de tracking (salva progresso no banco)
   - ✅ Overlay visual com destaque de elementos

2. **Sistema de Branding** (`src/components/branding/`)
   - ✅ TenantBrandingProvider funcional
   - ✅ Tabela `tenant_branding` no banco
   - ✅ Suporte a:
     - Logo personalizada
     - Favicon
     - Cores primárias/secundárias/accent (HSL)
     - CSS customizado
   - ✅ Aplicação automática de cores via CSS variables

3. **Design System** (Tailwind + shadcn/ui)
   - ✅ Paleta de cores profissional (Cavendish Blue)
   - ✅ Tokens de design bem definidos
   - ✅ Componentes shadcn/ui instalados
   - ✅ Font: Inter (Google Fonts)
   - ✅ Dark mode implementado

---

## 🎯 MELHORIAS NECESSÁRIAS

### 1. 📚 **SISTEMA DE TUTORIAIS ROBUSTO**

#### **Problemas Atuais:**
- ❌ Tutoriais não são ativados automaticamente no primeiro login
- ❌ Falta botão de "?" fixo para reativar tutoriais
- ❌ Falta tour completo explicando TODAS as funcionalidades
- ❌ Falta manual/documentação dentro do sistema
- ❌ Não há tour para funcionalidades complexas (ex: IA, relatórios)

#### **Melhorias a Implementar:**

##### **1.1. Tour Inicial Automático**
- ✨ Ativar tour automaticamente no primeiro login (por perfil)
- ✨ Modal de boas-vindas personalizado por perfil
- ✨ Opção "Pular tour" ou "Fazer tour completo"

##### **1.2. Botão de Ajuda Permanente**
- ✨ Botão "?" flutuante no canto superior direito (todas as páginas)
- ✨ Dropdown com opções:
  - "Reiniciar Tour Completo"
  - "Ver Manual do Usuário"
  - "Tutoriais Específicos" (submenu)
  - "Central de Ajuda"
  - "Contatar Suporte"

##### **1.3. Tours Contextuais**
- ✨ Ao acessar uma página pela primeira vez, sugerir tour
- ✨ Toast com "Primeira vez aqui? 👋 Fazer tour rápido?"
- ✨ Tours específicos para:
  - Dashboard Admin
  - Gestão de Usuários
  - Integrações
  - Geração de Documentos IA
  - Relatórios Automáticos
  - Configurações de Branding

##### **1.4. Central de Ajuda Integrada**
- ✨ Página `/help` com:
  - Busca de tutoriais
  - FAQs por categoria
  - Vídeos tutoriais (embeds YouTube se disponíveis)
  - Documentação completa por funcionalidade
  - Glossário de termos

##### **1.5. Manual do Usuário Dinâmico**
- ✨ Documentação HTML renderizada no sistema
- ✨ Estrutura:
  ```
  /help/
    /admin/
      - gestao-usuarios.md
      - configuracoes.md
      - integracoes.md
    /consultor/
      - gerenciar-clientes.md
      - gerar-documentos-ia.md
      - relatorios.md
    /cliente/
      - enviar-documentos.md
      - responder-diagnostico.md
      - treinamentos.md
  ```
- ✨ Markdown → HTML com sintaxe highlighting
- ✨ Breadcrumbs de navegação
- ✨ Busca full-text

##### **Arquivos a Criar:**
- `src/components/help/HelpButton.tsx` - Botão flutuante
- `src/components/help/HelpDropdown.tsx` - Menu dropdown
- `src/components/help/TourSuggestion.tsx` - Toast de sugestão
- `src/spa/pages/Help.tsx` - Central de ajuda
- `src/spa/pages/help/[categoria]/[pagina].tsx` - Páginas dinâmicas
- `docs/manual/` - Diretório com documentação markdown
- `src/hooks/useFirstVisit.ts` - Hook para detectar primeira visita

---

### 2. 🎨 **DESIGN PREMIUM**

#### **Problemas Atuais:**
- ❌ Fontes muito grandes (texto parece "gritando")
- ❌ Espaçamentos muito largos
- ❌ Bordas/linhas muito grossas
- ❌ Falta hierarquia visual clara
- ❌ Falta microinterações e animações sutis
- ❌ Cards muito "pesados"

#### **Melhorias a Implementar:**

##### **2.1. Tipografia Refinada**
```css
/* Antes */
h1: 2.5rem (40px)  →  /* Depois */ 2rem (32px)
h2: 2rem (32px)    →  1.75rem (28px)
h3: 1.5rem (24px)  →  1.25rem (20px)
body: 1rem (16px)  →  0.875rem (14px)
small: 0.875rem    →  0.75rem (12px)

/* Line height */
body: 1.5          →  1.6
headings: 1.2      →  1.3
```

##### **2.2. Espaçamentos Reduzidos**
```css
/* Padding de cards */
p-6 (24px)  →  p-4 (16px)
p-8 (32px)  →  p-5 (20px)

/* Gaps */
gap-6 (24px)  →  gap-4 (16px)
gap-8 (32px)  →  gap-5 (20px)

/* Margins */
my-8 (32px)  →  my-5 (20px)
```

##### **2.3. Bordas e Sombras Sutis**
```css
/* Bordas */
border-2  →  border (1px)
border-4  →  border-2 (2px)

/* Border radius */
rounded-lg (0.625rem) → rounded-md (0.5rem)
rounded-xl (1rem) → rounded-lg (0.625rem)

/* Shadows */
shadow-lg  →  shadow-sm (mais sutil)
+ adicionar shadow-glow apenas em hovers
```

##### **2.4. Microinterações**
- ✨ Hover states em todos os botões/cards
- ✨ Transições suaves (150-200ms)
- ✨ Loading skeletons ao invés de spinners
- ✨ Toast notifications animados
- ✨ Progress bars animados
- ✨ Ripple effect em cliques

##### **2.5. Hierarquia Visual**
- ✨ Sistema de pesos de fonte:
  - Títulos: font-semibold (600)
  - Subtítulos: font-medium (500)
  - Corpo: font-normal (400)
- ✨ Cores de texto hierárquicas:
  - Primary: foreground (100%)
  - Secondary: muted-foreground (70%)
  - Tertiary: muted-foreground/60 (60%)

##### **Arquivos a Ajustar:**
- `src/index.css` - Tokens de design
- `tailwind.config.ts` - Valores de spacing/sizing
- Todos os componentes de UI (Button, Card, Input, etc)

---

### 3. 🎨 **BRANDING INTELIGENTE**

#### **O Que Falta:**

##### **3.1. Extração Automática de Cores da Logo**
- ✨ Ao fazer upload da logo, usar IA/biblioteca para:
  1. Extrair paleta de cores dominantes
  2. Sugerir 3-5 combinações de cores
  3. Gerar HSL para primary/secondary/accent
- ✨ Bibliotecas a usar:
  - `color-thief` - Extração de paleta
  - `chroma-js` - Manipulação de cores
  - `colorthief-react` - React wrapper

##### **3.2. Seletor de Paleta de Cores**
- ✨ Interface visual para escolher paleta
- ✨ Preview em tempo real da aplicação das cores
- ✨ Opção "Usar cores da logo automaticamente"
- ✨ Opção "Escolher cores manualmente"
- ✨ Paletas pré-definidas inspiradoras:
  - Corporate Blue
  - Tech Purple
  - Finance Green
  - Legal Navy
  - Modern Gray

##### **3.3. Página de Configuração de Branding**
- ✨ `/admin/branding` ou `/consultor/configuracoes/branding`
- ✨ Seções:
  1. **Logo e Identidade**
     - Upload logo (PNG/SVG, max 2MB)
     - Upload favicon (ICO/PNG, 32x32)
     - Nome da empresa
  2. **Cores**
     - Extrator automático de cores
     - Seletor de paleta
     - Preview em tempo real
  3. **Tipografia** (futuro)
     - Escolha de fonte
  4. **CSS Avançado** (para devs)
     - Editor de CSS customizado

##### **3.4. Branding no Nome do Sistema**
- ✨ Substituir "Sistema GIG" por:
  ```
  "Sistema GIG - [NOME DA EMPRESA]"
  ```
- ✨ Exibir em:
  - Title da página (tab do navegador)
  - Logo no sidebar
  - Rodapé
  - Emails automáticos

##### **Arquivos a Criar/Modificar:**
- `src/spa/pages/admin/Branding.tsx` - Página de configuração
- `src/components/branding/LogoUploader.tsx` - Upload com preview
- `src/components/branding/ColorExtractor.tsx` - Extração de cores
- `src/components/branding/ColorPicker.tsx` - Seletor de paleta
- `src/components/branding/BrandingPreview.tsx` - Preview em tempo real
- `src/hooks/useColorExtraction.ts` - Hook para extrair cores
- `src/lib/colorUtils.ts` - Utilitários de manipulação de cores

---

## 📦 DEPENDÊNCIAS A INSTALAR

```bash
npm install color-thief colorthief-react chroma-js
npm install @uiw/react-color          # Color picker
npm install react-markdown remark-gfm # Markdown rendering
npm install shiki                     # Syntax highlighting
```

---

## 🗓️ CRONOGRAMA DE IMPLEMENTAÇÃO

### **Fase 1: Design Premium (2-3 horas)** 🎨
- [ ] Ajustar tipografia global
- [ ] Reduzir espaçamentos
- [ ] Suavizar bordas e sombras
- [ ] Implementar microinterações
- [ ] Testar em todas as páginas principais

### **Fase 2: Sistema de Tutoriais Robusto (4-5 horas)** 📚
- [ ] Criar HelpButton flutuante
- [ ] Implementar tour inicial automático
- [ ] Criar Central de Ajuda (/help)
- [ ] Escrever documentação markdown
- [ ] Implementar tours contextuais

### **Fase 3: Branding Inteligente (3-4 horas)** 🎨
- [ ] Criar página de configuração de branding
- [ ] Implementar extração de cores da logo
- [ ] Criar seletor de paleta
- [ ] Implementar preview em tempo real
- [ ] Adicionar nome da empresa ao sistema

### **Fase 4: Testes e Refinamentos (2 horas)** ✅
- [ ] Testar em diferentes resoluções
- [ ] Testar com diferentes perfis (admin/consultor/cliente)
- [ ] Ajustar responsividade
- [ ] Coletar feedback
- [ ] Polir detalhes

---

## 🎯 RESULTADO ESPERADO

### **Antes:**
- ❌ Sistema "pesado" visualmente
- ❌ Difícil de aprender
- ❌ Aparência genérica
- ❌ Sem personalização

### **Depois:**
- ✅ Interface elegante e leve
- ✅ Fácil de aprender com tours guiados
- ✅ Totalmente personalizado por empresa
- ✅ Identidade visual adaptada à marca do cliente
- ✅ Experiência premium de ponta a ponta

---

## 🚀 PRÓXIMOS PASSOS

**AGUARDANDO APROVAÇÃO:**

Deseja que eu:
1. **Comece pela Fase 1 (Design Premium)**?
2. **Comece pela Fase 2 (Tutoriais)**?
3. **Comece pela Fase 3 (Branding)**?
4. **Faça tudo em sequência**?

**Tempo estimado total:** 11-14 horas de implementação

---

**Branch criada:** ✅ `feature/premium-ux-improvements`
**Status:** Aguardando direção
