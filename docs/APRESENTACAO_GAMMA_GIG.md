# Sistema GIG — Apresentação Institucional
### Formato: Gamma.app (prompt estruturado para geração automática de slides)

---

> **INSTRUÇÕES PARA USO NO GAMMA:**
> 1. Acesse [gamma.app](https://gamma.app) → "Create new" → "Generate" → "Presentation"
> 2. Cole o conteúdo da seção **PROMPT PARA O GAMMA** no campo de texto
> 3. No passo de tema visual, clique em **"Edit theme"** e configure conforme a seção **TEMA VISUAL** abaixo
> 4. Clique em "Generate" — os 18 slides são criados automaticamente
> 5. Após gerar, aplique os ajustes da seção **NOTAS DE PERSONALIZAÇÃO**

---

## TEMA VISUAL — Configurar no Gamma antes de gerar

> Esses valores refletem exatamente o design do Sistema GIG conforme o arquivo `SISTEMA_GIG_Apresentacao.html`.

### Paleta de cores (inserir em "Edit theme → Colors")

| Papel | Hex | Uso |
|-------|-----|-----|
| **Background** | `#0C2B3C` | Fundos escuros (capa, separadores de seção) |
| **Accent 1 (Primary)** | `#1A5B44` | Verde floresta — cor principal de destaque |
| **Accent 2 (Secondary)** | `#B8970D` | Dourado — CTAs, badges, sublinhados de título |
| **Surface** | `#F4F1EB` | Fundo creme dos slides de conteúdo |
| **Text** | `#1A1A1A` | Texto principal no fundo claro |
| **Text on dark** | `#FFFFFF` | Texto em fundos escuros/verde |
| **Muted** | `#9C9880` | Texto secundário, legendas |
| **Border** | `#E8E5DD` | Divisórias e bordas de card |

**Cores de suporte para cards temáticos:**
- Card verde claro: fundo `#EAF5F0`, borda `#B8DECE`
- Card dourado claro: fundo `#FDF8E1`, borda `#E8D56A`
- Card navy: fundo `#E8EEF3`, borda `#B0C4D4`
- Card escuro: fundo `#0C2B3C`, texto branco, título `#D4AF10`

### Tipografia

| Elemento | Fonte | Peso | Tamanho |
|----------|-------|------|---------|
| Títulos principais | **Inter** (ou Montserrat) | 800 (ExtraBold) | Grande |
| Subtítulos | Inter | 600 (SemiBold) | Médio |
| Corpo de texto | Inter (ou Open Sans) | 400 (Regular) | Normal |
| Legendas / labels | Inter | 300 (Light) | Pequeno |
| Badges / pills | Inter | 600 (SemiBold) | Extra small, UPPERCASE |

### Padrões de layout por tipo de slide

**Slides de CAPA:**
- Fundo: gradiente diagonal `navy #0C2B3C → #1A4460 → verde #1A5B44`
- Badge no topo: pill arredondado, fundo translúcido, texto dourado, letras maiúsculas com espaçamento
- Título: branco, peso 800, linha 1.1
- Subtítulo: branco 75% de opacidade, peso 300
- Tagline: pill dourado `#B8970D`, texto navy, peso 700
- Rodapé: metadados em branco 50% de opacidade

**Slides de SEÇÃO (separadores):**
- Fundo: gradiente `verde #1A5B44 → navy #0C2B3C`
- Número da seção: enorme (72px), branco 10% de opacidade, decorativo
- Título: branco, 700
- Barra de acento: 64px × 4px, dourado `#B8970D`, centralizada
- Descrição: branco 70% de opacidade, peso 300

**Slides de CONTEÚDO:**
- Fundo do slide: branco ou creme `#F4F1EB`
- Cabeçalho do slide: navy `#0C2B3C`, borda inferior 3px dourado `#B8970D`
- Título no cabeçalho: branco, 700
- Subtítulo no cabeçalho: branco 55% de opacidade
- Barra lateral esquerda decorativa: 5px, gradiente dourado → verde (do topo ao fundo)
- Corpo: padding 28px 40px

**Cards:**
- Fundo `#F8F8F6`, borda `#E8E5DD`, border-radius 10px, padding 16px
- Ícone/emoji: quadrado 36px, border-radius 8px, fundo verde `#1A5B44` (ou dourado), cor branca (ou navy)
- Título do card: 13px, peso 700
- Texto do card: 12px, cor `#555`

**Elementos de destaque (Highlight):**
- Fundo: gradiente `verde #1A5B44 → navy #0C2B3C`
- Texto: branco, peso 300, linha 1.6
- Palavras em destaque: dourado `#D4AF10`, peso 600
- Border-radius: 12px

**Tabelas comparativas:**
- Cabeçalho: navy `#0C2B3C`, texto branco, peso 600
- Linhas pares: fundo `#F8F8F6`
- Células de check (✅): verde escuro `#1A5B44`, peso 700
- Células vazias/traço: cinza claro `#CCCCCC`

**Steps / Fluxo numerado:**
- Círculos numerados: fundo verde `#1A5B44`, texto branco, 28px, bold
- Título do step: 600, cor navy
- Descrição do step: 12px, cor `#555`

**Flow pills (linha do tempo horizontal):**
- Item: fundo verde `#1A5B44`, texto branco, pill, 11.5px bold
- Item destaque: fundo dourado `#B8970D`, texto navy
- Seta entre itens: cinza `#9C9880`

**Badges:**
- Verde: fundo `#D4EDDA`, texto `#145A32`
- Dourado: fundo `#FEF3C7`, texto `#92400E`
- Navy: fundo `#DBEAFE`, texto `#1E3A5F`
- Vermelho: fundo `#FEE2E2`, texto `#7F1D1D`

**Numeração dos slides:**
- Posição: canto inferior direito
- 10px, peso 500, preto 25% de opacidade (claro) / branco 20% de opacidade (escuro)

---

## PROMPT PARA O GAMMA

```
Crie uma apresentação profissional e visualmente impactante com os 18 slides abaixo.

TEMA VISUAL OBRIGATÓRIO:
- Fundo escuro principal: azul-marinho #0C2B3C
- Cor primária de destaque: verde floresta #1A5B44
- Cor secundária de destaque: dourado #B8970D
- Fundo dos slides de conteúdo: creme #F4F1EB ou branco
- Texto claro: branco #FFFFFF
- Texto escuro: #1A1A1A

PADRÕES DE DESIGN:
- Slides de capa e seção: fundo gradiente navy→verde com título branco e badge dourado
- Slides de conteúdo: cabeçalho navy com borda inferior 3px dourado, corpo em branco/creme
- Barra lateral esquerda decorativa dourada→verde em todos os slides de conteúdo
- Cards com ícone quadrado em verde ou dourado
- Tabelas com cabeçalho navy e texto branco
- Destaques/quotes: gradiente verde→navy com texto branco e palavras-chave em dourado
- Fonte: Inter ou Montserrat (sem serifa, limpa)
- Ícones profissionais — não usar emojis nos slides finais
- Linguagem 100% simples e direta para executivos e gestores (zero termos técnicos)
- Numeração dos slides: canto inferior direito

Crie os slides exatamente nesta ordem e com este conteúdo:
```

---

## SLIDE 1 — CAPA

**Tipo:** Cover (gradiente navy→verde)
**Badge:** `INTELLIX.AI × CAVENDISH CONSULTORIA` (pill dourado, letras maiúsculas)
**Título:** Sistema GIG
**Subtítulo:** A solução completa para sua empresa ter um programa de Governança e Compliance que realmente funciona
**Tagline (pill dourado):** Governança · Integridade · Compliance
**Rodapé (3 colunas de stats):**
- **40+** Funcionalidades integradas
- **3** Planos disponíveis
- **100%** Baseado em IA

---

## SLIDE 2 — O PROBLEMA

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Sua empresa está exposta a riscos que podem ser evitados

**3 cards lado a lado (card vermelho/alerta):**

🚨 **Multas e Sanções**
Empresas sem programa de integridade podem ser multadas em até **20% do faturamento** pela Lei Anticorrupção — e até **R$ 50 milhões** por violações à LGPD.

📋 **Sem Processos Definidos**
Sem documentos organizados, sem canal de denúncias confiável e sem treinamentos registrados, a empresa fica vulnerável em qualquer auditoria ou fiscalização.

💼 **Perda de Negócios**
Grandes empresas e órgãos públicos exigem que seus fornecedores tenham programa de compliance ativo. Sem ele, sua empresa perde contratos.

**Destaque (highlight gradiente verde→navy):**
> *"Não ter compliance não é ausência de problema — é ter vários problemas que você ainda não descobriu."*

---

## SLIDE 3 — A SOLUÇÃO

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** O Sistema GIG resolve tudo isso
**Subtítulo:** Uma plataforma completa que cuida do seu programa de integridade do início ao fim — com inteligência artificial e automação

**Grid 2×2 de cards (fundo verde claro `#EAF5F0`):**

✅ **Organizado**
Todos os documentos, treinamentos e processos em um único lugar — com histórico completo de quem fez o quê e quando.

⚡ **Rápido**
Documentos que levavam dias agora ficam prontos em **segundos** com apoio de inteligência artificial.

🔒 **Seguro**
Cada empresa tem seus dados completamente isolados. Nenhuma informação vaza para terceiros — garantido por tecnologia bancária.

📊 **Visível**
Relatórios automáticos para a diretoria com os números que importam — sem precisar montar planilha.

---

## SLIDE 4 — PARA QUEM É

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Quem usa e como cada um se beneficia

**3 cards verticais (fundo alternado: verde claro, dourado claro, navy):**

🏢 **Cavendish Consultoria** *(Administrador)*
Controla toda a plataforma. Cadastra empresas clientes, define quais consultores atendem cada conta e acompanha tudo em tempo real — de um único painel.
**Badge verde:** *Atender 10× mais clientes sem contratar mais*

👨‍💼 **Consultores da Cavendish**
Gerenciam a carteira de clientes pelo Portal do Consultor. Criam documentos com IA, aprovam evidências e entregam relatórios executivos com poucos cliques.
**Badge dourado:** *O que levava 2 horas agora leva 5 minutos*

🏭 **Empresas Clientes (PMEs)**
Acessam o próprio portal personalizado. Respondem o diagnóstico, enviam documentos, fazem treinamentos e assinam o Código de Conduta — tudo online.
**Badge navy:** *Compliance sem burocracia, com progresso claro*

---

## SLIDE 5 — COMO FUNCIONA

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** O caminho do zero ao programa ativo — em passos simples

**Fluxo numerado vertical (steps com círculos verdes):**

**1 — Diagnóstico** *(Semana 1)*
A empresa responde um questionário online. O sistema analisa as respostas e mostra o que está bem e o que precisa melhorar — com recomendações claras e priorizadas.

**2 — Documentos com IA** *(Semana 1–2)*
O consultor clica em "Gerar Código de Conduta". A IA cria o documento personalizado em menos de 30 segundos. O consultor revisa e publica.

**3 — Assinatura Digital** *(Semana 2–3)*
O sistema envia automaticamente um e-mail para cada colaborador com o link para ler e assinar. O painel mostra em tempo real quem assinou e quem ainda não leu.

**4 — Treinamentos e Evidências** *(Semana 3–4)*
Os colaboradores realizam módulos de treinamento online e obtêm certificados digitais. Os documentos obrigatórios são enviados e validados.

**5 — Acompanhamento Contínuo** *(Todo mês)*
Reuniões com ata gerada por IA. Relatório mensal enviado por e-mail. Painel de indicadores atualizado em tempo real.

---

## SLIDE 6 — CANAL DE DENÚNCIAS

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Canal de Denúncias — Anônimo, Seguro e Rastreável

**Layout 2 colunas (card verde claro | card dourado claro):**

**Para quem denuncia:**
- Acesso público — não precisa criar conta ou login
- Totalmente anônimo — o sistema não registra quem enviou
- Recebe número de protocolo para acompanhar o andamento
- Consulta o status a qualquer hora pelo número do protocolo

**Para a empresa:**
- Todos os relatos chegam direto ao consultor responsável
- Fluxo completo: recebido → em análise → investigação → conclusão
- Registra todas as ações tomadas durante a investigação
- Cumpre as exigências da Lei Anticorrupção e do Decreto 11.129/2022

**Destaque (highlight gradiente verde→navy):**
> *Um canal de denúncias confiável aumenta a confiança dos colaboradores e **reduz perdas internas em até 40%**.*

---

## SLIDE 7 — GESTÃO DE RISCOS

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Identifique e controle os riscos antes que virem problemas
**Subtítulo:** O módulo de gestão de riscos ajuda a enxergar ameaças antes que causem prejuízo

**Grid 2 colunas:**

**Coluna esquerda — Matriz de riscos (cards coloridos):**
🟢 **Baixo risco** → Monitorar *(fundo verde claro)*
🟡 **Risco médio** → Criar plano de ação *(fundo dourado claro)*
🟠 **Risco alto** → Agir imediatamente *(fundo laranja claro)*
🔴 **Risco crítico** → Prioridade máxima *(fundo vermelho claro)*

**Coluna direita — Como funciona (steps numerados):**
1. Consultor cadastra os riscos da empresa
2. Define probabilidade e impacto
3. Sistema calcula automaticamente o nível de risco
4. Cria plano de ação com responsável e prazo
5. Avanço das ações acompanhado em tempo real
6. Relatórios de risco incluídos automaticamente no board report

---

## SLIDE 8 — PROTEÇÃO DE DADOS (LGPD)

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Esteja em conformidade com a LGPD sem complicação
**Subtítulo:** A lei exige que toda empresa saiba quais dados pessoais coleta e como os usa. O GIG organiza isso de forma simples.

**3 cards horizontais (ícone verde 36px + título + texto):**

📋 **Mapeamento de Dados**
Liste quais informações pessoais sua empresa guarda (nome, CPF, e-mail, dados bancários…) e para que usa cada uma. O sistema organiza tudo e gera o inventário exigido pelos auditores.

📩 **Solicitações de Clientes**
Quando um cliente pede para ver, corrigir ou apagar seus dados, o sistema abre automaticamente um prazo de **15 dias** para responder. Alertas vermelhos aparecem se o prazo estiver próximo de vencer.

🛡️ **Evidência de Conformidade**
Todo o histórico fica registrado: quem solicitou, o que foi pedido, o que foi feito e quando. Prova documentada de que a empresa respeita a lei — em caso de fiscalização da ANPD.

---

## SLIDE 9 — INTELIGÊNCIA ARTIFICIAL

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Tecnologia de ponta a serviço da sua empresa
**Subtítulo:** O mesmo tipo de IA usado por grandes corporações — agora disponível para PMEs

**Grid 2×2 de cards (fundo `#EAF5F0`, ícone verde):**

✍️ **Criação de Documentos em Segundos**
Código de Conduta, políticas internas, relatórios mensais — criados automaticamente com base nas características da sua empresa. Sem copiar de modelos genéricos.

📝 **Atas de Reunião Automáticas**
Grave a reunião com qualquer ferramenta. O sistema transcreve e a IA organiza: o que foi decidido, quem ficou responsável, quais os prazos.

💬 **Assistente IntelliX AI**
Um assistente de IA disponível em todas as páginas do sistema. Responde dúvidas, busca informações e ajuda o consultor a trabalhar mais rápido.

📊 **Relatórios que se Escrevem Sozinhos**
Todo mês, o sistema calcula o progresso do programa e gera o relatório completo em PDF — pronto para enviar à diretoria.

---

## SLIDE 10 — BOARD REPORT

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** A diretoria merece ver números, não desculpas
**Subtítulo:** O Board Report entrega um resumo executivo completo para sócios e diretores — sem login, em qualquer dispositivo

**Coluna esquerda — Fluxo (steps numerados com círculos verdes):**
1. Consultor gera o relatório executivo com um clique
2. O sistema consolida: riscos do período, denúncias, indicadores ESG e avanço do programa
3. Um **link seguro** é criado — válido por 30 dias
4. Link compartilhado por WhatsApp ou e-mail
5. Diretores abrem no celular ou computador, sem login ou senha

**Coluna direita — O que aparece no relatório (cards com badges coloridos):**
- 🔴 **Badge vermelho:** Riscos críticos que precisam de atenção
- 🟢 **Badge verde:** Pontos de progresso e conquistas do período
- 📈 **Badge navy:** Evolução do programa mês a mês
- 🌿 **Badge verde:** Indicadores ESG de sustentabilidade

---

## SLIDE 11 — ESG

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Sustentabilidade não é modinha — é exigência de mercado
**Subtítulo:** O Painel ESG ajuda a medir e mostrar o compromisso da empresa com o meio ambiente, as pessoas e a boa governança

**3 cards grandes com ícone e score:**

🌿 **Ambiental**
Consumo de energia, emissões, gestão de resíduos e uso de água. Mostre aos clientes e fornecedores que sua empresa cuida do planeta.
*(fundo verde claro `#EAF5F0`)*

🤝 **Social**
Diversidade, treinamentos realizados, satisfação dos colaboradores e segurança no trabalho. Dados que fazem diferença em certificações.
*(fundo creme `#FDF8E1`)*

⚖️ **Governança**
Políticas ativas, conflitos de interesse declarados, auditorias realizadas. Transparência que gera confiança.
*(fundo navy claro `#E8EEF3`)*

**Destaque central (highlight verde→navy):**
O sistema calcula automaticamente uma nota de **0 a 100** com base nos indicadores cadastrados — quanto mais próximo de 100, melhor o desempenho da empresa.

---

## SLIDE 12 — CALENDÁRIO REGULATÓRIO

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Nunca mais perca um prazo legal
**Subtítulo:** O Calendário Regulatório avisa com antecedência sobre todas as obrigações legais da empresa

**Coluna esquerda — Exemplos de obrigações rastreadas:**
- Relatório Anual à ANPD (Lei de Proteção de Dados)
- Declarações de Conflito de Interesses (anual)
- Renovação de certificações (ISO, ABNT, etc.)
- Reuniões obrigatórias de conselho (trimestral)
- Auditorias internas programadas
- Obrigações trabalhistas e tributárias com prazo fixo

**Coluna direita — Sistema de alertas (3 cards coloridos):**
🟢 **Prazo distante** → Lembrete programado *(card verde claro)*
🟡 **Menos de 30 dias** → Alerta de atenção *(card dourado claro)*
🔴 **Prazo vencido** → Alerta urgente *(card vermelho claro)*

**Rodapé do slide:**
Ao cumprir uma obrigação, o sistema registra a data de conclusão e **cria automaticamente a próxima** para o ciclo seguinte.

---

## SLIDE 13 — PLANOS

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Escolha o plano ideal para o estágio da sua empresa

**3 colunas de planos (card branco | card branco | card navy escuro com borda dourada):**

🥉 **Essencial** *(card branco padrão)*
*Para empresas que estão começando*
- ✅ Diagnóstico de maturidade
- ✅ Canal de denúncias anônimo
- ✅ Gestão e validação de documentos
- ✅ Treinamentos com certificado
- ✅ Código de Conduta com IA
- ✅ Painel de indicadores

🥈 **Executivo** *(card verde claro, badge dourado "Popular")*
*Para empresas que querem avançar*
Tudo do Essencial, mais:
- ✅ Relatórios mensais em PDF
- ✅ Atas de reunião geradas por IA
- ✅ Agendamento com Google Meet automático

🥇 **Premium** *(card navy escuro, título dourado, badge "Mais Completo")*
*Para compliance completo e visibilidade executiva*
Tudo do Executivo, mais:
- ✅ Gestão de Políticas Corporativas
- ✅ Controle de Conflito de Interesses
- ✅ Conformidade LGPD completa
- ✅ Gestão de Riscos com matriz 5×5
- ✅ Due Diligence de Fornecedores
- ✅ Calendário Regulatório
- ✅ Painel ESG completo
- ✅ Board Report para a diretoria
- ✅ Branding personalizado (white-label)

---

## SLIDE 14 — SEGURANÇA

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Seus dados estão mais seguros do que em qualquer planilha

**Grid 2×2 de cards (fundo verde claro ou navy claro, ícone grande):**

🏰 **Dados Completamente Isolados**
Cada empresa tem seu ambiente totalmente separado. É como se cada cliente tivesse sua própria "caixa-forte" — ninguém de fora consegue ver o que está dentro.

🔑 **Chaves Protegidas**
Todas as senhas e códigos de acesso são guardados com criptografia de nível militar — o mesmo padrão usado por bancos.

📋 **Histórico de Tudo**
Toda ação é registrada com data, hora e usuário: quem aprovou, quem alterou, quem acessou. Impossível adulterar o histórico.

🛡️ **Proteções Ativas**
Múltiplas camadas de proteção contra ataques e invasões — atualizadas continuamente seguindo os mais altos padrões de segurança.

---

## SLIDE 15 — RESULTADOS ESPERADOS

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** O que muda depois de 90 dias com o Sistema GIG

**Timeline horizontal com 3 marcos (flow pills verdes com seta):**

**Mês 1** *(pill verde)*
- Diagnóstico concluído — sabe exatamente onde a empresa está
- Código de Conduta publicado e distribuído para todos
- Canal de denúncias ativo e funcionando
- Primeiros treinamentos concluídos

**Mês 2** *(pill verde, destaque dourado)*
- 80%+ dos colaboradores assinaram o Código de Conduta
- Documentos de compliance organizados e validados
- Políticas corporativas publicadas (anticorrupção, LGPD, etc.)
- Mapeamento de dados pessoais (LGPD) concluído

**Mês 3** *(pill dourado — conquista final)*
- Primeiro relatório de progresso entregue à diretoria
- Riscos mapeados com plano de ação em andamento
- Fornecedores avaliados com Due Diligence
- Empresa pronta para auditorias e fiscalizações

**Destaque (highlight verde→navy):**
Uma empresa com programa de compliance **documentado, auditável e reconhecido** — pronta para crescer com segurança.

---

## SLIDE 16 — POR QUE O GIG

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** A diferença que faz toda a diferença

**Tabela comparativa (cabeçalho navy, checkmarks verdes, X vermelhos):**

| | Sem o GIG | Com o GIG |
|---|---|---|
| Criar um Código de Conduta | 2 a 5 dias | **Menos de 1 hora** ✅ |
| Controlar adesão dos colaboradores | Planilha manual | **Automático em tempo real** ✅ |
| Relatório para a diretoria | Semanas de trabalho | **1 clique** ✅ |
| Evidências para auditoria | Espalhadas em e-mails | **Centralizadas e rastreáveis** ✅ |
| Canal de denúncias | Caixa de e-mail não-segura | **Portal anônimo com protocolo** ✅ |
| Conformidade LGPD | Desconhecida | **Inventário completo** ✅ |
| Gestão de riscos | Não existe | **Matriz 5×5 automatizada** ✅ |

---

## SLIDE 17 — PARCERIA

**Tipo:** Conteúdo (cabeçalho navy + borda dourada)
**Título:** Uma parceria feita para transformar o compliance no Brasil

**Layout 2 colunas (card verde claro | card dourado claro) + highlight central:**

**IntelliX.AI — Tecnologia** *(card verde claro, badge "Desenvolvimento")*
Empresa de desenvolvimento de soluções de inteligência artificial. Responsável pela criação, manutenção e evolução contínua da plataforma GIG — aplicando as mais avançadas tecnologias de IA disponíveis no mercado.

**Cavendish Consultoria — Expertise** *(card dourado claro, badge "Consultoria")*
Consultoria especializada em Governança, Integridade e Compliance para PMEs. Com vasta experiência no mercado, traz o conhecimento prático que guia cada funcionalidade do sistema.

**Destaque central (highlight verde→navy):**
A tecnologia da IntelliX.AI com a expertise da Cavendish = **a solução de compliance mais completa, acessível e prática para PMEs brasileiras.**

---

## SLIDE 18 — PRÓXIMOS PASSOS (ENCERRAMENTO)

**Tipo:** Cover/Capa (gradiente navy→verde, visual da capa)
**Título:** Comece hoje mesmo

**3 steps numerados (círculos dourados grandes sobre fundo escuro):**

**1️⃣ Agende uma demonstração**
Veja o sistema funcionando com dados reais da sua empresa.
Sem compromisso, sem burocracia.
📧 *Entre em contato com a Cavendish Consultoria*

**2️⃣ Diagnóstico gratuito**
Responda o questionário de diagnóstico e descubra em 15 minutos em que nível de maturidade sua empresa está — completamente grátis.

**3️⃣ Inicie o programa**
Em até 30 dias, sua empresa tem um programa de compliance estruturado, documentado e funcionando — com apoio total da equipe Cavendish.

**Destaque final (pill dourado, texto navy):**
> *"Compliance não é sobre seguir regras. É sobre construir uma empresa em que as pessoas confiam — e que dura."*

**Rodapé:**
**Cavendish Consultoria Empresarial** — Powered by **IntelliX.AI**

---

## NOTAS DE PERSONALIZAÇÃO (após gerar no Gamma)

1. **Capa e slide 18:** Inserir a logo da Cavendish no canto superior esquerdo + logo IntelliX.AI no canto inferior direito
2. **Barra lateral decorativa:** Em todos os slides de conteúdo, adicionar manualmente uma barra fina (5px) na borda esquerda com gradiente dourado→verde se o Gamma não aplicar automaticamente
3. **Slide 13 (Planos):** O card Premium deve ter borda 2px dourada `#B8970D` e badge "Mais Completo" em pill dourado no topo — aplicar destaque manual se necessário
4. **Slide 15 (Resultados):** Usar linha do tempo visual horizontal com checkmarks verdes progressivos
5. **Slide 16 (Tabela):** Células "Com o GIG" em verde `#1A5B44` e negrito; células "Sem o GIG" em cinza
6. **Slide final:** Adicionar QR Code linkando para agendamento de demonstração com a Cavendish
7. **Ícones:** Substituir emojis por ícones vetoriais profissionais (Heroicons, Phosphor ou Lucide) — estilo `outline`, cor branca em fundo verde/navy ou verde em fundo claro
8. **Animações:** Entrada dos cards em `fade-up` suave; sem animações exageradas
9. **Fonte alternativa:** Se Inter não estiver disponível no Gamma, usar Montserrat (títulos) + DM Sans (corpo)
10. **Verificação final:** Conferir se todas as menções a "IntelliX.AI" aparecem com o ponto no meio (não "IntelliX AI")
