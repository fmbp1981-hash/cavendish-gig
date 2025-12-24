// =============================================
// Edge Function: Envio Automático de Relatórios Mensais
// Executado via Cron Job todo dia 1 do mês às 08:00
// =============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { loadIntegration } from "../_shared/integrations.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente Supabase com service_role para bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface OrganizacaoRelatorio {
  organizacao_id: string;
  organizacao_nome: string;
  email: string;
  mes: number;
  ano: number;
}

interface RelatorioMetricas {
  total_documentos: number;
  documentos_aprovados: number;
  documentos_pendentes: number;
  total_tarefas: number;
  tarefas_concluidas: number;
  progresso_projeto: number;
}

/**
 * Busca métricas do mês anterior para uma organização
 */
async function buscarMetricas(
  organizacaoId: string,
  mes: number,
  ano: number
): Promise<RelatorioMetricas> {
  const periodoInicio = new Date(ano, mes - 1, 1);
  const periodoFim = new Date(ano, mes, 0);

  // Documentos
  const { data: documentos } = await supabase
    .from("documentos_requeridos_status")
    .select("status")
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", periodoInicio.toISOString())
    .lte("created_at", periodoFim.toISOString());

  const totalDocumentos = documentos?.length || 0;
  const documentosAprovados =
    documentos?.filter((d) => d.status === "aprovado").length || 0;
  const documentosPendentes =
    documentos?.filter((d) => d.status === "pendente").length || 0;

  // Tarefas
  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("status")
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", periodoInicio.toISOString())
    .lte("created_at", periodoFim.toISOString());

  const totalTarefas = tarefas?.length || 0;
  const tarefasConcluidas =
    tarefas?.filter((t) => t.status === "concluida").length || 0;

  // Progresso do projeto
  const { data: projeto } = await supabase
    .from("projetos")
    .select("progresso")
    .eq("organizacao_id", organizacaoId)
    .single();

  const progressoProjeto = projeto?.progresso || 0;

  return {
    total_documentos: totalDocumentos,
    documentos_aprovados: documentosAprovados,
    documentos_pendentes: documentosPendentes,
    total_tarefas: totalTarefas,
    tarefas_concluidas: tarefasConcluidas,
    progresso_projeto: progressoProjeto,
  };
}

/**
 * Gera HTML do relatório mensal
 */
