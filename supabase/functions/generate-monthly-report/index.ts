import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportData {
  organizacao: {
    id: string;
    nome: string;
    cnpj: string | null;
  };
  projeto: {
    id: string;
    nome: string;
    tipo: string;
    fase_atual: string;
    data_inicio: string | null;
  };
  documentos: {
    total: number;
    aprovados: number;
    pendentes: number;
    rejeitados: number;
    enviados: number;
    percentual_aprovado: number;
  };
  diagnostico: {
    status: string;
    score_geral: number | null;
    nivel_maturidade: string | null;
    pontos_fortes: string[] | null;
    pontos_atencao: string[] | null;
    scores: {
      estrutura_societaria: number | null;
      governanca: number | null;
      compliance: number | null;
      gestao: number | null;
      planejamento: number | null;
    };
  } | null;
  adesoes_etica: {
    total_membros: number;
    total_adesoes: number;
    percentual_adesao: number;
  };
  treinamentos: {
    total_obrigatorios: number;
    total_concluidos: number;
    percentual_conclusao: number;
  };
  gerado_em: string;
  periodo: string;
}

function getNivelMaturidadeLabel(nivel: string | null): string {
  const labels: Record<string, string> = {
    inexistente: "Inexistente",
    inicial: "Inicial",
    basico: "Básico",
    intermediario: "Intermediário",
    avancado: "Avançado",
    excelencia: "Excelência",
  };
  return nivel ? labels[nivel] || nivel : "Não avaliado";
}

function getFaseLabel(fase: string): string {
  const labels: Record<string, string> = {
    diagnostico: "Diagnóstico",
    implementacao: "Implementação",
    recorrencia: "Recorrência",
  };
  return labels[fase] || fase;
}

function getTipoProjetoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    gig_completo: "GIG Completo",
    gig_modular: "GIG Modular",
    consultoria_pontual: "Consultoria Pontual",
  };
  return labels[tipo] || tipo;
}

