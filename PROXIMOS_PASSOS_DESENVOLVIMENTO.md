# 🚀 Próximos Passos de Desenvolvimento - Cavendish GIG

**Última atualização:** 2025-12-13
**Status Atual:** MVP Completo (MUST HAVE + SHOULD HAVE = 100%)

---

## 📊 Visão Geral do Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: MVP                                    ✅ COMPLETO │
│ - Todas funcionalidades MUST HAVE                          │
│ - Todas funcionalidades SHOULD HAVE                        │
│ - Integrações principais funcionando                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: Melhorias e Otimizações          📍 VOCÊ ESTÁ AQUI │
│ - Experiência do usuário                                    │
│ - Analytics e insights                                      │
│ - Automações avançadas                                      │
│ - Performance e escalabilidade                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Recursos Avançados (COULD HAVE)      🔮 FUTURO     │
│ - White-label completo                                      │
│ - Features enterprise                                       │
│ - Inteligência artificial avançada                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 FASE 2: Melhorias e Otimizações (2-4 semanas)

### **2.1 Experiência do Usuário (UX)** 🎨

#### A. Visualização de Documentos Google Drive no Sistema
**Prioridade:** 🔴 Alta
**Esforço:** 3 dias
**Impacto:** Alto

**Objetivo:**
Permitir que usuários visualizem documentos do Google Drive diretamente no sistema, sem precisar abrir nova aba.

**Implementação:**
```typescript
// 1. Criar edge function para gerar links temporários de visualização
// supabase/functions/google-drive/index.ts
case "getViewLink":
  // Gerar link temporário com permissão de leitura
  result = await generateTemporaryViewLink(accessToken, fileId);
  break;

// 2. Criar componente de preview
// src/components/documentos/DocumentoPreview.tsx
<Dialog>
  <iframe
    src={`https://drive.google.com/file/d/${fileId}/preview`}
    className="w-full h-[600px]"
  />
</Dialog>

// 3. Integrar no RepositorioDocumentos
// Botão "Visualizar" ao lado de "Download"
```

**Benefícios:**
- ✅ Melhor experiência do usuário
- ✅ Menos cliques para acessar documentos
- ✅ Mantém usuário no sistema

---

#### B. Preview de PDF Embutido
**Prioridade:** 🔴 Alta
**Esforço:** 2 dias
**Impacto:** Médio-Alto

**Objetivo:**
Mostrar preview de PDFs (atas, relatórios, certificados) direto na interface.

**Implementação:**
```typescript
// Usar react-pdf ou pdf.js
import { Document, Page } from 'react-pdf';

<Document file={pdfUrl}>
  <Page pageNumber={1} />
</Document>
```

**Páginas afetadas:**
- `/consultor/atas` - Preview de atas
- `/consultor/relatorios` - Preview de relatórios
- `/meu-projeto/treinamentos/:id` - Preview de certificados
- `/meu-projeto/codigo-etica` - Preview do código

---

#### C. Sistema de Comentários e Feedback em Documentos
**Prioridade:** 🟡 Média
**Esforço:** 5 dias
**Impacto:** Alto

**Objetivo:**
Permitir que consultores e clientes comentem documentos, criando thread de discussão.

**Estrutura de banco:**
```sql
CREATE TABLE documento_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID REFERENCES documentos(id),
  user_id UUID REFERENCES auth.users(id),
  comentario TEXT NOT NULL,
  parent_id UUID REFERENCES documento_comentarios(id), -- Para respostas
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Features:**
- Thread de comentários por documento
- Notificações quando alguém responde
- Menções com @ (notifica usuário)
- Anexar imagens/arquivos no comentário

---

#### D. Workflow Visual de Progresso do Projeto
**Prioridade:** 🟡 Média
**Esforço:** 4 dias
**Impacto:** Alto

**Objetivo:**
Mostrar visualmente onde o cliente está no processo GIG (Diagnóstico → Implementação → Recorrência).

**Implementação:**
```typescript
// src/components/cliente/WorkflowProgress.tsx
const fases = [
  {
    id: 'diagnostico',
    titulo: 'Diagnóstico',
    etapas: ['Documentos', 'Questionário', 'Análise', 'Relatório'],
    progresso: 75 // %
  },
  {
    id: 'implementacao',
    titulo: 'Implementação',
    etapas: ['Código Ética', 'Políticas', 'Treinamentos', 'Canal Denúncias'],
    progresso: 40
  },
  {
    id: 'recorrencia',
    titulo: 'Recorrência',
    etapas: ['Reuniões Mensais', 'Atas', 'Indicadores', 'Melhorias'],
    progresso: 0
  }
];

// Mostrar como stepper com cards expansíveis
```

