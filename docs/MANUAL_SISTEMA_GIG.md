# Manual do Sistema GIG — Gestão Integrada de Governança

**Versão:** 2.0 — Premium
**Última atualização:** 2026-03-10
**Desenvolvido por:** IntelliX.AI
**Operado por:** Cavendish Consultoria Empresarial

---

## Índice

1. [Objetivo e Visão Geral](#1-objetivo-e-visão-geral)
2. [Perfis de Usuário e Responsabilidades](#2-perfis-de-usuário-e-responsabilidades)
3. [Arquitetura e Tecnologia](#3-arquitetura-e-tecnologia)
4. [Planos Disponíveis](#4-planos-disponíveis)
5. [Portal do Cliente (PME)](#5-portal-do-cliente-pme)
6. [Portal do Consultor](#6-portal-do-consultor)
7. [Módulo de Compliance — GRC Completo](#7-módulo-de-compliance--grc-completo)
8. [Módulos Executivos Premium](#8-módulos-executivos-premium)
9. [Painel do Administrador](#9-painel-do-administrador)
10. [Inteligência Artificial Integrada](#10-inteligência-artificial-integrada)
11. [Integrações Externas](#11-integrações-externas)
12. [Segurança e Governança de Dados](#12-segurança-e-governança-de-dados)
13. [Fluxos Operacionais Passo a Passo](#13-fluxos-operacionais-passo-a-passo)
14. [Tour Interativo Guiado](#14-tour-interativo-guiado)
15. [Variáveis de Ambiente e Segredos](#15-variáveis-de-ambiente-e-segredos)
16. [Troubleshooting](#16-troubleshooting)
17. [Gestão de Acessos — Runbook](#17-gestão-de-acessos--runbook)

---

## 1. Objetivo e Visão Geral

O **Sistema GIG** (Gestão Integrada de Governança) é uma plataforma SaaS multi-tenant desenvolvida pela **IntelliX.AI** para a **Cavendish Consultoria Empresarial**, com o objetivo de operacionalizar programas de **Governança, Integridade e Compliance (GRC)** em PMEs de forma escalável, rastreável e automatizada.

### Proposta de valor

| Sem o GIG | Com o GIG |
|-----------|-----------|
| Planilhas e Word sem rastreabilidade | Plataforma centralizada com histórico imutável |
| Horas gerando documentos manualmente | Código de Ética gerado em < 30s por IA |
| Sem canal de denúncias confiável | Canal anônimo com protocolo e fluxo completo |
| Relatórios feitos "na mão" a cada mês | Relatório de progresso automático em 1 clique |
| Sem visibilidade executiva | Board Report com link público para a diretoria |
| 5 clientes por consultor (limite humano) | 50+ clientes por consultor com automações |

### Foco do sistema
- **Rastreabilidade:** toda ação registrada em Audit Trail imutável
- **Padronização:** catálogo de documentos, templates e fluxos padronizados
- **Automatização:** IA para geração de documentos, relatórios e atas
- **Visibilidade executiva:** KPIs, ESG, Board Reporting e Calendário Regulatório

---

## 2. Perfis de Usuário e Responsabilidades

O sistema é orientado a papéis (roles). Cada usuário pode ter múltiplos papéis.

### 2.1 Admin (Cavendish)
Governa toda a plataforma. Acessa todas as rotas `/admin/*`.

**Responsabilidades:**
- Configurar integrações (OpenAI, Google, Resend, Twilio, Fireflies)
- Cadastrar organizações clientes com CNPJ, segmento e plano
- Pré-cadastrar consultores por e-mail
- Definir o catálogo de documentos obrigatórios por tipo de projeto
- Configurar branding (white-label) por organização
- Gerenciar usuários, roles e permissões
- Monitorar Audit Trail, Logs do Sistema e saúde da plataforma

### 2.2 Consultor (Cavendish)
Conduz a implantação e recorrência do programa. Acessa rotas `/consultor/*`.

**Responsabilidades:**
- Gerenciar carteira de organizações clientes
- Validar (aprovar/rejeitar) documentos enviados pelos clientes
- Gerar Código de Ética, Atas e Relatórios com IA
- Operar os módulos de Compliance (Políticas, Riscos, LGPD, etc.)
- Agendar reuniões e criar atas automáticas (Fireflies)
- Monitorar KPIs, ESG e gerar Board Reports para a diretoria
- Acompanhar o Calendário Regulatório e obrigações legais

### 2.3 Cliente / Colaborador (PME)
Executa o programa de compliance. Acessa rotas `/meu-projeto/*`.

**Responsabilidades:**
- Responder o Diagnóstico de Maturidade em Compliance
- Enviar documentos e evidências requeridos
- Realizar treinamentos e obter certificados
- Ler e assinar o Código de Ética digitalmente
- Acompanhar o progresso do programa

### 2.4 Parceiro
Empresa associada com acesso limitado. Acessa `/parceiro/*`.

### 2.5 Público (sem autenticação)
- Acessa o Canal de Denúncias em `/denuncia`
- Consulta status por protocolo em `/consulta-protocolo`

---

## 3. Arquitetura e Tecnologia

### Stack principal

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Roteamento SPA | React Router DOM v6 (catch-all `[[...slug]]`) |
| Estado / Cache | TanStack Query v5 |
| Banco de dados | PostgreSQL 17 via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Backend | Edge Functions (Deno, serverless) |
| IA | OpenAI GPT-4 |
| Gráficos | Recharts |
| Calendário | react-big-calendar |
| PDF | html2canvas + jsPDF (client-side) |
| Deploy | Vercel (frontend) + Supabase (backend) |

### Padrão híbrido: App Router + SPA

O Next.js gerencia as páginas públicas com SSR. A rota catch-all `[[...slug]]` carrega o `App.tsx` com `dynamic({ ssr: false })`, que contém o React Router com todas as rotas autenticadas — sem SSR nas rotas protegidas.

### Multi-tenant por RLS

Cada organização é um **tenant isolado**. O isolamento é garantido por **Row Level Security (RLS)** em todas as 40+ tabelas do banco. Nenhum dado de uma organização é acessível por usuários de outra, mesmo usando a mesma anon key.

---

## 4. Planos Disponíveis

| Funcionalidade | Essencial | Executivo | Premium |
|----------------|:---------:|:---------:|:-------:|
| Diagnóstico de Maturidade | ✓ | ✓ | ✓ |
| Canal de Denúncias Anônimo | ✓ | ✓ | ✓ |
| Gestão de Documentos + Catálogo | ✓ | ✓ | ✓ |
| Treinamentos + Certificados | ✓ | ✓ | ✓ |
| Código de Ética com IA | ✓ | ✓ | ✓ |
| Adesão Digital ao Código de Ética | ✓ | ✓ | ✓ |
| Gestão de Tarefas (Kanban) | ✓ | ✓ | ✓ |
| KPIs de Compliance em Tempo Real | ✓ | ✓ | ✓ |
| Relatórios Mensais + PDF | — | ✓ | ✓ |
| Atas de Reunião com IA | — | ✓ | ✓ |
| Agendamento (Google Meet) | — | ✓ | ✓ |
| Políticas, LGPD, Conflitos de Interesses | — | — | ✓ |
| Gestão de Riscos (matriz P×I) | — | — | ✓ |
| Due Diligence de Fornecedores | — | — | ✓ |
| Calendário Regulatório | — | — | ✓ |
| ESG Dashboard | — | — | ✓ |
| Board Reporting com link público | — | — | ✓ |
| Google Drive + Branding white-label | — | — | ✓ |
| Fireflies.ai (transcrição automática) | — | — | ✓ |
| WhatsApp Business (Twilio) | — | — | ✓ |

---

## 5. Portal do Cliente (PME)

Acesso: `/meu-projeto` e sub-rotas.

### 5.1 Meu Projeto — Visão Geral
- Exibe a fase atual do programa: **Diagnóstico → Implementação → Recorrência**
- Cards de progresso: documentos aprovados/pendentes, treinamentos, adesão ao código
- Ações rápidas para os próximos passos do programa

### 5.2 Diagnóstico de Maturidade (`/meu-projeto/diagnostico`)

O diagnóstico avalia o nível de maturidade em compliance da organização em múltiplas dimensões:
- Estrutura societária e governança
- Políticas e procedimentos internos
- Gestão de riscos
- Planejamento estratégico
- Conformidade legal e regulatória

**Resultado:** Score geral (0–100), score por dimensão, nível de maturidade (Inicial / Em desenvolvimento / Estabelecido / Otimizado) e recomendações prioritárias.

**Uso:** O consultor usa o score para personalizar o Código de Ética e o plano de ação. A IA usa as respostas como contexto para geração de documentos.

### 5.3 Documentos e Evidências (`/meu-projeto/documentos-necessarios`)

- Lista de documentos obrigatórios e complementares com status visual
- Upload de arquivos (PDF, DOC, imagens)
- Acompanhamento do status: Pendente → Enviado → Em Análise → Aprovado / Rejeitado
- Reenvio quando rejeitado (com visualização da observação do consultor)
- Repositório de documentos aprovados com download e visualização PDF

### 5.4 Treinamentos (`/meu-projeto/treinamentos`)

- Catálogo de módulos de treinamento com descrição, carga horária e pré-requisitos
- Conteúdo multimídia (texto, vídeo, apresentações)
- Quiz de avaliação ao final de cada módulo
- Nota mínima configurável para aprovação
- Emissão automática de certificado em PDF ao ser aprovado
- Consulta e download de certificados anteriores

### 5.5 Código de Ética (`/meu-projeto/codigo-etica`)

- Visualização da versão ativa do Código de Ética da organização
- Registro de adesão formal com carimbo de data/hora
- Histórico de versões anteriores
- O colaborador recebe confirmação por e-mail após assinar

### 5.6 Configurações do Cliente (`/meu-projeto/configuracoes`)

- Atualizar nome, avatar e dados de perfil
- Alterar senha
- Gerenciar preferências de notificação

---

## 6. Portal do Consultor

Acesso: `/consultor` e sub-rotas.

### 6.1 Dashboard do Consultor (`/consultor`)

Visão consolidada de toda a carteira de clientes:
- Cards resumo: total de organizações, tarefas pendentes, documentos aguardando análise, próximas reuniões
- Lista de organizações com indicador de progresso e alertas
- Gráfico de atividade recente por tipo de ação

**Uso recomendado:** Acessar **no início de cada dia** para identificar o que precisa de atenção imediata.

### 6.2 Clientes / Organizações (`/consultor/clientes`)

- Lista de todas as organizações atribuídas ao consultor
- Filtros por status do programa, fase e progresso
- Acesso ao **detalhe completo de cada organização** (`/consultor/clientes/:id`):
  - Fase atual e progresso geral
  - Aba de documentos com fila de análise
  - Aba de tarefas
  - **Aba de Atas de Reunião** — lista as atas geradas via Fireflies, com visualização e download

### 6.3 Validação de Documentos (`/consultor/documentos`)

- Fila de documentos aguardando análise (status "enviado" ou "em_análise")
- Filtros por organização, tipo de documento e data de envio
- Para cada documento: visualizar arquivo, aprovar ou rejeitar com observação obrigatória
- Ao aprovar/rejeitar: notificação automática enviada ao cliente (e-mail e/ou WhatsApp)

### 6.4 Gestão de Tarefas — Kanban (`/consultor/tarefas`)

- Quadro Kanban com colunas: A Fazer → Em Andamento → Concluído
- Drag-and-drop para mover cards entre colunas (ordenação por `kanban_order`)
- Criar tarefa com: título, descrição, organização, responsável (consultor ou cliente), prazo e prioridade
- Tarefas atribuídas ao **cliente** aparecem no portal deles como obrigações
- Filtros por organização, responsável e status
- Alertas visuais para tarefas vencidas (badge vermelho)

### 6.5 Adesão ao Código de Ética (`/consultor/adesao-etica`)

- Selecionar a organização e listar todos os colaboradores com status de adesão
- Ver quem assinou ✅ e quem está pendente ⏳ com a data de adesão
- Enviar lembretes individuais ou em lote para não-assinantes
- Acompanhar o percentual de adesão com gráfico em tempo real

### 6.6 Compliance — Módulo GRC (`/consultor/compliance`)

Ver **Seção 7** para documentação completa das 7 abas.

### 6.7 Calendário Regulatório (`/consultor/compliance-calendar`)

Ver **Seção 8.1**.

### 6.8 Dashboard ESG (`/consultor/esg`)

Ver **Seção 8.2**.

### 6.9 Board Reporting (`/consultor/board`)

Ver **Seção 8.3**.

### 6.10 Relatórios de Progresso (`/consultor/relatorios`)

- Selecionar organização e mês de referência
- O sistema calcula o índice de conformidade com base em:
  - % de documentos aprovados vs. requeridos
  - % de tarefas concluídas
  - % de treinamentos concluídos
  - Número de adesões ao Código de Ética
- Exportação em PDF (html2canvas + jsPDF)
- Histórico de relatórios enviados com data e destinatário

### 6.11 Agenda Unificada (`/consultor/agenda`)

- Calendário integrado com eventos do Google Calendar (green = reuniões GIG, azul = outros)
- Tarefas com prazo aparecem como eventos (laranja)
- Views: Mês, Semana, Dia, Agenda
- Botão "Sincronizar" para atualizar do Google Calendar

### 6.12 Agendamento de Reuniões (`/consultor/agendamento`)

- Criar reunião com: organização, participantes, data/hora, pauta e duração
- Integração Google Calendar: evento criado automaticamente com Google Meet
- Envio de convite por e-mail para todos os participantes
- Após a reunião: transcrição via Fireflies → geração automática de ata com IA

### 6.13 Denúncias (`/consultor/denuncias`)

- Lista de denúncias das organizações atribuídas com status e categoria
- Abrir denúncia para ver o relato completo (anônimo)
- Alterar status: Nova → Em Análise → Concluída / Improcedente
- Registrar notas internas de investigação (não visíveis ao denunciante)
- Abrir **Drawer de Investigação** para cada denúncia: notas, responsável, evidências, linha do tempo

### 6.14 IA — Código de Ética (`/consultor/codigo-etica`)

- Selecionar organização (diagnóstico deve estar respondido)
- Clicar em "Gerar Código de Ética" — GPT-4 gera o documento personalizado em < 30s
- Editor integrado para ajustes finos
- Aprovar e publicar: código fica disponível no portal do cliente para adesão

### 6.15 IA — Atas de Reunião (`/consultor/atas`)

- Colar a transcrição da reunião (do Fireflies, Teams, Meet ou qualquer ferramenta)
- Selecionar organização e tipo de reunião
- "Gerar Ata com IA" — a IA estrutura automaticamente: participantes, decisões, responsáveis, prazos
- Exportar PDF ou copiar em markdown
- Ata salva automaticamente no repositório de documentos da organização

### 6.16 IntelliX AI — Chat no Header

O assistente de IA está disponível no ícone ✨ do cabeçalho de **todas as páginas** do Portal do Consultor e do Painel Admin.

**Funcionalidades:**
- Conversa multi-turn com histórico da sessão
- Sugestões de perguntas contextuais na tela inicial
- Perguntas úteis: *"Quais clientes têm documentos pendentes?"*, *"Resuma o status dos projetos"*, *"Como cadastrar uma nova política?"*
- Minimizar sem fechar a conversa
- Disponível para Admin e Consultor

---

## 7. Módulo de Compliance — GRC Completo

Acesso: `/consultor/compliance` — 7 abas integradas em uma única página.

### 7.1 Aba — Políticas Corporativas

Gerencie todas as políticas corporativas da organização com fluxo de aprovação estruturado.

**Fluxo de status:** Rascunho → Em Revisão → Aprovado → Publicado → Revogado

**Como usar:**
1. Selecionar a organização no filtro superior
2. Clicar em **"Nova Política"**
3. Preencher: título, categoria (anticorrupção, LGPD, trabalhista, ambiental, financeira, segurança, conduta, outra), conteúdo e data de vigência
4. Salvar como rascunho e revisar
5. Avançar o status clicando em **"Mover para: Em Revisão"** → **"Mover para: Aprovado"** → **"Mover para: Publicado"**
6. Quando publicada, a política fica disponível para adesão dos colaboradores
7. Acompanhar o **% de adesão** no painel lateral de cada política
8. Para revogar: clicar em **"Revogar"** (somente políticas em revisão, aprovadas ou publicadas)

**Campos:** título, categoria, conteúdo (texto livre), data de vigência início/fim, versão auto-incrementada, aprovado por/em.

### 7.2 Aba — Conflito de Interesses

Gerenciamento das declarações anuais de conflito de interesses de todos os colaboradores.

**Como usar (Consultor):**
1. Selecionar a organização e o ano de referência
2. Visualizar o **painel de pendências**: quem ainda não declarou no ano corrente
3. Enviar lembretes para colaboradores pendentes
4. Na lista de declarações recebidas: clicar em uma declaração para **analisar**
5. Registrar observação e marcar como "Analisado"
6. Exportar o relatório de declarações para auditoria

**Como usar (Cliente/Colaborador):**
1. Acessar a solicitação de declaração enviada por e-mail
2. Declarar se possui ou não conflito de interesses
3. Se sim: descrever o conflito no campo de texto
4. Enviar — a declaração fica registrada com data/hora e IP

**Fluxo de status:** Pendente → Enviado → Analisado

### 7.3 Aba — LGPD

Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).

#### Sub-aba: Inventário de Dados

Mapeamento de todos os dados pessoais tratados pela organização.

**Como usar:**
1. Clicar em **"Novo Item do Inventário"**
2. Preencher:
   - **Nome do dado:** ex. "E-mail de colaboradores"
   - **Titular:** Colaborador / Cliente / Fornecedor / Outro
   - **Base legal:** Consentimento / Contrato / Obrigação legal / Interesse legítimo / etc.
   - **Finalidade:** Para que o dado é usado
   - **Onde está armazenado** e por quanto tempo
3. Salvar — o item fica no inventário para auditoria da ANPD

#### Sub-aba: Solicitações de Titulares (DSR)

Gerenciamento das solicitações de exercício de direitos (acesso, correção, exclusão, etc.).

**Como usar:**
1. Ao receber uma solicitação via canal de atendimento, clicar em **"Nova Solicitação"**
2. Registrar: nome do titular, tipo de solicitação (acesso, correção, exclusão, portabilidade, revogação de consentimento, etc.), canal de entrada e descrição
3. O sistema calcula automaticamente o **prazo de 15 dias** a partir da criação
4. Acompanhar o contador de dias restantes (fica vermelho quando próximo do vencimento)
5. Registrar a resposta dada e marcar como concluída

**Alerta:** Solicitações não respondidas em 15 dias ficam marcadas em vermelho — infração à LGPD.

### 7.4 Aba — Gestão de Riscos

Identificação, avaliação e mitigação de riscos corporativos com matriz de probabilidade × impacto.

**Matriz de risco:**
- Probabilidade: 1–5 (Muito Baixa → Muito Alta)
- Impacto: 1–5 (Insignificante → Catastrófico)
- Score = Probabilidade × Impacto (1–25)
- Níveis: Baixo (1–4), Médio (5–9), Alto (10–14), Crítico (15–25)

**Como usar:**
1. Clicar em **"Novo Risco"**
2. Preencher: título, categoria (operacional, financeiro, regulatório, reputacional, estratégico, cibernético), probabilidade, impacto, status (identificado, em mitigação, aceito, encerrado), responsável e prazo
3. O sistema calcula o score e nível automaticamente
4. Na lista, visualizar o **mapa de calor** com os riscos posicionados na matriz
5. Clicar em um risco para abrir o **painel de detalhes**:
   - Adicionar **Ações de Mitigação** (título, responsável, prazo, status)
   - Registrar **Avaliações Periódicas** com justificativa de mudança de score
6. Acompanhar a evolução do risco ao longo do tempo

### 7.5 Aba — Due Diligence de Fornecedores

Avaliação de terceiros (fornecedores, parceiros, prestadores) com questionários estruturados de integridade.

**Como usar:**
1. Selecionar a organização
2. Clicar em **"Novo Fornecedor"**
3. Preencher: razão social, CNPJ, categoria (TI, financeiro, logística, consultoria, construção, saúde, alimentação, outro), nível de criticidade (baixo, médio, alto, crítico), contato e website
4. Com o fornecedor criado, clicar em **"Iniciar Due Diligence"**
5. Um questionário estruturado é gerado automaticamente com perguntas sobre: processos internos, conformidade legal, saúde financeira, histórico de sanções, etc.
6. Preencher as respostas (sim/não/parcial com comentário) para cada pergunta
7. Clicar em **"Finalizar Avaliação"** — o sistema calcula o **score de risco** (0–100)
8. O score é exibido com código de cor: Verde (baixo), Amarelo (médio), Laranja (alto), Vermelho (crítico)
9. Agendar próxima avaliação conforme o nível de risco

### 7.6 Aba — KPIs de Compliance

Painel consolidado com os principais indicadores de conformidade da organização selecionada.

**Indicadores disponíveis:**
- Índice de Conformidade (% documentos aprovados / total requeridos)
- Taxa de Entrega (% projetos com documentos entregues)
- Tarefas Concluídas (% das tarefas do mês)
- Conclusão de Treinamentos (% média de progresso nos treinamentos)
- Gráfico: Documentos por status (Pizza)
- Gráfico: Projetos por fase (Barras)
- Gráfico: Atividade de tarefas no tempo (Linha — últimos 30 dias)

### 7.7 Aba — Consulta CEIS

Consulta ao **Cadastro de Empresas Inidôneas e Suspensas** (CEIS) da CGU para verificação de fornecedores, parceiros ou candidatos antes de assinar contratos.

**Como usar:**
1. Digitar o CNPJ ou razão social no campo de busca
2. A consulta é feita em tempo real na API da CGU/Portal da Transparência
3. Resultado indica se a empresa está ou não sancionada, com o tipo de sanção e período

---

## 8. Módulos Executivos Premium

### 8.1 Calendário Regulatório (`/consultor/compliance-calendar`)

Agenda centralizada de todas as obrigações regulatórias e prazos legais das organizações.

**Periodicidades suportadas:** Única / Mensal / Trimestral / Semestral / Anual

**Como usar:**
1. Selecionar a organização (ou deixar em "Obrigações globais" para criar uma obrigação que se aplica a todos)
2. Clicar em **"Nova Obrigação"**
3. Preencher:
   - **Título:** ex. "Envio do Relatório Anual de Tratamento de Dados à ANPD"
   - **Lei de Referência:** ex. "Lei 13.709/2018 (LGPD), Art. 38"
   - **Órgão Regulador:** ex. "ANPD"
   - **Periodicidade** e **próxima data de vencimento**
   - **Responsável** (consultor ou usuário da organização)
   - **Descrição** com instruções de cumprimento
4. A obrigação aparece na lista com o status e a data de vencimento
5. Filtrar por organização, status (pendente, em andamento, concluída, **atrasada** — automático) e órgão regulador
6. Ao cumprir: clicar em **"Concluir"** → o sistema registra a data de conclusão e cria automaticamente a próxima ocorrência (para periodicidades recorrentes)
7. Obrigações vencidas ficam em **vermelho** automaticamente — prioridade imediata

**Alertas visuais:**
- 🔴 Vermelho = atrasada (passou da data sem conclusão)
- 🟡 Amarelo = vence nos próximos 30 dias
- 🟢 Verde = concluída
- ⚪ Cinza = pendente, data distante

### 8.2 Dashboard ESG (`/consultor/esg`)

Gestão dos indicadores Ambientais, Sociais e de Governança (ESG) por pilar.

**Pilares:**
- 🌿 **Ambiental:** consumo de energia, emissões de CO₂, gestão de resíduos, uso de água, eficiência energética
- 🤝 **Social:** diversidade, treinamentos, acidentes de trabalho, benefícios, satisfação de colaboradores
- ⚖️ **Governança:** políticas implementadas, conflitos declarados, auditorias, conselhos, transparência

**Como usar:**
1. Selecionar a organização
2. Clicar em **"+ Indicador"**
3. Preencher:
   - **Pilar** (Ambiental / Social / Governança)
   - **Nome do indicador** (ex: "Consumo de energia mensal")
   - **Unidade** (ex: kWh, tCO₂, %, número)
   - **Meta** (valor objetivo)
   - **Valor atual** (valor registrado no período)
   - **Período de referência** (ex: "2026", "Q1 2026")
   - **Fonte** (opcional — onde o dado foi coletado)
4. O sistema calcula automaticamente:
   - **Score por pilar** (0–100) baseado na média de atingimento das metas
   - **Score ESG Geral** (média dos 3 pilares)
5. O **Radar ESG** exibe os 3 pilares graficamente — ideal para apresentações à diretoria
6. Atualizar os valores periodicamente para acompanhar a evolução

**Fórmula do score:** `score_pilar = média( min(valor_atual / meta, 1) × 100 )` para indicadores com meta definida.

### 8.3 Board Reporting (`/consultor/board`)

Geração de relatórios executivos consolidados para a diretoria ou conselho com link público de acesso.

**Como usar:**
1. Selecionar a organização
2. Clicar em **"Gerar Relatório Executivo"**
3. Definir: título do relatório e período de referência (ex: "Q1 2026")
4. O sistema cria automaticamente um **snapshot** dos dados atuais:
   - Total de riscos + quantos são críticos e altos
   - Total de denúncias + quantas estão abertas + tempo médio de resolução
   - Score ESG por pilar
   - KPIs de compliance do período
5. Um **link público** é gerado — válido por **30 dias**, sem necessidade de login
6. O link é copiado automaticamente para o clipboard
7. Compartilhar com diretores, conselheiros ou auditores externos
8. O snapshot fica salvo no histórico para comparação entre períodos

**Uso típico:** Gerar mensalmente ou trimestralmente antes das reuniões de conselho.

### 8.4 Audit Trail — Admin (`/admin/audit-trail`)

Log imutável de todas as ações realizadas no sistema. Disponível exclusivamente para Admins.

**Como usar:**
1. Acessar no menu lateral do Painel Admin → "Audit Trail"
2. **Filtros disponíveis:**
   - **Tabela:** buscar ações em uma tabela específica (ex: `documentos`, `politicas`)
   - **Ação:** INSERT / UPDATE / DELETE / LOGIN
   - **Período:** data de início e data de fim
3. A tabela exibe: data/hora, tabela afetada, tipo de ação, usuário, resumo das colunas alteradas
4. Colunas alteradas em UPDATEs são listadas automaticamente no resumo
5. Clicar em **"Exportar CSV"** para baixar o log completo filtrado

**Uso típico:** Investigar quem alterou um documento em uma data específica, rastrear ações suspeitas, preparar evidências para auditoria.

---

## 9. Painel do Administrador

Acesso: `/admin` e sub-rotas. Exclusivo para usuários com role `admin`.

### 9.1 Dashboard Admin (`/admin`)
- Total de organizações ativas, consultores, clientes e usuários
- Atividade recente do sistema (últimas ações)
- Alertas de saúde (integrações com falha, tarefas vencidas)

### 9.2 Organizações (`/admin/organizacoes`)
- Listar, criar, editar e desativar organizações clientes
- Campos: CNPJ, razão social, segmento, porte, plano (essencial/executivo/premium), consultor responsável, pasta Google Drive
- Ao criar: o sistema cria automaticamente o projeto e o tenant isolado

### 9.3 Usuários (`/admin/usuarios`)
- Listar todos os usuários com role, organização e status
- Convidar novo usuário (e-mail + role)
- Alterar role de usuário existente
- Ativar / desativar conta

### 9.4 Consultores (`/admin/consultores`)
- Pré-cadastrar consultores por e-mail
- Ao fazer signup, o e-mail pré-cadastrado recebe role `consultor` automaticamente
- Vincular consultor a organizações específicas

### 9.5 Documentos Admin (`/admin/documentos`)
- Visão global de todos os documentos do sistema por organização e status
- Aprovar/rejeitar documentos em lote

### 9.6 Catálogo de Documentos (`/admin/catalogo`)
- Definir quais documentos são obrigatórios por tipo de projeto
- Configurar prazos, responsáveis padrão e instruções de envio

### 9.7 Templates (`/admin/templates`)
- Biblioteca de templates de documentos com variáveis dinâmicas (`{{nome_empresa}}`, `{{cnpj}}`, etc.)
- Criar, editar e versionar templates
- A IA pode usar templates como base para geração de documentos

### 9.8 Relatórios / Histórico (`/admin/relatorios/historico`)
- Log completo de todos os relatórios mensais enviados
- Filtro por organização, período e destinatário
- Re-enviar relatórios se necessário

### 9.9 Integrações (`/admin/integracoes`)
- Configurar todas as integrações externas (OpenAI, Google, Resend, Twilio, Fireflies, Trello, ClickUp)
- Credenciais armazenadas criptografadas (AES-256-GCM) no banco
- Status de cada integração em tempo real (verde = ativa, vermelho = com erro)

### 9.10 Branding / White-label (`/admin/branding`)
- Personalizar por organização: logo, favicon, cores primárias (HSL), cor secundária, CSS customizado
- Cada cliente vê o sistema com a identidade visual configurada
- Preview em tempo real das mudanças

### 9.11 Logs do Sistema (`/admin/logs`)
- Monitoramento de erros de Edge Functions (IA, e-mail, integrações, Drive)
- 4 métricas: erros críticos não resolvidos, avisos, registros nas últimas 24h, total resolvidos
- Filtros: nível (erro/aviso/info), origem, status, período, busca textual
- Diagnóstico automático: cada erro é mapeado para "Causa provável + Como corrigir" (20+ padrões)
- Marcar como resolvido com nota de resolução para histórico

### 9.12 Audit Trail (`/admin/audit-trail`)
- Ver **Seção 8.4** para documentação completa.

### 9.13 Configurações (`/admin/configuracoes`)
- Dados da empresa administradora (Cavendish)
- Status de saúde de todos os serviços
- Configurações globais do sistema

---

## 10. Inteligência Artificial Integrada

### 10.1 Engine de IA (Edge Function `ai-generate`)

A IA do sistema suporta múltiplos provedores configuráveis via Integrações:
- **OpenAI GPT-4** (principal — configurar `OPENAI_API_KEY`)
- Timeout automático de 25s por chamada com `AbortController`
- Tipos válidos de geração: `codigo_etica`, `relatorio`, `ata`, `documento`, `analise`, `politica`, `chat`
- Todas as gerações são logadas na tabela `ai_generations` para auditoria

### 10.2 Geração de Código de Ética

**Pré-requisito:** Diagnóstico respondido pela organização.

1. Consultor acessa `/consultor/codigo-etica`
2. Seleciona a organização
3. Clica em "Gerar Código de Ética"
4. A IA lê as respostas do diagnóstico, o segmento e porte da empresa
5. Gera o documento personalizado em markdown em < 30s
6. Consultor revisa e edita no editor integrado
7. "Aprovar e Publicar" — o código fica disponível no portal do cliente

### 10.3 Geração de Ata de Reunião

1. Colar a transcrição completa da reunião (Fireflies, Teams, Meet, etc.)
2. Selecionar organização e tipo de reunião
3. "Gerar Ata com IA" — a IA identifica automaticamente:
   - Participantes mencionados
   - Decisões tomadas
   - Responsáveis por cada ação
   - Prazos definidos
4. A ata é estruturada em formato profissional (markdown)
5. Exportar PDF ou enviar para participantes
6. Ata é salva no repositório de documentos da organização

### 10.4 Relatórios Mensais com IA

A Edge Function `send-monthly-reports` (cron) gera e envia relatórios mensais automaticamente:
- Executa na virada de mês via cron job
- Coleta dados via RPC `get_project_stats(projeto_id)` para cada projeto ativo
- Gera o relatório em PDF via Edge Function + html2canvas
- Envia por e-mail (Resend) para o cliente e o consultor responsável
- Registra o envio em `relatorio_envios`

### 10.5 IntelliX AI — Chat Assistente

O chat no header usa o tipo `chat` da Edge Function `ai-generate`:
- Recebe o histórico completo da conversa (`messages` array)
- Contexto do usuário (nome, role, organização) é injetado no system prompt
- Responde em linguagem natural sobre o sistema, clientes e compliance
- Histórico preservado durante a sessão (reiniciado ao recarregar)

---

## 11. Integrações Externas

Todas configuradas via **Admin → Integrações** com credenciais criptografadas no banco.

### 11.1 OpenAI GPT-4
- **Uso:** Geração de Código de Ética, Atas, Relatórios, Políticas, Chat IntelliX AI
- **Secret:** `OPENAI_API_KEY`
- **Configurar em:** Admin → Integrações → OpenAI

### 11.2 Google Drive
- **Uso:** Armazenamento automático de documentos por cliente em estrutura de pastas padronizada
- **Estrutura de pastas por cliente:**
  ```
  📁 [Nome do Cliente]
    ├── 01 - Documentos Recebidos
    ├── 02 - Diagnóstico
    ├── 03 - Políticas e Procedimentos
    ├── 04 - Evidências de Treinamento
    ├── 05 - Atas de Reunião
    └── 06 - Relatórios de Progresso
  ```
- **Secret:** `GOOGLE_SERVICE_ACCOUNT` (JSON completo da Service Account)
- **Configurar em:** Admin → Integrações → Google Drive (informar ID da pasta raiz)

### 11.3 Google Calendar
- **Uso:** Criação de eventos de reunião com Google Meet automaticamente
- **Secret:** usa a mesma `GOOGLE_SERVICE_ACCOUNT`

### 11.4 Fireflies.ai
- **Uso:** Transcrição automática de reuniões → geração de ata via IA
- **Fluxo:** Reunião gravada pelo Fireflies → webhook para `/process-transcription?organizacao_id=X` → IA gera ata → ata salva em `documentos` e no Drive
- **Secret:** `FIREFLIES_API_KEY`, `TRANSCRIPTION_WEBHOOK_SECRET`

### 11.5 Resend (E-mail Transacional)
- **Uso:** Notificações de documento aprovado/rejeitado, convites, relatórios, alertas de prazo, lembretes de adesão
- **Secret:** `RESEND_API_KEY`
- **From:** `noreply@intellixai.com.br` (após verificação do domínio)

### 11.6 Twilio (WhatsApp / SMS)
- **Uso:** Notificações operacionais via WhatsApp Business — documento pendente, aprovado, rejeitado
- **Secrets:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### 11.7 Trello / ClickUp
- **Uso:** Sincronização bidirecional de tarefas com ferramentas de gestão de projetos
- **Segurança:** Webhook com verificação de `X-Webhook-Secret` → `WEBHOOK_SECRET`

---

## 12. Segurança e Governança de Dados

### 12.1 Multi-tenant com Row Level Security

Todas as 40+ tabelas têm RLS ativo. Políticas garantem:
- Usuários veem apenas dados da própria organização
- Consultores veem apenas organizações atribuídas a eles
- Admins têm acesso global via função `is_admin(auth.uid())`

**Nenhum dado de um tenant é acessível por outro** — mesmo usando a mesma anon key pública.

### 12.2 Credenciais Criptografadas

Todas as chaves de API e tokens de integração são armazenados na tabela `integrations_vault` criptografados com **AES-256-GCM**:
- Chave de criptografia: `INTEGRATIONS_ENCRYPTION_KEY` (secret Supabase, jamais exposta)
- Cada organização tem seu próprio vault isolado
- As credenciais nunca trafegam para o frontend

### 12.3 Security Headers (HTTP)

Configurados em `next.config.mjs` para todas as rotas:

| Header | Valor |
|--------|-------|
| `Content-Security-Policy` | Script-src, style-src, connect-src (Supabase + OpenAI), frame-ancestors 'none' |
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload |
| `X-Frame-Options` | DENY |
| `X-Content-Type-Options` | nosniff |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() |
| `X-Powered-By` | Removido (`poweredByHeader: false`) |

### 12.4 Audit Trail Imutável

A tabela `audit_logs` registra automaticamente via triggers:
- INSERT, UPDATE, DELETE em todas as tabelas principais
- Eventos de LOGIN/LOGOUT
- `old_data` e `new_data` em JSON para cada alteração
- `checksum` SHA-256 para detectar adulteração
- `timestamp`, `user_id`, `user_email`, `user_role`, `ip_address`, `organizacao_id`

### 12.5 Canal de Denúncias — Privacidade

- Denúncias são feitas sem autenticação em `/denuncia`
- O sistema gera um **protocolo único** + **código secreto** para acompanhamento
- O denunciante usa o protocolo em `/consulta-protocolo` para ver atualizações — sem revelar identidade
- O relato é armazenado sem associação com dados pessoais do denunciante

### 12.6 Evidências para Auditoria

O sistema preserva automaticamente:
- Histórico completo de versões de documentos (`documento_versoes`)
- Registro de adesão ao Código de Ética com data, hora e IP (`codigo_etica_adesoes`)
- Certificados de treinamento com data de emissão e nota (`treinamento_certificados`)
- Relatórios mensais enviados com destinatário e data (`relatorio_envios`)
- Todas as gerações de IA com input/output/tokens/modelo (`ai_generations`)
- Audit Trail de todas as ações (ver 12.4)

---

## 13. Fluxos Operacionais Passo a Passo

### Fluxo 1 — Onboarding de Novo Cliente

```
Admin: Cadastrar organização
  ↓
Admin: Vincular consultor responsável
  ↓
Admin: Configurar catálogo de documentos do projeto
  ↓
Consultor: Enviar convite de onboarding ao cliente
  ↓
Cliente: Fazer signup e acessar /meu-projeto/diagnostico
  ↓
Cliente: Responder o Diagnóstico de Maturidade completo
  ↓
Consultor: Revisar as respostas do diagnóstico
  ↓
Consultor: Gerar Código de Ética com IA (< 30s)
  ↓
Consultor: Revisar, ajustar e publicar o Código de Ética
  ↓
Consultor: Enviar para adesão de todos os colaboradores
  ↓
Clientes/Colaboradores: Ler e assinar o Código de Ética
  ↓
Consultor: Acompanhar % de adesão em Compliance → Políticas
  ↓
Consultor: Criar plano de ação no Kanban de Tarefas
```

### Fluxo 2 — Ciclo Mensal do Programa

```
Início do mês:
  ↓
Consultor: Verificar Dashboard → identificar pendências
  ↓
Consultor: Revisar Calendário Regulatório → obrigações do mês
  ↓
Consultor: Validar documentos enviados pelos clientes
  ↓
Consultor: Atualizar status das tarefas no Kanban
  ↓
Consultor: Agendar reunião mensal de compliance (Google Meet)
  ↓
Reunião: Fireflies grava → ata gerada automaticamente
  ↓
Consultor: Revisar e publicar a ata no repositório
  ↓
Final do mês:
  ↓
Consultor: Atualizar indicadores ESG
  ↓
Consultor: Gerar Relatório Mensal de Progresso (PDF)
  ↓
Consultor: Gerar Board Report para diretoria (link público 30 dias)
  ↓
Sistema (cron): Enviar relatório automaticamente por e-mail
```

### Fluxo 3 — Gestão de Denúncia

```
Denunciante: Acessar /denuncia (sem login)
  ↓
Denunciante: Preencher formulário com relato, categoria e evidências
  ↓
Sistema: Gerar protocolo único + código secreto
  ↓
Sistema: Notificar consultor responsável por e-mail
  ↓
Consultor: Acessar /consultor/denuncias → abrir a denúncia
  ↓
Consultor: Alterar status para "Em Análise"
  ↓
Consultor: Abrir Investigação → registrar notas, responsável, evidências
  ↓
Consultor: Conduzir investigação interna
  ↓
Consultor: Registrar resultado e marcar como "Concluída"
  ↓
Denunciante: Consultar status em /consulta-protocolo usando protocolo + segredo
```

### Fluxo 4 — Gestão de Riscos

```
Consultor: Compliance → Aba Riscos
  ↓
Consultor: "Novo Risco" → preencher título, categoria, probabilidade e impacto
  ↓
Sistema: Calcular score (P×I) e classificar nível
  ↓
Consultor: Adicionar ações de mitigação com responsável e prazo
  ↓
Responsável: Executar a ação de mitigação e atualizar status
  ↓
Consultor: Registrar Avaliação Periódica → justificar mudança de score
  ↓
Score baixo? → Risco "Aceito" → Encerrado
Score alto? → Adicionar novas ações de mitigação → Repetir ciclo
  ↓
Consultor: Incluir resumo de riscos no Board Report
```

### Fluxo 5 — Compliance LGPD

```
Consultor: Compliance → Aba LGPD → Sub-aba Inventário
  ↓
Consultor: "Novo Item" → mapear cada dado pessoal tratado
  ↓
(preencher: titular, base legal, finalidade, armazenamento, prazo de retenção)
  ↓
Receber solicitação de titular (DSR)?
  ↓
Consultor: Sub-aba Solicitações → "Nova Solicitação"
  ↓
Sistema: Calcula prazo de 15 dias automaticamente
  ↓
Consultor: Analisar a solicitação e tomar a ação (corrigir, excluir, portar dados, etc.)
  ↓
Consultor: Registrar resposta e marcar como "Concluída" antes do prazo
  ↓
(Prazo vencido sem resposta → campo vermelho → infração LGPD detectada)
```

---

## 14. Tour Interativo Guiado

O sistema inclui um tour interativo de **46 passos** dividido em 3 perfis, acessível pelo botão **(?)** no cabeçalho de qualquer página.

| Tour | Perfil | Passos | Tempo estimado |
|------|--------|--------|---------------|
| Painel Admin | Admin | 15 passos | ~10 min |
| Portal do Consultor | Consultor / Admin | 17 passos | ~12 min |
| Portal do Cliente | Cliente | 8 passos | ~5 min |

**Novos passos incluídos (v2.0):**
- 🛡️ Compliance — 7 abas GRC explicadas
- 📅 Calendário Regulatório
- 🌿 Dashboard ESG
- 📊 Board Reporting
- 🔍 Audit Trail

O tour pode ser pausado, retomado e reiniciado a qualquer momento. O progresso é salvo no `sessionStorage`.

---

## 15. Variáveis de Ambiente e Segredos

### Frontend (Vercel — Environment Variables)

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Chave anônima do Supabase |

### Edge Functions (Supabase Secrets)

| Segredo | Obrigatório | Descrição |
|---------|:-----------:|-----------|
| `OPENAI_API_KEY` | ✓ | Chave da API OpenAI (GPT-4) |
| `RESEND_API_KEY` | ✓ | Chave do serviço de e-mail Resend |
| `CRON_SECRET` | ✓ | Token para autorizar execução dos cron jobs |
| `INTEGRATIONS_ENCRYPTION_KEY` | ✓ | Chave AES-256-GCM para criptografar credenciais no vault |
| `TRANSCRIPTION_WEBHOOK_SECRET` | ✓ | Secret para verificar webhooks do Fireflies |
| `WEBHOOK_SECRET` | ✓ | Secret para verificar webhooks do Trello/ClickUp |
| `ALLOWED_ORIGIN` | Rec. | Origem permitida no CORS (ex: `https://sistema-gig.vercel.app`) |
| `TWILIO_ACCOUNT_SID` | Opcional | SID da conta Twilio |
| `TWILIO_AUTH_TOKEN` | Opcional | Auth Token Twilio |
| `TWILIO_PHONE_NUMBER` | Opcional | Número WhatsApp Business |
| `GOOGLE_SERVICE_ACCOUNT` | Opcional | JSON completo da Service Account Google |
| `FIREFLIES_API_KEY` | Opcional | Chave da API do Fireflies.ai |

**Configurar via:**
```bash
npx supabase secrets set --project-ref fenfgjqlsqzvxloeavdc \
  OPENAI_API_KEY=sk-xxx \
  RESEND_API_KEY=re_xxx \
  CRON_SECRET=$(openssl rand -hex 32) \
  INTEGRATIONS_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  TRANSCRIPTION_WEBHOOK_SECRET=$(openssl rand -hex 32) \
  WEBHOOK_SECRET=$(openssl rand -hex 32) \
  ALLOWED_ORIGIN=https://cavendish-gig.vercel.app
```

---

## 16. Troubleshooting

| Sintoma | Causa mais provável | Solução |
|---------|--------------------|---------|
| Não consigo acessar `/admin` | Usuário não tem role `admin` em `user_roles` | Executar SQL de promoção (ver Seção 17) |
| Menus novos mostram erro | `Select.Item` com `value=""` (Radix UI) | Já corrigido na v2.0 — fazer pull da branch |
| "Application error" ao navegar | Exceção não capturada no componente | ErrorBoundary captura e exibe UI de fallback com botão Recarregar |
| IA não gera documentos | `OPENAI_API_KEY` não configurada | Admin → Integrações → OpenAI → Configurar chave |
| E-mails não saem | `RESEND_API_KEY` não configurada | Admin → Integrações → Resend → Configurar chave |
| WhatsApp/SMS não envia | Twilio não configurado | Admin → Integrações → Twilio → Configurar credenciais |
| Cron não executa | Header `x-cron-secret` inválido | Verificar `CRON_SECRET` no Supabase secrets |
| Webhook Fireflies não funciona | `TRANSCRIPTION_WEBHOOK_SECRET` incorreto | Reconfigurar no Supabase secrets + Fireflies dashboard |
| Upload de documento falha | Bucket do Storage não configurado | Verificar bucket `documentos` no Supabase Storage com políticas corretas |
| Google Drive não sincroniza | Service Account sem permissão na pasta | Compartilhar pasta raiz do Drive com o e-mail da Service Account |
| Audit Trail mostra "Nenhum registro" | Query com filtro de data inválido | Limpar filtros e tentar novamente |
| Board Report link expirado | Link válido apenas 30 dias | Gerar novo snapshot no Board Reporting |
| Score ESG = 0 | Nenhum indicador com meta definida | Cadastrar indicadores com campo "Meta" preenchido |
| Consultor não vê organizações | Organização não vinculada ao consultor | Admin → Organizações → Editar → Consultor responsável |

---

## 17. Gestão de Acessos — Runbook

### Promover usuário a Admin (SQL direto)

```sql
-- 1. Localizar o usuário
SELECT id, email FROM public.profiles WHERE lower(email) = lower('email@exemplo.com');

-- 2. Adicionar role admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE lower(email) = lower('email@exemplo.com')
ON CONFLICT DO NOTHING;
```

### Promover via script npm

```bash
# Admin
npm run admin:promote

# Role específica
npm run admin:grant-role -- --email usuario@exemplo.com --role consultor
```

### Pré-cadastrar consultor (recomendado)

Via Admin → Consultores → informar o e-mail. Ao fazer signup, o usuário recebe automaticamente role `consultor`.

### Deploy das Edge Functions

```bash
# Deploy de todas as functions
npx supabase functions deploy --project-ref fenfgjqlsqzvxloeavdc

# Deploy de uma função específica
npx supabase functions deploy ai-generate --project-ref fenfgjqlsqzvxloeavdc
```

### Aplicar migrations no banco de produção

```bash
npx supabase db push --project-ref fenfgjqlsqzvxloeavdc
```

### Regenerar tipos TypeScript do banco

```bash
npx supabase gen types typescript --project-id fenfgjqlsqzvxloeavdc \
  > src/integrations/supabase/types.ts
```
Executar **sempre que uma nova migration for aplicada**.

### Rodar localmente

```bash
npm install          # instalar dependências
npm run dev          # iniciar servidor de desenvolvimento (porta 3000)
```

---

*Manual v2.0 — Sistema GIG Premium | IntelliX.AI × Cavendish Consultoria | 2026-03-10*
