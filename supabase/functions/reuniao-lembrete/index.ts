import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Cavendish GIG <noreply@cavendishgig.com.br>";

interface Reuniao {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  link_video: string | null;
  organizacao_id: string;
  participantes: { email?: string; nome?: string }[];
  organizacao: { nome: string } | null;
}

function formatDataReuniao(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEmailHtml(reuniao: Reuniao, destinatarioNome: string): string {
  const dataFormatada = formatDataReuniao(reuniao.data_inicio);
  const orgNome = reuniao.organizacao?.nome ?? "sua organização";

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #0b66c3, #1e40af); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
    .info-box { background: #eff6ff; border-left: 4px solid #0b66c3; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .btn { display: inline-block; background: #0b66c3; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Lembrete de Reunião</h1>
    </div>
    <div class="content">
      <span class="badge">Amanhã</span>
      <p>Olá${destinatarioNome ? `, ${destinatarioNome}` : ""},</p>
      <p>Lembramos que você tem uma reunião agendada para <strong>amanhã</strong>:</p>
      <div class="info-box">
        <strong>Reunião:</strong> ${reuniao.titulo}<br/>
        <strong>Data:</strong> ${dataFormatada}<br/>
        <strong>Organização:</strong> ${orgNome}${reuniao.link_video ? `<br/><strong>Link:</strong> <a href="${reuniao.link_video}">${reuniao.link_video}</a>` : ""}
      </div>
      ${reuniao.link_video ? `<a href="${reuniao.link_video}" class="btn">Entrar na reunião</a>` : ""}
    </div>
    <div class="footer">Cavendish GIG · Sistema de Governança Integrada<br/>Este é um email automático. Por favor, não responda diretamente.</div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept cron secret (from pg_cron) or admin JWT
  const cronSecret = req.headers.get("x-cron-secret");
  const service = createServiceClient();

  if (cronSecret) {
    const { data: setting } = await service
      .from("system_settings")
      .select("value")
      .eq("key", "cron_secret")
      .single();

    if (!setting || setting.value !== cronSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    return new Response(JSON.stringify({ error: "x-cron-secret requerido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const integration = await loadIntegration(service, "resend", "system", null);
    const resendApiKey = (integration?.secrets as Record<string, string> | null)?.RESEND_API_KEY
      || Deno.env.get("RESEND_API_KEY") || null;

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY não configurado — lembretes não enviados");
      return new Response(JSON.stringify({ skipped: true, reason: "email_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);

    // Find meetings starting in 23:30 to 24:30 from now (±30 min window around 24h)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 30 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000);

    const { data: reunioes, error: reError } = await service
      .from("reunioes")
      .select(`
        id, titulo, data_inicio, data_fim, link_video, organizacao_id, participantes,
        organizacao:organizacoes(nome)
      `)
      .eq("status", "agendada")
      .gte("data_inicio", windowStart.toISOString())
      .lte("data_inicio", windowEnd.toISOString());

    if (reError) throw reError;
    if (!reunioes || reunioes.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "Nenhuma reunião na janela de 24h" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const skipped: string[] = [];

    for (const raw of reunioes) {
      const reuniao = raw as unknown as Reuniao;

      // Check if reminder already sent
      const { data: jaEnviado } = await service
        .from("reuniao_lembretes_enviados")
        .select("id")
        .eq("reuniao_id", reuniao.id)
        .eq("tipo", "24h")
        .maybeSingle();

      if (jaEnviado) {
        skipped.push(reuniao.id);
        continue;
      }

      // Collect recipient emails: participantes with email + org members
      const recipientEmails = new Set<string>();
      const participanteNomes: Record<string, string> = {};

      const participantes = Array.isArray(reuniao.participantes) ? reuniao.participantes : [];
      for (const p of participantes) {
        if (p.email) {
          recipientEmails.add(p.email);
          if (p.nome) participanteNomes[p.email] = p.nome;
        }
      }

      // Also notify org members (clientes)
      const { data: members } = await service
        .from("organization_members")
        .select("user_id")
        .eq("organizacao_id", reuniao.organizacao_id);

      if (members && members.length > 0) {
        const userIds = members.map((m: { user_id: string }) => m.user_id);
        const { data: profiles } = await service
          .from("profiles")
          .select("email, full_name")
          .in("id", userIds);

        if (profiles) {
          for (const profile of profiles as { email: string | null; full_name: string | null }[]) {
            if (profile.email) {
              recipientEmails.add(profile.email);
              if (profile.full_name && !participanteNomes[profile.email]) {
                participanteNomes[profile.email] = profile.full_name;
              }
            }
          }
        }
      }

      if (recipientEmails.size === 0) {
        console.warn(`Reunião ${reuniao.id} sem destinatários — pulando`);
        skipped.push(reuniao.id);
        continue;
      }

      // Send one email per recipient
      for (const email of recipientEmails) {
        const nome = participanteNomes[email] || "";
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            subject: `📅 Lembrete: "${reuniao.titulo}" — amanhã`,
            html: buildEmailHtml(reuniao, nome),
          });
          sent++;
        } catch (emailErr) {
          console.error(`Erro ao enviar lembrete para ${email}:`, emailErr);
        }
      }

      // Mark reminder as sent
      await service
        .from("reuniao_lembretes_enviados")
        .insert({ reuniao_id: reuniao.id, tipo: "24h" });
    }

    return new Response(
      JSON.stringify({ sent, skipped: skipped.length, total_meetings: reunioes.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Erro em reuniao-lembrete:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
