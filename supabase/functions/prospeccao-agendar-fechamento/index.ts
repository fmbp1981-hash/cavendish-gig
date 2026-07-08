import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { getWhatsAppConfig, sendWhatsAppMessage } from "../_shared/whatsapp-provider.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Agendamento automático da reunião de fechamento comercial com o Alberto Cavendish (blueprint
// §3 / docs/finder-issues/06-agendamento-fechamento.md). Regras de negócio já fechadas em
// conversa anterior: 09h-18h dias úteis (America/Sao_Paulo, sem horário de verão desde 2019 —
// por isso o offset fixo de -3h abaixo, sem precisar de lib de timezone), 30 min por slot,
// antecedência mínima de 24h, janela de busca de 5 dias úteis. Sem slot livre não falha
// silenciosamente: notifica admins + representante via `notificacoes` (mecanismo já existente,
// reaproveitado — ver NotificationBell/useNotificacoes).
//
// O ID do calendário do Alberto fica em `integrations` (provider "google-calendar", campo
// `config.alberto_calendar_id`) — não em `system_settings`, pra reaproveitar o vault que já
// existe pra essa integração em vez de inventar uma segunda fonte de configuração. Convenção:
// esse ID é o próprio email do calendário pessoal do Alberto, usado também como convidado no
// evento (Google Calendar IDs de calendários pessoais são o email do dono).
//
// WhatsApp de confirmação reaproveita `_shared/whatsapp-provider.ts` diretamente (mesmo padrão
// já usado por prospeccao-agent e prospeccao-campaign-dispatch — nenhuma Edge Function deste
// projeto chama outra via HTTP pra WhatsApp, só importa o módulo compartilhado). Email de
// confirmação usa Resend diretamente aqui (mesmo provider do send-email) em vez de invocar
// send-email: essa function tem checagem de role admin/consultor via JWT de usuário real, que
// uma chamada servidor-a-servidor (sem sessão de usuário) não teria como satisfazer — duplicar
// só o envio (não o sistema de templates inteiro) evita fragilizar a autenticação do send-email.

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;
const SLOT_MINUTES = 30;
const MIN_ANTECEDENCIA_MS = 24 * 60 * 60 * 1000;
const JANELA_DIAS_UTEIS = 5;

interface AgendarRequest {
  leadId: string;
}

interface BusyInterval {
  start: string;
  end: string;
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isWeekendBrt(utcDate: Date): boolean {
  const brt = new Date(utcDate.getTime() - BRT_OFFSET_MS);
  const day = brt.getUTCDay();
  return day === 0 || day === 6;
}

function brtDayBoundsUtc(utcDate: Date): { startUtc: Date; endUtc: Date } {
  const brt = new Date(utcDate.getTime() - BRT_OFFSET_MS);
  const y = brt.getUTCFullYear();
  const m = brt.getUTCMonth();
  const d = brt.getUTCDate();
  // 09h/18h BRT = 12h/21h UTC (BRT = UTC-3)
  const startUtc = new Date(Date.UTC(y, m, d, BUSINESS_START_HOUR + 3, 0, 0));
  const endUtc = new Date(Date.UTC(y, m, d, BUSINESS_END_HOUR + 3, 0, 0));
  return { startUtc, endUtc };
}

function slotLivre(slotStart: Date, slotEnd: Date, busy: BusyInterval[]): boolean {
  return !busy.some((b) => {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
  });
}

function encontrarPrimeiroSlotLivre(busy: BusyInterval[], agora: Date): { start: Date; end: Date } | null {
  const inicioJanela = new Date(agora.getTime() + MIN_ANTECEDENCIA_MS);
  const slotMs = SLOT_MINUTES * 60 * 1000;
  let diasUteisChecados = 0;

  // offset em dias corridos, com teto de 30 pra nunca rodar indefinidamente mesmo se a janela
  // de dias úteis nunca fechar por algum bug de cálculo
  for (let offset = 0; offset < 30 && diasUteisChecados < JANELA_DIAS_UTEIS; offset++) {
    const diaCandidato = addDaysUtc(inicioJanela, offset);
    if (isWeekendBrt(diaCandidato)) continue;

    const { startUtc, endUtc } = brtDayBoundsUtc(diaCandidato);
    let slotStart = offset === 0 && inicioJanela.getTime() > startUtc.getTime() ? inicioJanela : startUtc;
    slotStart = new Date(Math.ceil(slotStart.getTime() / slotMs) * slotMs);

    while (slotStart.getTime() + slotMs <= endUtc.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + slotMs);
      if (slotLivre(slotStart, slotEnd, busy)) {
        return { start: slotStart, end: slotEnd };
      }
      slotStart = slotEnd;
    }

    diasUteisChecados++;
  }