**Visual sugerido:**
```
[✅ Diagnóstico 75%] ─→ [⏳ Implementação 40%] ─→ [⚪ Recorrência 0%]
```

---

### **2.2 Analytics e Insights** 📊

#### E. Dashboards Analíticos Avançados
**Prioridade:** 🟡 Média
**Esforço:** 6 dias
**Impacto:** Alto

**Objetivo:**
Dashboards com gráficos ricos para consultores e admins analisarem performance.

**Métricas para Consultor:**
- Taxa de conversão onboarding → ativação
- Tempo médio de aprovação de documentos
- Clientes em risco de churn (sem atividade há X dias)
- NPS por cliente
- Receita recorrente (MRR)
- Distribuição de clientes por fase (Diagnóstico/Implementação/Recorrência)

**Métricas para Admin:**
- Total de gerações de IA (tokens consumidos)
- Custo por cliente (tokens + storage + emails)
- Performance de consultores (clientes ativos, satisfação)
- Uso de features por plano (heatmap)
- Crescimento de base (novos clientes/mês)

**Bibliotecas:**
- Recharts (já instalado)
- Tremor (dashboard library)
- Ou migrar para Chart.js

---

#### F. Exportação de Relatórios em PDF
**Prioridade:** 🔴 Alta
**Esforço:** 3 dias
**Impacto:** Alto

**Objetivo:**
Permitir download de relatórios mensais em PDF profissional.

**Implementação:**
```typescript
// Edge function usando Puppeteer
// supabase/functions/generate-pdf/index.ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(htmlContent);
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', bottom: '20mm' }
});
```

**Alternativa:**
- Usar jsPDF + html2canvas (client-side)
- Ou serviço como PDF.co

**Documentos para PDF:**
- Relatório Mensal de Governança
- Diagnóstico de Maturidade
- Matriz de Riscos
- Código de Ética
- Atas de Reunião
- Certificados de Treinamento (já implementado)

---

#### G. Envio Automático de Relatórios Mensais por Email
**Prioridade:** 🟡 Média
**Esforço:** 2 dias
**Impacto:** Médio

**Objetivo:**
No dia 1 de cada mês, enviar relatório do mês anterior automaticamente para sócios/diretores.

**Implementação:**
```sql
-- Cron job já existe, adicionar envio de email
SELECT cron.schedule(
  'send-monthly-reports',
  '0 9 1 * *', -- Todo dia 1 às 9:00
  $$
  SELECT net.http_post(
    url := 'https://[SUPABASE]/functions/v1/send-monthly-report-emails',
    body := '{}'::jsonb
  );
  $$
);
```

```typescript
// Nova edge function: send-monthly-report-emails
// 1. Buscar todas organizações ativas
// 2. Gerar PDF do relatório
// 3. Enviar email com anexo via Resend
```

---

### **2.3 Automações Avançadas** 🤖

#### H. Sincronização Bidirecional com Google Drive
**Prioridade:** 🟢 Baixa
**Esforço:** 7 dias
**Impacto:** Médio

**Objetivo:**
Se documento for adicionado manualmente no Google Drive, sincronizar para o sistema.

**Implementação:**
```typescript
// 1. Configurar webhook do Google Drive
// (Google Drive Push Notifications API)

// 2. Criar edge function para receber webhook
// supabase/functions/google-drive-webhook/index.ts

// 3. Quando arquivo novo detectado:
//    - Baixar metadados
//    - Criar registro em 'documentos'
//    - Notificar usuários relevantes
```

**Complexidade:**
- Requer configuração de webhook no Google Cloud
- Gerenciamento de duplicatas
- Conflitos de permissões

---

#### I. Biblioteca de Templates Editáveis
**Prioridade:** 🟡 Média
**Esforço:** 5 dias
**Impacto:** Alto

**Objetivo:**
Permitir que consultores criem e editem templates de documentos (políticas, procedimentos, contratos).

**Estrutura:**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  tipo VARCHAR(50), -- 'politica', 'procedimento', 'contrato'
  nome VARCHAR(255),
  conteudo TEXT, -- Markdown com variáveis {{nome_empresa}}
  variaveis JSONB, -- [{nome: "nome_empresa", tipo: "text", obrigatorio: true}]
  categoria VARCHAR(50),
  created_by UUID,
  is_publico BOOLEAN DEFAULT false
);
```

**Features:**
- Editor de markdown/rich text
- Variáveis dinâmicas ({{nome_empresa}}, {{cnpj}}, etc.)
- Geração de documento preenchido
- Versionamento de templates
- Compartilhamento entre consultores

**Exemplo de template:**
```markdown
# Política de Segurança da Informação