function generateHTMLReport(data: ReportData): string {
  const diagnosticoSection = data.diagnostico ? `
    <div class="section">
      <h2>📊 Diagnóstico de Maturidade</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Status:</span>
          <span class="value">${data.diagnostico.status === 'concluido' ? 'Concluído' : 'Em andamento'}</span>
        </div>
        <div class="info-item">
          <span class="label">Score Geral:</span>
          <span class="value highlight">${data.diagnostico.score_geral?.toFixed(1) || 'N/A'}%</span>
        </div>
        <div class="info-item">
          <span class="label">Nível de Maturidade:</span>
          <span class="value">${getNivelMaturidadeLabel(data.diagnostico.nivel_maturidade)}</span>
        </div>
      </div>
      
      <h3>Scores por Dimensão</h3>
      <div class="scores-grid">
        <div class="score-item">
          <div class="score-label">Estrutura Societária</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${data.diagnostico.scores.estrutura_societaria || 0}%"></div>
          </div>
          <div class="score-value">${data.diagnostico.scores.estrutura_societaria?.toFixed(1) || 0}%</div>
        </div>
        <div class="score-item">
          <div class="score-label">Governança</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${data.diagnostico.scores.governanca || 0}%"></div>
          </div>
          <div class="score-value">${data.diagnostico.scores.governanca?.toFixed(1) || 0}%</div>
        </div>
        <div class="score-item">
          <div class="score-label">Compliance</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${data.diagnostico.scores.compliance || 0}%"></div>
          </div>
          <div class="score-value">${data.diagnostico.scores.compliance?.toFixed(1) || 0}%</div>
        </div>
        <div class="score-item">
          <div class="score-label">Gestão</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${data.diagnostico.scores.gestao || 0}%"></div>
          </div>
          <div class="score-value">${data.diagnostico.scores.gestao?.toFixed(1) || 0}%</div>
        </div>
        <div class="score-item">
          <div class="score-label">Planejamento</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${data.diagnostico.scores.planejamento || 0}%"></div>
          </div>
          <div class="score-value">${data.diagnostico.scores.planejamento?.toFixed(1) || 0}%</div>
        </div>
      </div>

      ${data.diagnostico.pontos_fortes && data.diagnostico.pontos_fortes.length > 0 ? `
        <h3>Pontos Fortes</h3>
        <ul class="points-list success">
          ${data.diagnostico.pontos_fortes.map(p => `<li>✓ ${p}</li>`).join('')}
        </ul>
      ` : ''}

      ${data.diagnostico.pontos_atencao && data.diagnostico.pontos_atencao.length > 0 ? `
        <h3>Pontos de Atenção</h3>
        <ul class="points-list warning">
          ${data.diagnostico.pontos_atencao.map(p => `<li>⚠ ${p}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  ` : `
    <div class="section">
      <h2>📊 Diagnóstico de Maturidade</h2>
      <p class="no-data">Diagnóstico ainda não iniciado.</p>
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Mensal de Governança - ${data.organizacao.nome}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2F3E46;
      background: #fff;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0B66C3;
    }
    .header h1 {
      color: #0B66C3;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header .subtitle {
      color: #666;
      font-size: 16px;
    }
    .header .periodo {
      background: #f0f7ff;
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 12px;
      font-weight: 600;
      color: #0B66C3;
    }
    .org-info {
      background: linear-gradient(135deg, #0B66C3 0%, #0a5bae 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .org-info h2 {
      font-size: 22px;
      margin-bottom: 8px;
    }
    .org-info .details {
      opacity: 0.9;
      font-size: 14px;
    }
    .section {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .section h2 {
      color: #0B66C3;
      font-size: 18px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0f7ff;
    }
    .section h3 {
      color: #374151;
      font-size: 15px;
      margin: 16px 0 12px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .info-item {
      text-align: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .info-item .label {
      display: block;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .info-item .value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }
    .info-item .value.highlight {
      color: #0B66C3;
    }
    .info-item .value.success {
      color: #28A745;
    }
    .info-item .value.warning {
      color: #E3A200;
    }
    .info-item .value.danger {
      color: #dc2626;
    }
    .progress-container {
      margin-top: 16px;
    }
    .progress-bar {
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28A745 0%, #34d058 100%);
      border-radius: 6px;
      transition: width 0.3s ease;
    }
    .scores-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .score-item {
      display: grid;
      grid-template-columns: 150px 1fr 60px;
      align-items: center;
      gap: 12px;
    }
    .score-label {
      font-size: 13px;
      color: #374151;
    }
    .score-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #0B66C3 0%, #3b82f6 100%);
      border-radius: 4px;
    }
    .score-value {
      font-size: 13px;
      font-weight: 600;
      color: #0B66C3;
      text-align: right;
    }
    .points-list {
      list-style: none;
      padding: 0;
    }
    .points-list li {
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 6px;
      font-size: 14px;
    }
    .points-list.success li {
      background: #ecfdf5;
      color: #065f46;
    }
    .points-list.warning li {
      background: #fffbeb;
      color: #92400e;
    }
    .no-data {
      color: #9ca3af;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
    .footer .generated {
      margin-bottom: 4px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Relatório Mensal de Governança</h1>
      <div class="subtitle">Acompanhamento de Governança, Integridade e Gestão</div>
      <div class="periodo">${data.periodo}</div>
    </div>

    <div class="org-info">
      <h2>${data.organizacao.nome}</h2>
      <div class="details">
        ${data.organizacao.cnpj ? `CNPJ: ${data.organizacao.cnpj} | ` : ''}
        Projeto: ${data.projeto.nome} | 
        Tipo: ${getTipoProjetoLabel(data.projeto.tipo)} | 
        Fase: ${getFaseLabel(data.projeto.fase_atual)}
      </div>
    </div>

    <div class="section">
      <h2>📁 Documentos</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Total</span>
          <span class="value">${data.documentos.total}</span>
        </div>
        <div class="info-item">
          <span class="label">Aprovados</span>
          <span class="value success">${data.documentos.aprovados}</span>
        </div>
        <div class="info-item">
          <span class="label">Pendentes</span>
          <span class="value warning">${data.documentos.pendentes}</span>
        </div>
      </div>
      <div class="progress-container">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 13px; color: #6b7280;">Progresso de aprovação</span>
          <span style="font-size: 13px; font-weight: 600; color: #28A745;">${data.documentos.percentual_aprovado.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${data.documentos.percentual_aprovado}%"></div>
        </div>
      </div>
    </div>

    ${diagnosticoSection}

    <div class="section">
      <h2>📜 Adesão ao Código de Ética</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Total de Membros</span>
          <span class="value">${data.adesoes_etica.total_membros}</span>
        </div>
        <div class="info-item">
          <span class="label">Adesões</span>
          <span class="value success">${data.adesoes_etica.total_adesoes}</span>
        </div>
        <div class="info-item">
          <span class="label">% de Adesão</span>
          <span class="value highlight">${data.adesoes_etica.percentual_adesao.toFixed(1)}%</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🎓 Treinamentos Obrigatórios</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Total Obrigatórios</span>
          <span class="value">${data.treinamentos.total_obrigatorios}</span>
        </div>
        <div class="info-item">
          <span class="label">Concluídos</span>
          <span class="value success">${data.treinamentos.total_concluidos}</span>
        </div>
        <div class="info-item">
          <span class="label">% Conclusão</span>
          <span class="value highlight">${data.treinamentos.percentual_conclusao.toFixed(1)}%</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="generated">Relatório gerado automaticamente em ${data.gerado_em}</div>
      <div>Cavendish GIG - Governança, Integridade e Gestão</div>
    </div>
  </div>
</body>
</html>
  `;
}

async function fetchReportData(supabase: any, organizacaoId: string): Promise<ReportData | null> {
  console.log(`Fetching report data for organization: ${organizacaoId}`);

  // Fetch organization
  const { data: org, error: orgError } = await supabase
    .from('organizacoes')
    .select('*')
    .eq('id', organizacaoId)
    .single();

  if (orgError || !org) {
    console.error('Error fetching organization:', orgError);
    return null;
  }

  // Fetch project
  const { data: projeto, error: projetoError } = await supabase
    .from('projetos')
    .select('*')
    .eq('organizacao_id', organizacaoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (projetoError || !projeto) {
    console.error('Error fetching project:', projetoError);
    return null;
  }

  // Fetch document stats
  const { data: docStats } = await supabase.rpc('get_project_stats', { p_projeto_id: projeto.id });

  // Fetch diagnostico
  const { data: diagnostico } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('projeto_id', projeto.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch organization members count
  const { count: totalMembros } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId);

  // Fetch ethics adherences count
  const { count: totalAdesoes } = await supabase
    .from('codigo_etica_adesoes')
    .select('*', { count: 'exact', head: true })
    .eq('organizacao_id', organizacaoId);

  // Fetch mandatory trainings count
  const { count: totalObrigatorios } = await supabase
    .from('treinamentos')
    .select('*', { count: 'exact', head: true })
    .eq('obrigatorio', true)
    .eq('ativo', true);

  // Fetch completed mandatory trainings for this organization
  const { data: completedTrainings } = await supabase
    .from('treinamento_inscricoes')
    .select('treinamento_id, treinamentos!inner(obrigatorio)')
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'concluido')
    .eq('treinamentos.obrigatorio', true);

  const totalConcluidos = completedTrainings?.length || 0;

  const now = new Date();
  const periodo = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return {
    organizacao: {
      id: org.id,
      nome: org.nome,
      cnpj: org.cnpj,
    },
    projeto: {
      id: projeto.id,
      nome: projeto.nome,
      tipo: projeto.tipo,
      fase_atual: projeto.fase_atual,
      data_inicio: projeto.data_inicio,
    },
    documentos: {
      total: docStats?.total || 0,
      aprovados: docStats?.aprovados || 0,
      pendentes: docStats?.pendentes || 0,
      rejeitados: docStats?.rejeitados || 0,
      enviados: docStats?.enviados || 0,
      percentual_aprovado: docStats?.percentual_aprovado || 0,
    },
    diagnostico: diagnostico ? {
      status: diagnostico.status,
      score_geral: diagnostico.score_geral,
      nivel_maturidade: diagnostico.nivel_maturidade,
      pontos_fortes: diagnostico.pontos_fortes,
      pontos_atencao: diagnostico.pontos_atencao,
      scores: {
        estrutura_societaria: diagnostico.score_estrutura_societaria,
        governanca: diagnostico.score_governanca,
        compliance: diagnostico.score_compliance,
        gestao: diagnostico.score_gestao,
        planejamento: diagnostico.score_planejamento,
      },
    } : null,
    adesoes_etica: {
      total_membros: totalMembros || 0,
      total_adesoes: totalAdesoes || 0,
      percentual_adesao: totalMembros ? ((totalAdesoes || 0) / totalMembros) * 100 : 0,
    },
    treinamentos: {
      total_obrigatorios: totalObrigatorios || 0,
      total_concluidos: totalConcluidos,
      percentual_conclusao: totalObrigatorios ? (totalConcluidos / totalObrigatorios) * 100 : 0,
    },
    gerado_em: now.toLocaleString('pt-BR'),
    periodo: periodo.charAt(0).toUpperCase() + periodo.slice(1),
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, organizacao_id } = await req.json();
    console.log(`Processing request: action=${action}, organizacao_id=${organizacao_id}`);

    if (action === "generate") {
      // Generate report for specific organization
      if (!organizacao_id) {
        return new Response(
          JSON.stringify({ error: "organizacao_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reportData = await fetchReportData(supabase, organizacao_id);
      if (!reportData) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch report data" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const html = generateHTMLReport(reportData);

      return new Response(html, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    } else if (action === "generate-all") {
      // Generate reports for all organizations (cron job)
      const { data: organizacoes, error } = await supabase
        .from('organizacoes')
        .select('id, nome');

      if (error) {
        console.error('Error fetching organizations:', error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch organizations" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Generating reports for ${organizacoes?.length || 0} organizations`);

      const results = [];
      for (const org of organizacoes || []) {
        try {
          const reportData = await fetchReportData(supabase, org.id);
          if (reportData) {
            // Here you could store the report or send via email
            // For now, we just log success
            console.log(`Report generated for ${org.nome}`);
            results.push({ organizacao_id: org.id, nome: org.nome, success: true });
          } else {
            results.push({ organizacao_id: org.id, nome: org.nome, success: false, error: 'No data' });
          }
        } catch (err) {
          console.error(`Error generating report for ${org.nome}:`, err);
          results.push({ organizacao_id: org.id, nome: org.nome, success: false, error: String(err) });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "get-data") {
      // Return JSON data for frontend rendering
      if (!organizacao_id) {
        return new Response(
          JSON.stringify({ error: "organizacao_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reportData = await fetchReportData(supabase, organizacao_id);
      if (!reportData) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch report data" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(reportData),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-monthly-report:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
