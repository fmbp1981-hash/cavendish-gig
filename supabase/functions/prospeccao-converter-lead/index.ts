import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { marcarReuniaoRealizada, converterLeadOrganizacao, converterLeadParceiro } from "../_shared/prospeccao-conversao.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

// Conversão de lead do Finder (Fase 7) — disparada pelo botão "Converter" no drawer do lead.
// Roda com service role porque a criação de organização e o pré-registro de usuário exigem
// privilégios que um representante não tem via RLS direto (`organizacoes` só aceita INSERT de
// admin — ver "Admins can manage organizations"). A checagem de quem pode disparar a conversão
// (admin, ou representante dono do lead) é feita aqui antes de qualquer escrita.

interface ConverterRequest {
  leadId: string;
  action: "marcar_reuniao_realizada" | "converter_organizacao" | "converter_parceiro";
  nomeOrganizacao?: string;
  cnpj?: string;
  contatoNome?: string;
  contatoEmail?: string;
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

    const { leadId, action, ...dados } = await req.json() as ConverterRequest;
    if (!leadId || !action) {
      return new Response(JSON.stringify({ error: "leadId e action são obrigatórios" }), {
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
      return new Response(JSON.stringify({ error: "Você só pode converter seus próprios leads" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resultado;
    switch (action) {
      case "marcar_reuniao_realizada":
        resultado = await marcarReuniaoRealizada(service, lead);
        break;
      case "converter_organizacao":
        resultado = await converterLeadOrganizacao(service, lead, dados, user.id);
        break;
      case "converter_parceiro":
        resultado = await converterLeadParceiro(service, lead, dados, user.id);
        break;
      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!resultado.success) {
      return new Response(JSON.stringify({ error: resultado.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    await logEdgeFunctionError("prospeccao-converter-lead", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