**Empresa:** {{nome_empresa}}
**CNPJ:** {{cnpj}}
**Vigência:** {{data_vigencia}}

## 1. Objetivo
Esta política estabelece diretrizes para proteção das informações de {{nome_empresa}}...
```

---

#### J. Histórico de Versões de Documentos
**Prioridade:** 🟡 Média
**Esforço:** 4 dias
**Impacto:** Médio

**Objetivo:**
Rastrear todas as versões de um documento e permitir rollback.

**Estrutura:**
```sql
CREATE TABLE documento_versoes (
  id UUID PRIMARY KEY,
  documento_id UUID REFERENCES documentos(id),
  versao INT,
  storage_path TEXT,
  uploaded_by UUID,
  changelog TEXT,
  created_at TIMESTAMPTZ
);

-- Trigger para criar versão ao fazer UPDATE em documentos
```

**UI:**
```typescript
// Botão "Ver histórico" no documento
<DocumentoHistorico>
  {versoes.map(v => (
    <VersionCard>
      <span>v{v.versao} - {formatDate(v.created_at)}</span>
      <span>{v.uploaded_by.nome}</span>
      <Button onClick={() => restore(v.id)}>Restaurar</Button>
    </VersionCard>
  ))}
</DocumentoHistorico>
```

---

### **2.4 Performance e Escalabilidade** ⚡

#### K. Otimização de Queries e Indexação
**Prioridade:** 🟡 Média
**Esforço:** 3 dias
**Impacto:** Alto

**Objetivo:**
Garantir que o sistema escale para centenas de clientes sem lentidão.

**Ações:**
1. **Criar índices estratégicos:**
```sql
-- Documentos por organização
CREATE INDEX idx_documentos_org ON documentos(organizacao_id);
CREATE INDEX idx_documentos_projeto ON documentos(projeto_id);

-- Tarefas por status e prazo
CREATE INDEX idx_tarefas_status_prazo ON tarefas(status, prazo);

-- Notificações não lidas
CREATE INDEX idx_notificacoes_unread ON notificacoes(user_id, lida) WHERE NOT lida;

-- Treinamentos ativos
CREATE INDEX idx_treinamentos_ativo ON treinamentos(ativo) WHERE ativo = true;
```

2. **Implementar paginação em todas as listas:**
```typescript
// useDocumentos com paginação
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['documentos', organizacaoId],
  queryFn: ({ pageParam = 0 }) =>
    fetchDocumentos(organizacaoId, pageParam, 20),
  getNextPageParam: (lastPage) => lastPage.nextCursor
});
```

3. **Lazy loading de componentes:**
```typescript
const ConsultorRelatorios = lazy(() => import('@/pages/consultor/ConsultorRelatorios'));
```

4. **Otimizar queries N+1:**
```sql
-- Antes (N+1):
SELECT * FROM documentos WHERE organizacao_id = '...';
-- Para cada documento: SELECT * FROM documentos_requeridos_status...

-- Depois (JOIN):
SELECT d.*, drs.status, drs.observacao
FROM documentos d
LEFT JOIN documentos_requeridos_status drs ON drs.documento_id = d.id
WHERE d.organizacao_id = '...';
```

---

#### L. Implementar Cache com React Query
**Prioridade:** 🟢 Baixa
**Esforço:** 2 dias
**Impacto:** Médio

**Objetivo:**
Reduzir chamadas desnecessárias ao banco usando cache inteligente.

```typescript
// Configurar tempos de stale personalizados
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    },
  },
});

// Cache mais longo para dados estáticos
useQuery({
  queryKey: ['treinamentos'],
  staleTime: 30 * 60 * 1000, // 30 minutos
  cacheTime: 60 * 60 * 1000, // 1 hora
});
```

---

#### M. Compressão de Imagens e Otimização de Assets
**Prioridade:** 🟢 Baixa
**Esforço:** 1 dia
**Impacto:** Baixo

**Implementação:**
```typescript
// 1. Comprimir imagens antes de upload
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
});

