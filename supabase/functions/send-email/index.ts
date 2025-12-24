import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "documento_aprovado" | "documento_rejeitado" | "documento_enviado" | "lembrete_documentos";
  to: string;
  data: {
    documentoNome?: string;
    organizacaoNome?: string;
    observacao?: string;
    userName?: string;
    pendingCount?: number;
  };
}

const getEmailTemplate = (type: string, data: EmailRequest["data"]) => {
  const templates: Record<string, { subject: string; html: string }> = {
    documento_aprovado: {
      subject: `✅ Documento aprovado: ${data.documentoNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
            .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Documento Aprovado</h1>
            </div>
            <div class="content">
              <span class="badge">Aprovado</span>
              <p>Olá${data.userName ? `, ${data.userName}` : ''},</p>
              <p>Temos boas notícias! O documento <strong>"${data.documentoNome}"</strong> foi analisado e <strong>aprovado</strong> pela nossa equipe.</p>
              <div class="info-box">
                <strong>Próximos passos:</strong><br>
                Continue enviando os documentos pendentes para avançar no projeto.
              </div>
              <p>Atenciosamente,<br><strong>Equipe Cavendish GIG</strong></p>
            </div>
            <div class="footer">
              Este é um email automático. Por favor, não responda diretamente.
            </div>
          </div>
        </body>
        </html>
      `,
    },
    documento_rejeitado: {
      subject: `⚠️ Documento precisa de ajustes: ${data.documentoNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
            .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Ajuste Necessário</h1>
            </div>
            <div class="content">
              <span class="badge">Requer Ajuste</span>
              <p>Olá${data.userName ? `, ${data.userName}` : ''},</p>
              <p>O documento <strong>"${data.documentoNome}"</strong> foi analisado e precisa de alguns ajustes antes de ser aprovado.</p>
              ${data.observacao ? `
              <div class="reason-box">
                <strong>Motivo:</strong><br>
                ${data.observacao}
              </div>
              ` : ''}
              <p>Por favor, faça as correções necessárias e envie o documento novamente.</p>
              <p>Atenciosamente,<br><strong>Equipe Cavendish GIG</strong></p>
            </div>
            <div class="footer">
              Este é um email automático. Por favor, não responda diretamente.
            </div>
          </div>
        </body>
        </html>
      `,
    },
    documento_enviado: {
      subject: `📄 Novo documento enviado: ${data.documentoNome} - ${data.organizacaoNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #0b66c3, #1e40af); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
            .info-box { background: #eff6ff; border-left: 4px solid #0b66c3; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Novo Documento</h1>
            </div>
            <div class="content">
              <span class="badge">Para Análise</span>
              <p>Olá,</p>
              <p>Um novo documento foi enviado e está aguardando sua análise.</p>
              <div class="info-box">
                <strong>Documento:</strong> ${data.documentoNome}<br>
                <strong>Organização:</strong> ${data.organizacaoNome}
              </div>
              <p>Acesse o sistema para analisar e aprovar/rejeitar o documento.</p>
              <p>Atenciosamente,<br><strong>Sistema Cavendish GIG</strong></p>
            </div>
            <div class="footer">
              Este é um email automático. Por favor, não responda diretamente.
            </div>
          </div>
        </body>
        </html>
      `,
    },
    lembrete_documentos: {
      subject: `📋 Lembrete: ${data.pendingCount} documentos pendentes`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
            .counter { font-size: 48px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Documentos Pendentes</h1>
            </div>
            <div class="content">
              <span class="badge">Lembrete</span>
              <p>Olá${data.userName ? `, ${data.userName}` : ''},</p>
              <p>Você ainda possui documentos pendentes de envio:</p>
              <div class="counter">${data.pendingCount}</div>
              <p style="text-align: center;">documentos aguardando</p>
              <p>Acesse o sistema para visualizar e enviar os documentos necessários para avançar no projeto.</p>
              <p>Atenciosamente,<br><strong>Equipe Cavendish GIG</strong></p>
            </div>
            <div class="footer">
              Este é um email automático. Por favor, não responda diretamente.
            </div>
          </div>
        </body>
        </html>
      `,
    },
  };

  return templates[type] || templates.documento_enviado;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authorization (JWT is enforced by verify_jwt, but we still check role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [{ data: isAdmin }, { data: isConsultor }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "consultor" }),
    ]);

    if (!isAdmin && !isConsultor) {
      return new Response(
        JSON.stringify({ error: "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const service = createServiceClient();
    const integration = await loadIntegration(service, "resend", "system", null);

    if (integration && !integration.enabled) {
      return new Response(
        JSON.stringify({ error: "Email service disabled" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let resendApiKey = (integration?.secrets as any)?.RESEND_API_KEY || Deno.env.get("RESEND_API_KEY") || null;
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const { type, to, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email`);

    const template = getEmailTemplate(type, data);

    const emailResponse = await resend.emails.send({
      from: "Cavendish GIG <noreply@cavendishgig.com>",
      to: [to],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
