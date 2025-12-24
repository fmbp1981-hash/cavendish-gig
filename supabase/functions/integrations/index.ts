import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";
import { encryptJsonAesGcm, importAesGcmKeyFromEnv } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type IntegrationScope = "system" | "organization";

type Action = "list" | "upsert" | "delete";

interface IntegrationListItem {
  provider: string;
  scope: IntegrationScope;
  organizacao_id: string | null;
  enabled: boolean;
  configured: boolean;
  updated_at: string;
  config: Record<string, unknown>;
}

interface IntegrationsRequest {
  action: Action;
  scope?: IntegrationScope;
  organizacao_id?: string | null;
  provider?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
}

async function isUserAdminOrConsultor(userClient: any, userId: string) {
  const [{ data: isAdmin }, { data: isConsultor }] = await Promise.all([
    userClient.rpc("has_role", { _user_id: userId, _role: "admin" }),
    userClient.rpc("has_role", { _user_id: userId, _role: "consultor" }),
  ]);

  return {
    isAdmin: !!isAdmin,
    isConsultor: !!isConsultor || !!isAdmin,
  };
}

async function canConsultorAccessOrg(service: any, consultorId: string, organizacaoId: string) {
  const { count: assignmentsCount, error: countErr } = await service
    .from("consultor_organizacoes")
    .select("id", { count: "exact", head: true })
    .eq("consultor_id", consultorId);

  if (countErr) throw countErr;

  // Fallback behavior used elsewhere: if no assignments exist at all, allow.
  if ((assignmentsCount ?? 0) === 0) return true;

  const { data, error } = await service
    .from("consultor_organizacoes")
    .select("id")
    .eq("consultor_id", consultorId)
    .eq("organizacao_id", organizacaoId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createUserClient(authHeader);

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { isAdmin, isConsultor } = await isUserAdminOrConsultor(userClient, user.id);

    if (!isAdmin && !isConsultor) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: IntegrationsRequest = await req.json();
    const action = body.action;

    const scope: IntegrationScope = body.scope || "system";
    const organizacaoId = body.organizacao_id ?? null;

    if (scope === "system" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas admins podem gerenciar integrações do sistema" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createServiceClient();

    if (scope === "organization" && organizacaoId && !isAdmin) {
      const allowed = await canConsultorAccessOrg(service, user.id, organizacaoId);
      if (!allowed) {
        return new Response(JSON.stringify({ error: "Acesso negado para esta organização" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    switch (action) {
      case "list": {
        let query = service.from("integrations").select("provider, scope, organizacao_id, enabled, config, secrets_encrypted, updated_at");

        if (scope) query = query.eq("scope", scope);
        if (scope === "organization") query = query.eq("organizacao_id", organizacaoId);

        const { data, error } = await query.order("provider", { ascending: true });
        if (error) throw error;

        const items: IntegrationListItem[] = (data || []).map((row: any) => ({
          provider: row.provider,
          scope: row.scope,
          organizacao_id: row.organizacao_id,
          enabled: !!row.enabled,
          configured:
            !!row.secrets_encrypted || (row.config && Object.keys(row.config).length > 0),
          updated_at: row.updated_at,
          config: row.config || {},
        }));

        return new Response(JSON.stringify({ data: items }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upsert": {
        if (!body.provider) {
          return new Response(JSON.stringify({ error: "provider é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const enabled = body.enabled;
        const config = body.config;

        let secretsEncrypted: string | undefined;
        if (body.secrets && Object.keys(body.secrets).length > 0) {
          const cryptoKey = await importAesGcmKeyFromEnv("INTEGRATIONS_ENCRYPTION_KEY");
          secretsEncrypted = await encryptJsonAesGcm(cryptoKey, body.secrets);
        }

        const payload: any = {
          scope,
          organizacao_id: scope === "organization" ? organizacaoId : null,
          provider: body.provider,
          ...(secretsEncrypted ? { secrets_encrypted: secretsEncrypted } : {}),
        };

        if (typeof enabled === "boolean") payload.enabled = enabled;
        if (typeof config !== "undefined") payload.config = config;
        if (secretsEncrypted) payload.secrets_version = 1;

        const { data, error } = await service
          .from("integrations")
          .upsert(payload, {
            onConflict: "scope,organizacao_id,provider",
          })
          .select("provider, scope, organizacao_id, enabled, config, secrets_encrypted, updated_at")
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            data: {
              provider: data.provider,
              scope: data.scope,
              organizacao_id: data.organizacao_id,
              enabled: data.enabled,
              configured:
                !!data.secrets_encrypted || (data.config && Object.keys(data.config).length > 0),
              updated_at: data.updated_at,
              config: data.config || {},
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      case "delete": {
        if (!body.provider) {
          return new Response(JSON.stringify({ error: "provider é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let del = service.from("integrations").delete().eq("provider", body.provider).eq("scope", scope);
        if (scope === "organization") del = del.eq("organizacao_id", organizacaoId);

        const { error } = await del;
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("integrations function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
