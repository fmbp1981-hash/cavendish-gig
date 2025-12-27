import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  tipo: "codigo_etica" | "analise_documento" | "gerar_ata" | "chat" | "sumarizar_documento" | "detectar_riscos" | "gerar_contrato";
  input_data: Record<string, unknown>;
  projeto_id?: string;
  organizacao_id?: string;
  stream?: boolean;
}

interface AIProviderConfig {
  provider: "gemini" | "openai" | "claude" | "lovable";
  apiKey: string;
  model: string;
  baseUrl: string;
}

// Get AI provider configuration
async function getAIConfig(supabaseService: any): Promise<AIProviderConfig> {
  // Try to get configured provider from system_settings
  const { data: settings } = await supabaseService
    .from("system_settings")
    .select("key, value")
    .in("key", ["ai_provider", "ai_configured"]);

  const settingsMap: Record<string, string> = {};
  (settings || []).forEach((row: any) => {
    settingsMap[row.key] = row.value;
  });

  // If custom provider configured, try to load from vault
  if (settingsMap.ai_configured === "true" && settingsMap.ai_provider) {
    const { data: vaultData } = await supabaseService
      .from("integration_vault")
      .select("secrets, config")
      .eq("provider", "ai-provider")
      .eq("scope", "system")
      .single();

    if (vaultData?.secrets) {
      const secrets = vaultData.secrets as Record<string, string>;
      const config = vaultData.config as Record<string, string>;

      switch (config?.provider || settingsMap.ai_provider) {
        case "gemini":
          return {
            provider: "gemini",
            apiKey: secrets.GEMINI_API_KEY || "",
            model: "gemini-1.5-flash",
            baseUrl: "https://generativelanguage.googleapis.com/v1beta"
          };
        case "openai":
          return {
            provider: "openai",
            apiKey: secrets.OPENAI_API_KEY || "",
            model: "gpt-4o-mini",
            baseUrl: "https://api.openai.com/v1"
          };
        case "claude":
          return {
            provider: "claude",
            apiKey: secrets.ANTHROPIC_API_KEY || "",
            model: "claude-3-5-sonnet-20241022",
            baseUrl: "https://api.anthropic.com/v1"
          };
      }
    }
  }

  // Default: Use Lovable AI Gateway
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("Nenhum provedor de IA configurado. Configure em Admin → Integrações.");
  }

  return {
    provider: "lovable",
    apiKey: LOVABLE_API_KEY,
    model: "google/gemini-2.5-flash",
    baseUrl: "https://ai.gateway.lovable.dev/v1"
  };
}