// 2. Usar WebP quando possível
// 3. Lazy load de imagens
<img loading="lazy" src={url} />
```

---

## 🔮 FASE 3: Recursos Avançados (COULD HAVE) (2-3 meses)

### **3.1 White-label Completo** 🎨

#### N. Customização de Marca e Subdomínio
**Prioridade:** 🟡 Média (para escalar negócio)
**Esforço:** 10 dias
**Impacto:** Muito Alto (permite revenda)

**Features:**
1. **Configuração de marca por tenant:**
```sql
CREATE TABLE tenant_branding (
  organizacao_id UUID PRIMARY KEY,
  logo_url TEXT,
  logo_dark_url TEXT,
  primary_color VARCHAR(7), -- #0B66C3
  secondary_color VARCHAR(7),
  subdomain VARCHAR(50) UNIQUE, -- acme.cavendishgig.com
  custom_domain VARCHAR(100), -- gig.acme.com
  email_from_name VARCHAR(100),
  email_from_address VARCHAR(100)
);
```

2. **Sistema de subdomínios:**
```typescript
// middleware.ts (Next.js)
export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host');
  const subdomain = hostname.split('.')[0];

  // Buscar tenant por subdomain
  const tenant = await getTenantBySubdomain(subdomain);

  // Inject tenant context
  req.tenant = tenant;
}
```

3. **Temas dinâmicos:**
```typescript
// Carregar cores do tenant
const { data: branding } = useTenantBranding();

<style>{`
  :root {
    --primary: ${branding.primary_color};
    --secondary: ${branding.secondary_color};
  }
`}</style>
```

**Benefício:**
- 🚀 Permite que consultores revendam o sistema com sua marca
- 💰 Novo modelo de receita (cobrança por white-label)

---

### **3.2 SSO Corporativo e Integrações Enterprise** 🔐

#### O. Single Sign-On (SSO) com SAML/OAuth2
**Prioridade:** 🟢 Baixa (só para grandes clientes)
**Esforço:** 8 dias
**Impacto:** Alto (para vendas enterprise)

**Implementação:**
- Integrar com Auth0, Okta ou similar
- Suporte a SAML 2.0
- Suporte a Azure AD / Google Workspace SSO

**Benefício:**
- Facilita onboarding de grandes empresas
- Segurança enterprise

---

### **3.3 IA Avançada e Automação Inteligente** 🤖

#### P. Assistente Conversacional Interno (Chatbot)
**Prioridade:** 🟡 Média
**Esforço:** 12 dias
**Impacto:** Muito Alto

**Objetivo:**
Chatbot que responde perguntas sobre políticas, busca documentos, auxilia no preenchimento de formulários.

**Features:**
- RAG (Retrieval Augmented Generation) sobre documentos do cliente
- Busca semântica com embeddings
- Respostas contextuais
- Integração com código de ética e políticas

**Stack:**
- OpenAI Embeddings (text-embedding-3-small)
- Supabase Vector (pgvector)
- LangChain para orquestração

```typescript
// Embeddings de documentos
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: documentContent
});

// Armazenar no Supabase
await supabase.from('document_embeddings').insert({
  documento_id,
  embedding: embedding.data[0].embedding
});

