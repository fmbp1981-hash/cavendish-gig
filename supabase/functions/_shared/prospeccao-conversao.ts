import { Resend } from "https://esm.sh/resend@2.0.0";
import { loadIntegration } from "./integrations.ts";
import { getWhatsAppConfig, sendWhatsAppMessage } from "./whatsapp-provider.ts";

// Lógica de conversão de lead do Finder (Fase 7) — compartilhada entre a Edge Function
// `prospeccao-converter-lead` (disparo humano via UI) e as tools do agente de IA
// (`_shared/prospeccao-tools.ts`), pra não duplicar uma lógica de negócio sensível (criação de
// organização + pré-registro de usuário) em dois lugares.
//
// Achado importante da investigação desta fase: não existe no projeto nenhum mecanismo de
// convite/criação de usuário server-side (sem `auth.admin.createUser`, sem envio de email de
// convite). O único mecanismo existente é `user_pre_registrations` — um admin pré-associa um
// email a um `role`, e quando essa pessoa se cadastra sozinha (fluxo público de signup já
// existente), o trigger `handle_new_user()` aplica o role automaticamente. Esse mecanismo nunca
// vinculava a uma organização (só role) — estendido aqui com uma coluna `organizacao_id` nullable
// (migration desta fase) + trigger atualizado pra também inserir em `organization_members` quando
// presente. Não inventamos um sistema de convite por email novo — só preenchemos essa lacuna
// mínima no que já existia.

export interface ConversaoResultado {
  success: boolean;
  error?: string;
  organizacaoId?: string;
}

export async function marcarReuniaoRealizada(service: any, lead: Record<string, any>): Promise<ConversaoResultado> {
  if (!lead.reuniao_fechamento_id) {
    return { success: false, error: "Lead não tem reunião de fechamento agendada" };
  }
  const { error } = await service.from("reunioes").update({ status: "realizada" }).eq("id", lead.reuniao_fechamento_id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function upsertPreRegistration(
  service: any,
  email: string,
  nome: string | null,
  role: "cliente" | "parceiro",
  organizacaoId: string | null,
  criadoPor: string | null,
): Promise<{ error?: string }> {
  const emailNormalizado = email.toLowerCase().trim();
  const { data: existente } = await service
    .from("user_pre_registrations")
    .select("id")
    .eq("email", emailNormalizado)
    .is("used_at", null)
    .maybeSingle();

  if (existente) {
    const { error } = await service
      .from("user_pre_registrations")
      .update({ nome, role, organizacao_id: organizacaoId })
      .eq("id", existente.id);
    return { error: error?.message };
  }

  const { error } = await service.from("user_pre_registrations").insert({
    email: emailNormalizado,
    nome,
    role,
    organizacao_id: organizacaoId,
    created_by: criadoPor,
  });
  return { error: error?.message };
}

async function notificarContato(service: any, lead: Record<string, any>, email: string): Promise<void> {
  const mensagem = `Você foi cadastrado(a) no Sistema GIG da Cavendish Consultoria com o email ${email}. Acesse a plataforma e crie sua senha usando este mesmo email para ativar seu acesso.`;

  if (lead.telefone) {
    const whatsappConfig = await getWhatsAppConfig(service);
    if (whatsappConfig) {
      await sendWhatsAppMessage(whatsappConfig, lead.telefone, mensagem);
    }
  }

  try {
    const integration = await loadIntegration(service, "resend", "system", null);
    if (integration && !integration.enabled) return;
    const resendApiKey = (integration?.secrets as any)?.RESEND_API_KEY || Deno.env.get("RESEND_API_KEY") || null;
    if (!resendApiKey) return;
    const fromEmail =
      (integration?.config as any)?.from_email || Deno.env.get("RESEND_FROM_EMAIL") || "Cavendish GIG <noreply@cavendish.com.br>";
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Seu acesso ao Sistema GIG está pronto",
      html: `<p>${mensagem}</p>`,
    });
  } catch (err) {
    console.error("[prospeccao-conversao] falha ao enviar email de boas-vindas:", err);
  }
}

interface DadosConversaoOrganizacao {
  nomeOrganizacao?: string;
  cnpj?: string;
  contatoNome?: string;
  contatoEmail?: string;
}

export async function converterLeadOrganizacao(
  service: any,
  lead: Record<string, any>,
  dados: DadosConversaoOrganizacao,
  criadoPor: string | null,
): Promise<ConversaoResultado> {
  if (lead.status === "convertido" || lead.status === "perdido") {
    return { success: false, error: "Lead já está em um status final" };
  }
  if (lead.organizacao_id) {
    return { success: false, error: "Lead já está vinculado a uma organização" };
  }
  if (!lead.reuniao_fechamento_id) {
    return { success: false, error: "Lead não tem reunião de fechamento agendada" };
  }

  const { data: reuniao } = await service
    .from("reunioes")
    .select("status")
    .eq("id", lead.reuniao_fechamento_id)
    .maybeSingle();
  if (reuniao?.status !== "realizada") {
    return { success: false, error: "A reunião de fechamento ainda não foi marcada como realizada" };
  }

  const contatoEmail = dados.contatoEmail?.trim() || lead.email;
  if (!contatoEmail) {
    return { success: false, error: "Informe o email do contato para criar o acesso" };
  }

  const { data: organizacao, error: erroOrg } = await service
    .from("organizacoes")
    .insert({ nome: dados.nomeOrganizacao?.trim() || lead.nome, cnpj: dados.cnpj?.trim() || lead.cnpj || null })
    .select()
    .single();
  if (erroOrg || !organizacao) return { success: false, error: erroOrg?.message ?? "Falha ao criar organização" };

  const { error: erroPreReg } = await upsertPreRegistration(
    service,
    contatoEmail,
    dados.contatoNome?.trim() || lead.nome,
    "cliente",
    organizacao.id,
    criadoPor,
  );
  if (erroPreReg) return { success: false, error: erroPreReg };

  const { error: erroLead } = await service
    .from("prospeccao_leads")
    .update({ organizacao_id: organizacao.id, status: "convertido" })
    .eq("id", lead.id);
  if (erroLead) return { success: false, error: erroLead.message };

  await notificarContato(service, lead, contatoEmail);

  return { success: true, organizacaoId: organizacao.id };
}

interface DadosConversaoParceiro {
  contatoNome?: string;
  contatoEmail?: string;
}

export async function converterLeadParceiro(
  service: any,
  lead: Record<string, any>,
  dados: DadosConversaoParceiro,
  criadoPor: string | null,
): Promise<ConversaoResultado> {
  if (lead.categoria !== "parceiro_indicador") {
    return { success: false, error: "Conversão para parceiro só se aplica à categoria parceiro_indicador" };
  }
  if (lead.status === "convertido" || lead.status === "perdido") {
    return { success: false, error: "Lead já está em um status final" };
  }

  const contatoEmail = dados.contatoEmail?.trim() || lead.email;
  if (!contatoEmail) {
    return { success: false, error: "Informe o email do contato para criar o acesso" };
  }

  const { error: erroPreReg } = await upsertPreRegistration(
    service,
    contatoEmail,
    dados.contatoNome?.trim() || lead.nome,
    "parceiro",
    null,
    criadoPor,
  );
  if (erroPreReg) return { success: false, error: erroPreReg };

  const { error: erroLead } = await service.from("prospeccao_leads").update({ status: "convertido" }).eq("id", lead.id);
  if (erroLead) return { success: false, error: erroLead.message };

  await notificarContato(service, lead, contatoEmail);

  return { success: true };
}