// Call AI based on provider
async function callAI(config: AIProviderConfig, systemPrompt: string, userPrompt: string): Promise<{ text: string; tokens: number }> {
  let response: Response;

  if (config.provider === "gemini") {
    // Google Gemini API
    response = await fetch(`${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini error:", error);
      throw new Error(`Erro Gemini: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    return { text, tokens };

  } else if (config.provider === "openai" || config.provider === "lovable") {
    // OpenAI-compatible API (includes Lovable Gateway)
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);

      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos de IA esgotados.");
      }
      throw new Error(`Erro OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const tokens = data.usage?.total_tokens || 0;
    return { text, tokens };

  } else if (config.provider === "claude") {
    // Anthropic Claude API
    response = await fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude error:", error);
      throw new Error(`Erro Claude: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    return { text, tokens };
  }

  throw new Error("Provedor de IA não suportado");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } }
    });

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI configuration
    const aiConfig = await getAIConfig(supabaseService);
    console.log(`Using AI provider: ${aiConfig.provider} (${aiConfig.model})`);

    const { tipo, input_data, projeto_id, organizacao_id, stream = false }: AIRequest = await req.json();

    // Construir prompt baseado no tipo
    let systemPrompt = "";
    let userPrompt = "";

    switch (tipo) {
      case "codigo_etica":
        systemPrompt = `Você é um especialista em governança corporativa e compliance. 
Gere um Código de Ética profissional e completo para uma empresa, seguindo as melhores práticas de mercado.
O código deve incluir: Introdução, Valores e Princípios, Conduta Profissional, Conflitos de Interesse, 
Relacionamento com Stakeholders, Confidencialidade, Canais de Denúncia, e Disposições Finais.
Formate o documento em Markdown com seções claras.`;
        userPrompt = `Gere um Código de Ética para a empresa "${input_data.nome_empresa || "Empresa"}".
Setor: ${input_data.setor || "Geral"}
Porte: ${input_data.porte || "Médio"}
Valores principais: ${input_data.valores || "Ética, Transparência, Respeito"}`;
        break;

      case "analise_documento":
        systemPrompt = `Você é um analista de documentos especializado em compliance e governança.
Analise o documento fornecido e forneça uma avaliação estruturada com:
1. Resumo do documento
2. Pontos positivos
3. Pontos de atenção ou melhorias necessárias
4. Recomendação: APROVAR, APROVAR COM RESSALVAS, ou REJEITAR
5. Justificativa da recomendação`;
        userPrompt = `Analise o seguinte documento:
Tipo: ${input_data.tipo_documento || "Documento"}
Nome: ${input_data.nome_documento || "Sem nome"}
Conteúdo/Descrição: ${input_data.conteudo || input_data.descricao || "Não disponível"}`;
        break;

      case "gerar_ata":
        systemPrompt = `Você é um secretário executivo especializado em documentação corporativa.
Gere uma ata de reunião profissional e estruturada com base nas informações fornecidas.
A ata deve incluir: Data, Participantes, Pauta, Discussões, Deliberações, Encaminhamentos e Encerramento.
Formate em Markdown.`;
        userPrompt = `Gere uma ata de reunião com as seguintes informações:
Data: ${input_data.data || new Date().toLocaleDateString("pt-BR")}
Participantes: ${input_data.participantes || "A definir"}
Pauta: ${input_data.pauta || "Reunião geral"}
Notas/Discussões: ${input_data.notas || "Discussão dos temas da pauta"}`;
        break;

      case "sumarizar_documento":
        systemPrompt = `Você é um especialista em análise documental e governança corporativa.
Sua tarefa é criar um resumo executivo claro e objetivo do documento fornecido.
O resumo deve incluir:
1. **Objetivo do Documento:** Qual é o propósito principal
2. **Pontos Principais:** Os 3-5 pontos mais importantes
3. **Implicações:** O que isso significa para a organização
4. **Ações Requeridas:** Se houver ações necessárias
Formate em Markdown de forma concisa e profissional.`;
        userPrompt = `Crie um resumo executivo do seguinte documento:
Tipo: ${input_data.tipo_documento || "Documento"}
Nome: ${input_data.nome_documento || "Sem nome"}
Conteúdo: ${input_data.conteudo || input_data.texto || "Não disponível"}`;
        break;

      case "detectar_riscos":
        systemPrompt = `Você é um especialista em compliance, gestão de riscos e governança corporativa.
Analise o documento/situação fornecida e identifique potenciais riscos.
Sua análise deve incluir:
1. **Riscos Identificados:** Lista de riscos encontrados
2. **Classificação:** Para cada risco, classifique como ALTO, MÉDIO ou BAIXO
3. **Impacto Potencial:** Descrição do impacto caso o risco se materialize
4. **Probabilidade:** Estimativa de probabilidade de ocorrência
5. **Recomendações de Mitigação:** Ações sugeridas para cada risco
6. **Matriz de Risco:** Resumo visual em formato tabela

Formate em Markdown estruturado.`;
        userPrompt = `Analise os seguintes dados e identifique riscos de compliance e governança:
Contexto: ${input_data.contexto || "Análise geral"}
Área: ${input_data.area || "Governança Corporativa"}
Dados/Documento: ${input_data.conteudo || input_data.dados || input_data.descricao || "Não disponível"}
Observações adicionais: ${input_data.observacoes || "Nenhuma"}`;
        break;

      case "gerar_contrato":
        systemPrompt = `Você é um especialista em contratos corporativos da CCE – Consultoria Corporativa Especializada.
Gere um contrato de prestação de serviços de consultoria em Governança Corporativa, Compliance e Gestão Estratégica, seguindo EXATAMENTE o modelo oficial da CCE.

O contrato DEVE seguir esta estrutura:

# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA EM GOVERNANÇA CORPORATIVA, COMPLIANCE E GESTÃO ESTRATÉGICA

**CONTRATADA:** CCE – Consultoria Corporativa Especializada, pessoa jurídica de direito privado.

**CONTRATANTE:** [Preencher com dados do cliente]

## 1. OBJETO DO CONTRATO
- Prestação de serviços especializados de Gestão Integrada de Governança (GIG)
- Metodologia proprietária GIG

## 2. ESCOPO DOS SERVIÇOS
### 2.1 Fase 1 – Diagnóstico Inicial (15 a 30 dias)
### 2.2 Fase 2 – Execução do Programa GIG (Assinatura Mensal)
- Módulo 1: Governança Corporativa
- Módulo 2: Compliance e Integridade
- Módulo 3: Gestão Estratégica Recorrente
### 2.3 Fase 3 – Monitoramento e Evolução Contínua

## 3. PRAZO E VIGÊNCIA
- Vigência mínima de 03, 06 ou 12 meses conforme plano

## 4. VALOR E CONDIÇÕES DE PAGAMENTO
### 4.1 Diagnóstico Inicial
- Pequenas empresas: R$ 4.900,00
- Médias empresas: R$ 8.900,00
- Grandes empresas: R$ 12.900,00

### 4.2 Plano Mensal (Assinatura GIG)
- GIG Essencial: a partir de R$ 4.500
- GIG Executivo: a partir de R$ 8.500
- GIG Premium: a partir de R$ 15.000

## 5. OBRIGAÇÕES DA CONTRATADA
## 6. OBRIGAÇÕES DA CONTRATANTE
## 7. CONFIDENCIALIDADE
## 8. RESCISÃO
## 9. LIMITAÇÃO DE RESPONSABILIDADE
## 10. FORO
## 11. DISPOSIÇÕES FINAIS

Preencha os campos com os dados do cliente fornecidos. Mantenha linguagem jurídica profissional.
Formate em Markdown.`;
        userPrompt = `Gere o contrato oficial CCE com os seguintes dados:

**DADOS DO CONTRATANTE:**
- Razão Social: ${input_data.nome_cliente || "[RAZÃO SOCIAL DO CLIENTE]"}
- CNPJ: ${input_data.cnpj || "[●]"}
- Endereço: ${input_data.endereco || "[endereço completo]"}
- Representante Legal: ${input_data.representante || "[nome do representante]"}

**PLANO CONTRATADO:**
- Tipo de Projeto: ${input_data.tipo_projeto || "GIG Completo"}
- Plano: ${input_data.plano || "GIG Essencial"}
- Vigência: ${input_data.prazo || "12 meses"}
- Porte da Empresa: ${input_data.porte || "Média empresa"}

**VALORES:**
- Diagnóstico Inicial: ${input_data.valor_diagnostico || "R$ 8.900,00"}
- Mensalidade: ${input_data.valor_mensal || "a partir de R$ 4.500"}

**DATA:**
- Data de início: ${input_data.data_inicio || new Date().toLocaleDateString("pt-BR")}
- Local: ${input_data.local || "São Paulo/SP"}

Inclua TODAS as 11 cláusulas do modelo oficial CCE.`;
        break;

      case "chat":
      default:
        systemPrompt = `Você é um assistente especializado em governança corporativa, compliance e gestão empresarial.
Responda de forma clara, profissional e objetiva.`;
        userPrompt = String(input_data.mensagem || input_data.prompt || "");
        break;
    }

    const startTime = Date.now();

    // Note: Streaming is disabled for multi-provider support. Enable only for Lovable gateway.
    if (stream && aiConfig.provider === "lovable") {
      // Streaming response (only supported with Lovable gateway)
      const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${aiConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na configuração do workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Non-streaming response using multi-provider callAI
      const result = await callAI(aiConfig, systemPrompt, userPrompt);
      const durationMs = Date.now() - startTime;

      // Save to history
      await supabaseService.from("ai_generations").insert({
        tipo,
        input_data,
        output_text: result.text,
        user_id: user.id,
        projeto_id: projeto_id || null,
        organizacao_id: organizacao_id || null,
        tokens_used: result.tokens,
        duracao_ms: durationMs,
        status: "completed",
        provider: aiConfig.provider,
        model: aiConfig.model,
      });

      return new Response(
        JSON.stringify({
          success: true,
          output: result.text,
          tokens_used: result.tokens,
          duration_ms: durationMs,
          provider: aiConfig.provider,
          model: aiConfig.model
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro na função ai-generate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