function gerarRelatorioHTML(
  organizacaoNome: string,
  mes: number,
  ano: number,
  metricas: RelatorioMetricas
): string {
  const mesesNomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const mesNome = mesesNomes[mes - 1];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Mensal - ${mesNome}/${ano}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .subtitle {
      color: #64748b;
      margin-top: 8px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 15px;
      border-radius: 4px;
    }
    .metric-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1e293b;
      margin-top: 5px;
    }
    .metric-card.success {
      border-left-color: #22c55e;
    }
    .metric-card.warning {
      border-left-color: #f59e0b;
    }
    .progress-bar {
      background: #e2e8f0;
      border-radius: 8px;
      height: 24px;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-fill {
      background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      transition: width 0.3s ease;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Mensal</h1>
      <p class="subtitle">${organizacaoNome}</p>
      <p class="subtitle">${mesNome} de ${ano}</p>
    </div>

    <h2>Resumo do Mês</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Total de Documentos</div>
        <div class="metric-value">${metricas.total_documentos}</div>
      </div>
      <div class="metric-card success">
        <div class="metric-label">Documentos Aprovados</div>
        <div class="metric-value">${metricas.documentos_aprovados}</div>
      </div>
      <div class="metric-card warning">
        <div class="metric-label">Documentos Pendentes</div>
        <div class="metric-value">${metricas.documentos_pendentes}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total de Tarefas</div>
        <div class="metric-value">${metricas.total_tarefas}</div>
      </div>
    </div>

    <h3>Tarefas Concluídas</h3>
    <p><strong>${metricas.tarefas_concluidas}</strong> de <strong>${metricas.total_tarefas}</strong> tarefas foram concluídas neste mês.</p>

    <h3>Progresso do Projeto</h3>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${metricas.progresso_projeto}%">
        ${metricas.progresso_projeto.toFixed(0)}%
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${SUPABASE_URL.replace("/rest/v1", "")}" class="cta-button">
        Acessar Sistema Completo
      </a>
    </div>

    <div class="footer">
      <p>Este é um relatório automático gerado pelo Sistema GIG - Gestão Integrada de Governança</p>
      <p>Cavendish Consultoria Empresarial</p>
      <p><a href="#">Ver relatórios anteriores</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Envia email via Resend
 */
async function enviarEmail(
  para: string,
  assunto: string,
  html: string
): Promise<boolean> {
  try {
    const integration = await loadIntegration(supabase, "resend", "system", null);
    if (integration && !integration.enabled) {
      console.error("Resend disabled via integrations vault");
      return false;
    }

    let apiKey = (integration?.secrets as any)?.RESEND_API_KEY || RESEND_API_KEY || "";

    if (!apiKey) {
      console.error("RESEND_API_KEY não configurada");
      return false;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "GIG Sistema <noreply@cavendish.com.br>",
        to: [para],
        subject: assunto,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Erro ao enviar email:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Processa envio de relatório para uma organização
 */
async function processarRelatorio(
  org: OrganizacaoRelatorio
): Promise<boolean> {
  try {
    console.log(`Processando relatório para: ${org.organizacao_nome}`);

    // 1. Buscar métricas
    const metricas = await buscarMetricas(
      org.organizacao_id,
      org.mes,
      org.ano
    );

    // 2. Gerar HTML
    const html = gerarRelatorioHTML(
      org.organizacao_nome,
      org.mes,
      org.ano,
      metricas
    );

    // 3. Criar registro de envio
    const { data: relatorio, error: createError } = await supabase
      .from("relatorio_envios")
      .insert({
        organizacao_id: org.organizacao_id,
        periodo_inicio: new Date(org.ano, org.mes - 1, 1).toISOString(),
        periodo_fim: new Date(org.ano, org.mes, 0).toISOString(),
        mes_referencia: org.mes,
        ano_referencia: org.ano,
        email_destinatario: org.email,
        assunto: `Relatório Mensal - ${org.mes}/${org.ano}`,
        relatorio_html: html,
        status: "sending",
      })
      .select()
      .single();

    if (createError || !relatorio) {
      console.error("Erro ao criar registro:", createError);
      return false;
    }

    // 4. Enviar email
    const enviado = await enviarEmail(org.email, relatorio.assunto, html);

    if (enviado) {
      // 5. Marcar como enviado
      await supabase.rpc("mark_relatorio_enviado", {
        p_relatorio_id: relatorio.id,
        p_metricas: metricas,
      });

      console.log(`✅ Relatório enviado com sucesso para ${org.email}`);
      return true;
    } else {
      // 5. Marcar como falho
      await supabase.rpc("mark_relatorio_failed", {
        p_relatorio_id: relatorio.id,
        p_erro: "Falha ao enviar email via Resend",
      });

      console.log(`❌ Falha ao enviar para ${org.email}`);
      return false;
    }
  } catch (error) {
    console.error(`Erro ao processar relatório:`, error);
    return false;
  }
}

/**
 * Handler principal da Edge Function
 */
serve(async (req) => {
  // Require a shared secret because this function is triggered by cron.
  const expectedSecret = Deno.env.get("CRON_SECRET") || "";
  const providedSecret = req.headers.get("x-cron-secret") || "";
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Verificar se é chamada do cron ou manual
    const authHeader = req.headers.get("Authorization");
    const isCronJob = authHeader?.includes("Bearer");

    console.log("🚀 Iniciando envio de relatórios mensais...");

    // Buscar organizações que devem receber relatórios
    const { data: organizacoes, error } = await supabase.rpc(
      "schedule_monthly_reports"
    );

    if (error) {
      console.error("Erro ao buscar organizações:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!organizacoes || organizacoes.length === 0) {
      console.log("Nenhuma organização para processar");
      return new Response(
        JSON.stringify({
          message: "Nenhuma organização pendente",
          total: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📧 ${organizacoes.length} relatórios para enviar`);

    // Processar cada organização
    const resultados = await Promise.all(
      organizacoes.map((org: OrganizacaoRelatorio) => processarRelatorio(org))
    );

    const enviados = resultados.filter((r) => r === true).length;
    const falhas = resultados.filter((r) => r === false).length;

    console.log(`✅ ${enviados} enviados | ❌ ${falhas} falhas`);

    return new Response(
      JSON.stringify({
        message: "Processamento concluído",
        total: organizacoes.length,
        enviados,
        falhas,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