  return null;
}

async function chamarGoogleCalendar(action: string, body: Record<string, unknown>): Promise<any> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${supabaseUrl}/functions/v1/google-calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || `google-calendar respondeu ${res.status}`);
  }
  return json.data;
}

async function notificarSemSlot(service: any, lead: Record<string, any>): Promise<void> {
  const { data: admins } = await service.from("user_roles").select("user_id").eq("role", "admin");
  const destinatarios = new Set<string>((admins ?? []).map((a: any) => a.user_id));
  if (lead.responsavel_id) destinatarios.add(lead.responsavel_id);

  const notificacoes = Array.from(destinatarios).map((userId) => ({
    user_id: userId,
    tipo: "agendamento_sem_slot",
    titulo: "Sem horário disponível para reunião de fechamento",
    mensagem: `Não encontramos horário livre na agenda do Alberto nos próximos ${JANELA_DIAS_UTEIS} dias úteis para o lead "${lead.nome}". Agende manualmente.`,
    metadata: { leadId: lead.id, leadNome: lead.nome },
  }));
  if (notificacoes.length > 0) {
    await service.from("notificacoes").insert(notificacoes);
  }
}

async function enviarEmailConfirmacao(
  service: any,
  lead: Record<string, any>,
  slotStart: Date,
  meetLink: string | null,
): Promise<void> {
  if (!lead.email) return;
  try {
    const integration = await loadIntegration(service, "resend", "system", null);
    if (integration && !integration.enabled) return;
    const resendApiKey = (integration?.secrets as any)?.RESEND_API_KEY || Deno.env.get("RESEND_API_KEY") || null;
    if (!resendApiKey) return;

    const fromEmail =
      (integration?.config as any)?.from_email || Deno.env.get("RESEND_FROM_EMAIL") || "Cavendish GIG <noreply@cavendish.com.br>";
    const dataFormatada = slotStart.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromEmail,
      to: [lead.email],
      subject: `Reunião de fechamento confirmada — ${dataFormatada}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reunião de fechamento confirmada</h2>
          <p>Olá${lead.nome ? `, ${lead.nome}` : ""},</p>
          <p>Sua reunião de fechamento com a Cavendish Consultoria foi agendada para:</p>
          <p><strong>${dataFormatada}</strong></p>
          ${meetLink ? `<p><a href="${meetLink}">Link do Google Meet</a></p>` : ""}
          <p>Atenciosamente,<br/>Equipe Cavendish Consultoria</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[prospeccao-agendar-fechamento] falha ao enviar email de confirmação:", err);
  }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createServiceClient();
    const { data: roles } = await service.from("user_roles").select("role").eq("user_id", user.id);
    const roleNames = (roles ?? []).map((r: any) => r.role);
    const isAdmin = roleNames.includes("admin");
    if (!isAdmin && !roleNames.includes("representante")) {
      return new Response(JSON.stringify({ error: "Acesso restrito a representantes e administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leadId } = await req.json() as AgendarRequest;
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lead, error: erroLead } = await service.from("prospeccao_leads").select("*").eq("id", leadId).single();
    if (erroLead || !lead) {
      return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin && lead.responsavel_id !== user.id) {
      return new Response(JSON.stringify({ error: "Você só pode agendar reuniões dos seus próprios leads" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lead.status === "convertido" || lead.status === "perdido") {
      return new Response(JSON.stringify({ error: "Lead já está em um status final, não é possível agendar" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lead.reuniao_fechamento_id) {
      const { data: reuniaoExistente } = await service
        .from("reunioes")
        .select("id, status, data_inicio")
        .eq("id", lead.reuniao_fechamento_id)
        .maybeSingle();
      if (reuniaoExistente?.status === "agendada" && new Date(reuniaoExistente.data_inicio).getTime() > Date.now()) {
        return new Response(JSON.stringify({ error: "Lead já tem uma reunião de fechamento agendada" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const integration = await loadIntegration(service, "google-calendar", "system", null);
    const calendarId = (integration?.config as any)?.alberto_calendar_id as string | undefined;
    if (!calendarId) {
      return new Response(
        JSON.stringify({ error: "Calendário do Alberto não configurado (Admin → Integrações → Google Calendar)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const agora = new Date();
    const timeMin = new Date(agora.getTime() + MIN_ANTECEDENCIA_MS).toISOString();
    const timeMax = addDaysUtc(agora, 9).toISOString(); // cobre 5 dias úteis mesmo com fim de semana no meio

    let busy: BusyInterval[];
    try {
      const freebusy = await chamarGoogleCalendar("freebusy", { calendarId, timeMin, timeMax });
      busy = freebusy?.busy ?? [];
    } catch (err) {
      await logEdgeFunctionError("prospeccao-agendar-fechamento", err, { extra: { step: "freebusy", leadId } });
      return new Response(JSON.stringify({ error: "Falha ao consultar disponibilidade no Google Calendar" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slot = encontrarPrimeiroSlotLivre(busy, agora);

    if (!slot) {
      await notificarSemSlot(service, lead);
      return new Response(
        JSON.stringify({
          success: false,
          noSlot: true,
          message: `Nenhum horário disponível nos próximos ${JANELA_DIAS_UTEIS} dias úteis. O administrador foi notificado.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: representante } = await service.from("profiles").select("nome, email").eq("id", lead.responsavel_id).maybeSingle();

    const attendees = Array.from(
      new Set([calendarId, representante?.email, lead.email].filter((e): e is string => !!e)),
    );

    let eventoCriado: any;
    try {
      eventoCriado = await chamarGoogleCalendar("create", {
        calendarId,
        event: {
          summary: `Reunião de fechamento — ${lead.nome}`,
          description: `Reunião de fechamento comercial com ${lead.nome}.\n\nRepresentante: ${representante?.nome ?? "—"}\nCategoria: ${lead.categoria}`,
          startDateTime: slot.start.toISOString(),
          endDateTime: slot.end.toISOString(),
          attendees,
          timeZone: "America/Sao_Paulo",
        },
      });
    } catch (err) {
      await logEdgeFunctionError("prospeccao-agendar-fechamento", err, { extra: { step: "create-event", leadId } });
      return new Response(JSON.stringify({ error: "Falha ao criar o evento no Google Calendar" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meetLink: string | null = eventoCriado?.hangoutLink || eventoCriado?.conferenceData?.entryPoints?.[0]?.uri || null;

    const { data: reuniao, error: erroReuniao } = await service
      .from("reunioes")
      .insert({
        tipo: "fechamento_comercial",
        titulo: `Reunião de fechamento — ${lead.nome}`,
        descricao: `Agendada automaticamente pelo Finder para o lead "${lead.nome}".`,
        data_inicio: slot.start.toISOString(),
        data_fim: slot.end.toISOString(),
        lead_id: lead.id,
        representante_id: lead.responsavel_id,
        organizacao_id: null,
        google_event_id: eventoCriado?.id ?? null,
        link_video: meetLink,
        status: "agendada",
        criado_por: user.id,
      })
      .select()
      .single();

    if (erroReuniao || !reuniao) {
      await logEdgeFunctionError("prospeccao-agendar-fechamento", erroReuniao, { extra: { step: "insert-reuniao", leadId } });
      return new Response(JSON.stringify({ error: "Evento criado no Google Calendar, mas falhou ao gravar a reunião" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await service.from("prospeccao_leads").update({
      reuniao_fechamento_id: reuniao.id,
      status: "negociando",
    }).eq("id", lead.id);

    if (lead.telefone) {
      const whatsappConfig = await getWhatsAppConfig(service);
      if (whatsappConfig) {
        const dataFormatada = slot.start.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
        const mensagem = `Sua reunião de fechamento com a Cavendish Consultoria foi confirmada para ${dataFormatada}.${meetLink ? ` Link: ${meetLink}` : ""}`;
        const envio = await sendWhatsAppMessage(whatsappConfig, lead.telefone, mensagem);
        if (envio.success) {
          await service.from("prospeccao_conversas").insert({ lead_id: lead.id, role: "assistant", conteudo: mensagem, tipo: "texto" });
          await service.from("prospeccao_leads").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", lead.id);
        }
      }
    }

    await enviarEmailConfirmacao(service, lead, slot.start, meetLink);

    return new Response(
      JSON.stringify({ success: true, reuniaoId: reuniao.id, dataInicio: slot.start.toISOString(), meetLink }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await logEdgeFunctionError("prospeccao-agendar-fechamento", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
