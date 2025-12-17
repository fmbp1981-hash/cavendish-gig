import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingDocument {
  organizacao_id: string;
  organizacao_nome: string;
  pending_count: number;
  emails: string[];
  user_names: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("document-reminders function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is meant to be executed by cron/automation. Require a shared secret.
    const expectedSecret = Deno.env.get("CRON_SECRET") || "";
    const providedSecret = req.headers.get("x-cron-secret") || "";
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find organizations with pending documents
    const { data: pendingDocs, error: pendingError } = await supabase
      .from("documentos_requeridos_status")
      .select(`
        documento_requerido_id,
        status,
        documentos_requeridos (
          nome,
          obrigatorio,
          projeto_id,
          projetos (
            organizacao_id,
            organizacoes (
              id,
              nome
            )
          )
        )
      `)
      .in("status", ["pendente", "rejeitado"]);

    if (pendingError) {
      console.error("Error fetching pending documents:", pendingError);
      throw pendingError;
    }

    // Group by organization
    const orgPending: Record<string, PendingDocument> = {};

    for (const doc of pendingDocs || []) {
      const docReq = doc.documentos_requeridos as any;
      if (!docReq?.obrigatorio) continue;

      const org = docReq?.projetos?.organizacoes as any;
      if (!org?.id) continue;

      if (!orgPending[org.id]) {
        orgPending[org.id] = {
          organizacao_id: org.id,
          organizacao_nome: org.nome,
          pending_count: 0,
          emails: [],
          user_names: [],
        };
      }

      orgPending[org.id].pending_count++;
    }

    // Get member emails for each organization
    for (const orgId of Object.keys(orgPending)) {
      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select(`
          user_id,
          profiles:user_id (
            email,
            nome
          )
        `)
        .eq("organizacao_id", orgId);

      if (!membersError && members) {
        for (const member of members) {
          const profile = member.profiles as any;
          if (profile?.email) {
            orgPending[orgId].emails.push(profile.email);
            if (profile.nome) {
              orgPending[orgId].user_names.push(profile.nome);
            }
          }
        }
      }
    }

    // Send reminder emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailsSent = 0;
    const errors: string[] = [];

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      for (const org of Object.values(orgPending)) {
        if (org.pending_count > 0 && org.emails.length > 0) {
          console.log(`Sending reminder to ${org.organizacao_nome}: ${org.pending_count} pending docs`);

          try {
            const to = org.emails[0];
            const pendingCount = org.pending_count;
            const userName = org.user_names[0] || undefined;

            const subject = `📋 Lembrete: ${pendingCount} documentos pendentes`;
            const html = `
              <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="margin:0 0 12px 0;">📋 Documentos Pendentes</h2>
                <p>Olá${userName ? `, ${userName}` : ''},</p>
                <p>Você possui <strong>${pendingCount}</strong> documentos pendentes para envio.</p>
                <p>Atenciosamente,<br/><strong>Equipe Cavendish GIG</strong></p>
              </div>
            `;

            const sendResult = await resend.emails.send({
              from: "Cavendish GIG <noreply@cavendishgig.com>",
              to: [to],
              subject,
              html,
            });

            if (!sendResult.data?.id) {
              errors.push(`${org.organizacao_nome}: falha ao enviar email`);
            } else {
              emailsSent++;
            }
          } catch (e: any) {
            errors.push(`${org.organizacao_nome}: ${e.message}`);
          }
        }
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email sending");
    }

    const summary = {
      organizationsWithPending: Object.keys(orgPending).length,
      totalPendingDocuments: Object.values(orgPending).reduce((sum, o) => sum + o.pending_count, 0),
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Reminder job completed:", summary);

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in document-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
