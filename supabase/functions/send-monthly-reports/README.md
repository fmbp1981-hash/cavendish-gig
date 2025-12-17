# 📧 Edge Function: Envio Automático de Relatórios Mensais

## 📋 Descrição

Esta Edge Function envia automaticamente relatórios mensais por email para todas as organizações ativas no sistema. Executa todo dia 1 de cada mês às 08:00 (horário de Brasília).

## 🎯 Funcionalidades

- ✅ **Execução automática** via Cron Job (dia 1 de cada mês)
- ✅ **Busca métricas** do mês anterior para cada organização
- ✅ **Gera relatório HTML** responsivo e profissional
- ✅ **Envia via Resend** (serviço de email transacional)
- ✅ **Registra histórico** de todos os envios
- ✅ **Retry automático** em caso de falha (até 3 tentativas)
- ✅ **Logs detalhados** para debugging

## 📊 Métricas Incluídas no Relatório

- Total de documentos enviados
- Documentos aprovados vs pendentes
- Total de tarefas criadas
- Tarefas concluídas
- Progresso geral do projeto (%)

## 🚀 Como Configurar

### 1. Configurar Variáveis de Ambiente

No Supabase Dashboard → Edge Functions → Secrets, adicione:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

**Como obter a chave Resend:**
1. Acesse https://resend.com
2. Crie uma conta (gratuito até 100 emails/dia)
3. Vá em "API Keys"
4. Crie uma nova chave
5. Copie e adicione no Supabase

### 2. Deploy da Edge Function

```bash
# Fazer login no Supabase CLI
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Deploy da função
supabase functions deploy send-monthly-reports
```

### 3. Ativar Cron Job

No Supabase Dashboard:
1. Vá em **Edge Functions**
2. Selecione `send-monthly-reports`
3. Aba **Cron Jobs**
4. Clique em **Enable Cron**
5. A configuração do arquivo `cron.yaml` será aplicada automaticamente

## 🧪 Como Testar Manualmente

### Opção 1: Via cURL

```bash
curl -i --location --request POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/send-monthly-reports' \
  --header 'Authorization: Bearer SEU_ANON_KEY' \
  --header 'Content-Type: application/json'
```

### Opção 2: Via Supabase Dashboard

1. **Edge Functions** → `send-monthly-reports`
2. Clique em **Invoke Function**
3. Clique em **Send Request**
4. Veja os logs em tempo real

### Opção 3: Via código local

```typescript
const { data, error } = await supabase.functions.invoke(
  'send-monthly-reports',
  { body: {} }
);

console.log('Resposta:', data);
```

## 📝 Estrutura da Response

```json
{
  "message": "Processamento concluído",
  "total": 5,
  "enviados": 4,
  "falhas": 1
}
```

## 🗄️ Tabela de Histórico

Todos os envios são registrados em `relatorio_envios`:

```sql
SELECT
  id,
  organizacao_id,
  mes_referencia,
  ano_referencia,
  status,
  email_destinatario,
  enviado_em,
  tentativas
FROM relatorio_envios
ORDER BY created_at DESC;
```

### Status possíveis:
- `pending` - Aguardando envio
- `sending` - Em processo de envio
- `sent` - Enviado com sucesso
- `failed` - Falhou após 3 tentativas

## 🔍 Debugging

### Ver Logs em Tempo Real

```bash
# Via Supabase CLI
supabase functions logs send-monthly-reports --follow
```

### Ver Logs no Dashboard

1. **Edge Functions** → `send-monthly-reports`
2. Aba **Logs**
3. Filtrar por data/horário

### Problemas Comuns

**1. Email não enviado**
- ✅ Verificar se `RESEND_API_KEY` está configurada
- ✅ Verificar domínio verificado no Resend
- ✅ Checar limites de envio do Resend (100/dia no free tier)

**2. Função não executa no cron**
- ✅ Verificar se cron está ativado no dashboard
- ✅ Verificar sintaxe do `cron.yaml`
- ✅ Aguardar próximo ciclo (dia 1 do mês)

**3. Erro ao buscar organizações**
- ✅ Verificar se migration foi aplicada
- ✅ Verificar se há organizações ativas
- ✅ Verificar RLS policies

## 📅 Schedule do Cron

```yaml
schedule: "0 11 1 * *"
```

- **0** - Minuto 00
- **11** - Hora 11 UTC (08:00 BRT)
- **1** - Dia 1 do mês
- **\*** - Todo mês
- **\*** - Qualquer dia da semana

## 🔐 Segurança

- ✅ Usa `service_role` key para bypass RLS
- ✅ Validação de origem via Authorization header
- ✅ Rate limiting automático do Supabase
- ✅ Emails validados antes do envio

## 💰 Custos

### Supabase Edge Functions
- Gratuito até 500.000 invocações/mês
- $2 por 1M de invocações adicionais

### Resend
- Gratuito até 100 emails/dia (3.000/mês)
- $10/mês para 50.000 emails

**Estimativa:** Para 100 organizações = 100 emails/mês = **GRÁTIS** 🎉

## 🎨 Customizar Template HTML

Para customizar o email, edite a função `gerarRelatorioHTML()` em `index.ts`:

```typescript
function gerarRelatorioHTML(
  organizacaoNome: string,
  mes: number,
  ano: number,
  metricas: RelatorioMetricas
): string {
  // Adicione suas customizações aqui
  return `<html>...</html>`;
}
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs da Edge Function
2. Consultar tabela `relatorio_envios`
3. Testar invocação manual
4. Verificar documentação do Resend

## ✅ Checklist de Configuração

- [ ] Migration `20251215000000_relatorio_envios.sql` aplicada
- [ ] Edge Function deployed
- [ ] Variável `RESEND_API_KEY` configurada
- [ ] Cron Job ativado
- [ ] Domínio verificado no Resend
- [ ] Teste manual realizado com sucesso
- [ ] Organizações ativas têm email cadastrado

---

**🤖 Generated with Claude Code**