// Busca semântica
const results = await supabase.rpc('match_documents', {
  query_embedding: questionEmbedding,
  match_threshold: 0.78,
  match_count: 5
});
```

---

#### Q. Análise Preditiva de Risco
**Prioridade:** 🟢 Baixa
**Esforço:** 15 dias
**Impacto:** Alto

**Objetivo:**
Usar ML para prever riscos de compliance e sugerir ações preventivas.

**Dados de treinamento:**
- Histórico de denúncias
- Padrões de não conformidade
- Turnover de funcionários
- Atrasos em documentação
- Scores de diagnóstico

**Output:**
- Score de risco por área (Governança, Compliance, Gestão)
- Alertas proativos
- Recomendações de ações

---

### **3.4 Experiência Omnichannel** 📱

#### R. Aplicativo Mobile (React Native)
**Prioridade:** 🟢 Baixa
**Esforço:** 30+ dias
**Impacto:** Médio

**Features mínimas:**
- Login
- Notificações push
- Acesso a documentos
- Responder treinamentos
- Fazer denúncias

**Por que postergar:**
- PWA responsivo já funciona bem em mobile
- Custo-benefício baixo no MVP
- Requer manutenção de 3 codebases (Web + iOS + Android)

---

## 📅 Cronograma Sugerido (Próximos 3 meses)

### **Mês 1: UX e Analytics** (Fase 2.1 + 2.2)

**Semana 1-2:**
- ✅ Visualização de documentos Google Drive
- ✅ Preview de PDF embutido
- ✅ Exportação de relatórios em PDF

**Semana 3-4:**
- ✅ Dashboards analíticos avançados
- ✅ Workflow visual de progresso
- ✅ Sistema de comentários (início)

**Entregas:**
- Cliente pode ver documentos sem sair do sistema
- Relatórios em PDF profissionais
- Consultores têm insights de performance

---

### **Mês 2: Automações e Performance** (Fase 2.3 + 2.4)

**Semana 5-6:**
- ✅ Sistema de comentários (conclusão)
- ✅ Biblioteca de templates editáveis
- ✅ Histórico de versões de documentos

**Semana 7-8:**
- ✅ Otimização de queries e indexação
- ✅ Implementar cache estratégico
- ✅ Envio automático de relatórios mensais por email

**Entregas:**
- Colaboração em tempo real via comentários
- Templates reutilizáveis economizam tempo
- Sistema mais rápido e escalável

---

### **Mês 3: Recursos Avançados** (Fase 3 - início)

**Semana 9-10:**
- ✅ White-label: Customização de marca
- ✅ White-label: Sistema de subdomínios
- ✅ White-label: Temas dinâmicos

**Semana 11-12:**
- ✅ Assistente conversacional (RAG básico)
- ✅ Análise preditiva de risco (POC)
- ✅ Testes e documentação

**Entregas:**
- Consultores podem revender com sua marca
- IA auxilia usuários com dúvidas
- Sistema prediz riscos proativamente

---

## 🎯 Métricas de Sucesso

### **Fase 2 (Curto Prazo)**
- [ ] **Redução de 50%** no tempo de acesso a documentos
- [ ] **Aumento de 30%** no engajamento (sessões/usuário)
- [ ] **Redução de 40%** em tickets de suporte sobre "como fazer X"
- [ ] **Performance:** Todas páginas carregam em <2s
- [ ] **NPS:** Aumentar de X para Y

### **Fase 3 (Médio/Longo Prazo)**
- [ ] **3+ consultores** revendendo com white-label
- [ ] **Chatbot resolve 60%** das dúvidas sem intervenção humana
- [ ] **Score de risco prediz 70%** dos problemas com 30 dias de antecedência
- [ ] **Escalabilidade:** Suportar 500+ clientes simultâneos

---

## 💡 Recomendações de Priorização

### **Se o objetivo é AUMENTAR RETENÇÃO:**
1. Workflow visual de progresso (mostra valor)
2. Dashboards analíticos (insights acionáveis)
3. Envio automático de relatórios (touchpoint mensal)
4. Sistema de comentários (engajamento)

### **Se o objetivo é ESCALAR VENDAS:**
1. White-label completo (habilita revenda)
2. Exportação de relatórios em PDF (material de vendas)
3. Assistente conversacional (reduz fricção)
4. SSO corporativo (vende para enterprise)

### **Se o objetivo é REDUZIR CUSTOS:**
1. Otimização de queries (menos processamento)
2. Cache inteligente (menos chamadas ao banco)
3. Biblioteca de templates (consultores mais produtivos)
4. Chatbot (reduz suporte)

---

## 🚦 Quick Wins (Implementar AGORA)

Funcionalidades de **alto impacto** e **baixo esforço**:

1. **Preview de PDF embutido** (2 dias, impacto alto)
2. **Exportação de relatórios em PDF** (3 dias, impacto alto)
3. **Otimização de queries** (3 dias, impacto alto)
4. **Visualização do Google Drive** (3 dias, impacto alto)

**Total: ~11 dias de desenvolvimento para 4 melhorias significativas**

---

## ❓ Dúvidas para Definir Prioridade

Para ajudar a priorizar, responda:

1. **Qual é o objetivo principal nos próximos 3 meses?**
   - [ ] Aumentar retenção de clientes
   - [ ] Escalar vendas (novos clientes)
   - [ ] Reduzir custos operacionais
   - [ ] Preparar para enterprise

2. **Qual a maior dor dos usuários atuais?**
   - [ ] Dificuldade em encontrar/visualizar documentos
   - [ ] Falta de insights sobre progresso
   - [ ] Comunicação fragmentada (email vs sistema)
   - [ ] Interface pouco intuitiva

3. **Há demanda por white-label?**
   - [ ] Sim, já tenho consultores interessados
   - [ ] Não, foco é crescer base própria

4. **Orçamento disponível?**
   - [ ] 1 desenvolvedor full-time
   - [ ] 2+ desenvolvedores
   - [ ] Orçamento limitado (priorizar quick wins)

---

## 📞 Próximos Passos Imediatos

**Ação 1:** Definir prioridades com stakeholders
**Ação 2:** Escolher 3-5 features da Fase 2 para sprint
**Ação 3:** Criar issues/tasks no GitHub/Jira
**Ação 4:** Começar desenvolvimento! 🚀

---

**Documento criado por:** Claude Code
**Para mais informações:** Consulte `CONFIGURACAO_DEPLOY.md`
