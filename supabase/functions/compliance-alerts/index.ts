import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Returns YYYY-MM-DD for today + daysAhead
function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Fetch email for a user_id via profiles table
async function getUserEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  return data?.email ?? null;
}

// Fetch admin/consultor emails for an organization
async function getOrgAlertEmails(
  supabase: ReturnType<typeof createClient>,
  organizacaoId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("organizacao_id", organizacaoId)
    .in("role", ["admin", "consultor"]);

  if (!data?.length) return [];

  const ids = data.map((r: { user_id: string }) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email")
    .in("id", ids);

  return (profiles ?? []).map((p: { email: string | null }) => p.email).filter(Boolean) as string[];
}

// ─── Alert: Compliance Obrigações vencendo em ≤7 dias ─────────────────────────
async function alertObrigacoes(supabase: ReturnType<typeof createClient>): Promise<number> {
  const threshold = futureDate(7);
  const { data: obrigacoes, error } = await supabase
    .from("compliance_obrigacoes")
    .select("id, titulo, proxima_data, orgao_regulador, lei_referencia, responsavel_id, organizacao_id")
    .lte("proxima_data", threshold)
    .gte("proxima_data", today())
    .in("status", ["pendente", "em_andamento"])
    .not("organizacao_id", "is", null);

  if (error) { console.error("alertObrigacoes query error:", error.message); return 0; }
  if (!obrigacoes?.length) return 0;

  // Group by responsavel_id, fallback to org admins
  const byResponsavel = new Map<string, typeof obrigacoes>();
  for (const o of obrigacoes) {
    const key = o.responsavel_id ?? `org:${o.organizacao_id}`;
    if (!byResponsavel.has(key)) byResponsavel.set(key, []);
    byResponsavel.get(key)!.push(o);
  }

  let sent = 0;
  for (const [key, items] of byResponsavel) {
    let emails: string[] = [];

    if (key.startsWith("org:")) {
      emails = await getOrgAlertEmails(supabase, key.replace("org:", ""));
    } else {
      const email = await getUserEmail(supabase, key);
      if (email) emails = [email];
    }

    for (const email of emails) {
      const rows = items
        .map(
          (o) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${o.titulo}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${o.orgao_regulador ?? "-"}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;color:#e53e3e;font-weight:600;">${o.proxima_data}</td>
            </tr>`
        )
        .join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1a202c;">⚠️ Obrigações de Compliance Próximas do Vencimento</h2>
          <p style="color:#718096;">Você tem obrigações regulatórias com prazo nos próximos 7 dias:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="padding:8px;text-align:left;font-size:13px;color:#4a5568;">Obrigação</th>
                <th style="padding:8px;text-align:left;font-size:13px;color:#4a5568;">Órgão</th>
                <th style="padding:8px;text-align:left;font-size:13px;color:#4a5568;">Prazo</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#718096;font-size:13px;">Acesse o <strong>Compliance Calendar</strong> no sistema para atualizar o status.</p>
        </div>`;

      const ok = await sendEmail(supabase, email, "⚠️ Compliance: obrigações próximas do vencimento", html);
      if (ok) sent++;
    }
  }

  console.log(`alertObrigacoes: ${obrigacoes.length} items → ${sent} emails sent`);
  return sent;
}

// ─── Alert: Due Diligence / Fornecedores com reavaliação em ≤30 dias ──────────
async function alertFornecedores(supabase: ReturnType<typeof createClient>): Promise<number> {
  const threshold = futureDate(30);
  const { data: fornecedores, error } = await supabase
    .from("fornecedores")
    .select("id, nome, proxima_avaliacao, nivel_criticidade, organizacao_id")
    .lte("proxima_avaliacao", threshold)
    .gte("proxima_avaliacao", today())
    .eq("status", "ativo");

  if (error) { console.error("alertFornecedores query error:", error.message); return 0; }
  if (!fornecedores?.length) return 0;

  // Group by organizacao_id
  const byOrg = new Map<string, typeof fornecedores>();
  for (const f of fornecedores) {
    if (!byOrg.has(f.organizacao_id)) byOrg.set(f.organizacao_id, []);
    byOrg.get(f.organizacao_id)!.push(f);
  }

  let sent = 0;
  for (const [orgId, items] of byOrg) {
    const emails = await getOrgAlertEmails(supabase, orgId);

    for (const email of emails) {
      const rows = items
        .map(
          (f) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${f.nome}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${f.nivel_criticidade}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;color:#d69e2e;font-weight:600;">${f.proxima_avaliacao}</td>
            </tr>`
        )
        .join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1a202c;">🔄 Renovação de Due Diligence de Fornecedores</h2>
          <p style="color:#718096;">Os fornecedores abaixo precisam de reavaliação nos próximos 30 dias:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="padding:8px;text-align:left;font-size:13px;color:#4a5568;">Fornecedor</th>
                <th style="padding:8px;text-align:left;font-size:13px;color:#4a5568;">Criticidade</th>
                <th style="padding:8px;text-align:left;font-size:13px;color:#4a5568;">Próxima Avaliação</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#718096;font-size:13px;">Acesse <strong>Third-Party Risk</strong> no sistema para agendar a avaliação.</p>
        </div>`;

      const ok = await sendEmail(supabase, email, "🔄 Due Diligence: fornecedores para reavaliar", html);
      if (ok) sent++;
    }
  }

  console.log(`alertFornecedores: ${fornecedores.length} items → ${sent} emails sent`);
  return sent;
}

// ─── Alert: Conflito de Interesse — lembrete anual de declaração ───────────────
async function alertConflitos(supabase: ReturnType<typeof createClient>): Promise<number> {
  const anoAtual = new Date().getFullYear();
  const inicioAno = `${anoAtual}-01-01`;

  // Find orgs that use the conflict module (have at least one conflito)
  const { data: orgs } = await supabase
    .from("conflito_interesses")
    .select("organizacao_id")
    .gte("created_at", inicioAno);

  const orgIds = [...new Set((orgs ?? []).map((o: { organizacao_id: string }) => o.organizacao_id))];
  if (!orgIds.length) return 0;

  // Get all consultores/admins for these orgs who haven't declared this year
  const { data: allRoles } = await supabase
    .from("user_roles")
    .select("user_id, organizacao_id")
    .in("organizacao_id", orgIds)
    .in("role", ["consultor", "admin"]);

  if (!allRoles?.length) return 0;

  // Check which users already have a declaration this year
  const { data: jaDeclararam } = await supabase
    .from("conflito_interesses")
    .select("declarado_por")
    .gte("created_at", inicioAno)
    .in("organizacao_id", orgIds);

  const declaradosSet = new Set((jaDeclararam ?? []).map((d: { declarado_por: string }) => d.declarado_por));
  const pendentes = allRoles.filter((r: { user_id: string }) => !declaradosSet.has(r.user_id));

  if (!pendentes.length) return 0;

  let sent = 0;
  for (const role of pendentes) {
    const email = await getUserEmail(supabase, role.user_id);
    if (!email) continue;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a202c;">📋 Declaração de Conflito de Interesse ${anoAtual}</h2>
        <p style="color:#718096;">
          Você ainda não realizou sua declaração anual de conflito de interesse para ${anoAtual}.
        </p>
        <p style="color:#718096;">
          A declaração é obrigatória e garante a transparência da governança corporativa da sua organização.
          Acesse o módulo <strong>Conflitos de Interesse</strong> no sistema para realizar sua declaração.
        </p>
        <p style="color:#a0aec0;font-size:12px;">Esta é uma notificação automática anual. Ignore se já declarou recentemente.</p>
      </div>`;

    const ok = await sendEmail(
      supabase,
      email,
      `📋 Lembrete: Declaração de Conflito de Interesse ${anoAtual}`,
      html
    );
    if (ok) sent++;
  }

  console.log(`alertConflitos: ${pendentes.length} pendentes → ${sent} emails sent`);
  return sent;
}

// ─── Handler principal ────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: CRON_SECRET
    const expectedSecret = Deno.env.get("CRON_SECRET") ?? "";
    const providedSecret = req.headers.get("x-cron-secret") ?? "";
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const tipo = url.searchParams.get("tipo") ?? "all";

    const results: Record<string, number> = {};

    if (tipo === "obrigacoes" || tipo === "all") {
      results.obrigacoes = await alertObrigacoes(supabase);
    }
    if (tipo === "fornecedores" || tipo === "all") {
      results.fornecedores = await alertFornecedores(supabase);
    }
    if (tipo === "conflitos" || tipo === "all") {
      results.conflitos = await alertConflitos(supabase);
    }

    return new Response(
      JSON.stringify({ ok: true, emails_sent: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("compliance-alerts error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
