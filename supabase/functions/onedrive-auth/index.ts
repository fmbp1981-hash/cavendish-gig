import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { encryptJsonAesGcm, importAesGcmKeyFromEnv } from "../_shared/crypto.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// For M365 Personal accounts
const MS_TENANT = "consumers";
const MS_OAUTH_BASE = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0`;
const ONEDRIVE_SCOPES = "Files.ReadWrite offline_access";

interface InitRequest {
  action: "init";
  state: string;
  redirect_uri: string;
}

interface CallbackRequest {
  action: "callback";
  code: string;
  redirect_uri: string;
}

type AuthRequest = InitRequest | CallbackRequest;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado — apenas admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AuthRequest = await req.json();
    const service = createServiceClient();

    if (body.action === "init") {
      const integration = await loadIntegration(service, "onedrive", "system", null);

      if (!integration?.secrets) {
        return new Response(
          JSON.stringify({
            error:
              "OneDrive não configurado. Salve o AZURE_CLIENT_ID e AZURE_CLIENT_SECRET primeiro.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secrets = integration.secrets as Record<string, string>;
      const clientId = secrets.AZURE_CLIENT_ID;

      if (!clientId) {
        return new Response(JSON.stringify({ error: "AZURE_CLIENT_ID não encontrado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: body.redirect_uri,
        scope: ONEDRIVE_SCOPES,
        response_mode: "query",
        state: body.state,
      });

      const authUrl = `${MS_OAUTH_BASE}/authorize?${params}`;

      return new Response(JSON.stringify({ authUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "callback") {
      const integration = await loadIntegration(service, "onedrive", "system", null);

      if (!integration?.secrets) {
        return new Response(JSON.stringify({ error: "OneDrive não configurado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const secrets = integration.secrets as Record<string, string>;
      const clientId = secrets.AZURE_CLIENT_ID;
      const clientSecret = secrets.AZURE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: "AZURE_CLIENT_ID ou AZURE_CLIENT_SECRET não encontrados" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Exchange authorization code for tokens
      const tokenBody = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: body.code,
        redirect_uri: body.redirect_uri,
        scope: ONEDRIVE_SCOPES,
      });

      const tokenRes = await fetch(`${MS_OAUTH_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody,
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Falha na troca de código OAuth: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const refreshToken = tokenData.refresh_token as string | undefined;

      if (!refreshToken) {
        throw new Error(
          "Microsoft não retornou refresh_token. Verifique se 'offline_access' está nas permissões."
        );
      }

      // Merge refresh_token into existing secrets and re-encrypt
      const updatedSecrets = { ...secrets, AZURE_REFRESH_TOKEN: refreshToken };
      const cryptoKey = await importAesGcmKeyFromEnv("INTEGRATIONS_ENCRYPTION_KEY");
      const secretsEncrypted = await encryptJsonAesGcm(cryptoKey, updatedSecrets);

      const existingConfig = (integration.config as Record<string, unknown>) || {};
      const { error: dbError } = await service
        .from("integrations")
        .update({
          secrets_encrypted: secretsEncrypted,
          config: {
            ...existingConfig,
            oauth_authorized: true,
            oauth_authorized_at: new Date().toISOString(),
          },
        })
        .eq("provider", "onedrive")
        .eq("scope", "system")
        .is("organizacao_id", null);

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in onedrive-auth:", error);
    await logEdgeFunctionError("onedrive-auth", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
