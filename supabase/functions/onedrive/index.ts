import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

interface DriveRequest {
  action: "createFolder" | "createClientStructure" | "listFolders" | "shareFolder" | "uploadFile" | "getFile" | "getEmbedLink";
  parentFolderId?: string;
  folderName?: string;
  clientName?: string;
  organizacaoId?: string;
  email?: string;
  folderId?: string;
  fileId?: string;
  role?: "reader" | "writer";
  fileData?: string; // base64 encoded
  fileName?: string;
  mimeType?: string;
}

interface DriveItem {
  id: string;
  name: string;
  webUrl: string;
  folder?: object;
}

interface AzureConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

async function getMicrosoftToken(cfg: AzureConfig): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to obtain Microsoft token: ${err}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in Microsoft response");
  return data.access_token;
}

async function graphFetch(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

async function getSharePointDriveId(token: string): Promise<string> {
  const res = await graphFetch(token, "/sites/root/drive");
  if (!res.ok) throw new Error(`Failed to get SharePoint drive: ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}

async function resolveParentId(token: string, driveId: string, baseFolderPath: string | null): Promise<string | null> {
  if (!baseFolderPath) return null;
  const encoded = encodeURIComponent(baseFolderPath);
  const res = await graphFetch(token, `/drives/${driveId}/root:/${encoded}`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.id as string) || null;
}

async function createFolder(
  token: string,
  driveId: string,
  name: string,
  parentId: string | null
): Promise<DriveItem> {
  const endpoint = parentId
    ? `/drives/${driveId}/items/${parentId}/children`
    : `/drives/${driveId}/root/children`;

  const res = await graphFetch(token, endpoint, {
    method: "POST",
    body: JSON.stringify({ name, folder: {}, "@microsoft.graph.conflictBehavior": "rename" }),
  });

  if (!res.ok) throw new Error(`Failed to create folder "${name}": ${await res.text()}`);
  return res.json() as Promise<DriveItem>;
}

async function createClientFolderStructure(
  token: string,
  driveId: string,
  clientName: string,
  baseFolderPath: string | null
): Promise<{ rootFolder: DriveItem; subfolders: Record<string, DriveItem> }> {
  const parentId = await resolveParentId(token, driveId, baseFolderPath);
  const rootFolder = await createFolder(token, driveId, clientName, parentId);

  const subfolderNames = [
    "01 - Documentos Recebidos",
    "02 - Diagnóstico",
    "03 - Políticas e Procedimentos",
    "04 - Código de Ética",
    "05 - Atas e Reuniões",
    "06 - Treinamentos",
    "07 - Relatórios",
    "08 - Canal de Denúncias",
  ];

  const subfolders: Record<string, DriveItem> = {};
  for (const name of subfolderNames) {
    const folder = await createFolder(token, driveId, name, rootFolder.id);
    subfolders[name] = folder;
  }

  return { rootFolder, subfolders };
}

async function listFolders(token: string, driveId: string, parentId: string | null): Promise<DriveItem[]> {
  const endpoint = parentId
    ? `/drives/${driveId}/items/${parentId}/children?$filter=folder ne null&$select=id,name,webUrl,folder`
    : `/drives/${driveId}/root/children?$filter=folder ne null&$select=id,name,webUrl,folder`;

  const res = await graphFetch(token, endpoint);
  if (!res.ok) throw new Error(`Failed to list folders: ${await res.text()}`);
  const data = await res.json();
  return (data.value || []) as DriveItem[];
}

async function shareFolder(
  token: string,
  driveId: string,
  itemId: string,
  email: string,
  role: "reader" | "writer"
): Promise<void> {
  const graphRole = role === "writer" ? "write" : "read";

  const res = await graphFetch(token, `/drives/${driveId}/items/${itemId}/invite`, {
    method: "POST",
    body: JSON.stringify({
      recipients: [{ email }],
      roles: [graphRole],
      sendInvitation: true,
      message: "Você recebeu acesso à pasta de documentos no OneDrive.",
    }),
  });

  if (!res.ok) throw new Error(`Failed to share folder: ${await res.text()}`);
}

async function uploadFile(
  token: string,
  driveId: string,
  fileName: string,
  fileData: string, // base64
  mimeType: string,
  parentId: string | null
): Promise<DriveItem> {
  const binary = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

  const endpoint = parentId
    ? `/drives/${driveId}/items/${parentId}:/${encodeURIComponent(fileName)}:/content`
    : `/drives/${driveId}/root:/${encodeURIComponent(fileName)}:/content`;

  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
    },
    body: binary,
  });

  if (!res.ok) throw new Error(`Failed to upload file: ${await res.text()}`);
  return res.json() as Promise<DriveItem>;
}

async function getFileInfo(token: string, driveId: string, fileId: string): Promise<DriveItem & Record<string, unknown>> {
  const res = await graphFetch(
    token,
    `/drives/${driveId}/items/${fileId}?$select=id,name,webUrl,mimeType,size,lastModifiedDateTime,file,folder`
  );
  if (!res.ok) throw new Error(`Failed to get file: ${await res.text()}`);
  return res.json();
}

async function getEmbedLink(
  token: string,
  driveId: string,
  fileId: string
): Promise<{ embedLink: string; viewLink: string }> {
  const res = await graphFetch(token, `/drives/${driveId}/items/${fileId}/preview`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (res.ok) {
    const data = await res.json();
    return {
      embedLink: (data.getUrl as string) || "",
      viewLink: (data.getUrl as string) || "",
    };
  }

  // Fallback: use webUrl from item metadata
  const item = await getFileInfo(token, driveId, fileId);
  return { embedLink: item.webUrl, viewLink: item.webUrl };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("onedrive function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request: DriveRequest = await req.json();

    const [{ data: isAdmin }, { data: isConsultor }, { data: isCliente }] = await Promise.all([
      authClient.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      authClient.rpc("has_role", { _user_id: user.id, _role: "consultor" }),
      authClient.rpc("has_role", { _user_id: user.id, _role: "cliente" }),
    ]);

    const isUploadAction = request.action === "uploadFile";

    const canManageOwnOrgDrive =
      isCliente &&
      (request.action === "createClientStructure" || isUploadAction) &&
      !!request.organizacaoId &&
      !!(
        await authClient
          .from("organization_members")
          .select("organizacao_id")
          .eq("organizacao_id", request.organizacaoId)
          .eq("user_id", user.id)
          .maybeSingle()
      ).data;

    if (!isAdmin && !isConsultor && !(isCliente && canManageOwnOrgDrive)) {
      return new Response(
        JSON.stringify({ error: "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const service = createServiceClient();
    const integration = await loadIntegration(service, "onedrive", "system", null);

    if (!integration || !integration.enabled) {
      return new Response(
        JSON.stringify({ error: "OneDrive integration not configured or disabled" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const secrets = integration.secrets as Record<string, string> | null;
    const clientId = secrets?.AZURE_CLIENT_ID || Deno.env.get("AZURE_CLIENT_ID") || "";
    const clientSecret = secrets?.AZURE_CLIENT_SECRET || Deno.env.get("AZURE_CLIENT_SECRET") || "";
    const tenantId = secrets?.AZURE_TENANT_ID || Deno.env.get("AZURE_TENANT_ID") || "";

    if (!clientId || !clientSecret || !tenantId) {
      return new Response(
        JSON.stringify({ error: "OneDrive credentials not configured (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const azureConfig: AzureConfig = { clientId, clientSecret, tenantId };
    const accessToken = await getMicrosoftToken(azureConfig);
    const driveId = await getSharePointDriveId(accessToken);

    // Load base folder path from system settings
    const { data: baseFolderSetting } = await service
      .from("system_settings")
      .select("value")
      .eq("key", "onedrive_base_folder_path")
      .maybeSingle();
    const baseFolderPath = (baseFolderSetting?.value as string) || null;

    let result: unknown;

    switch (request.action) {
      case "createFolder": {
        if (!request.folderName) throw new Error("folderName is required");
        result = await createFolder(accessToken, driveId, request.folderName, request.parentFolderId || null);
        console.log("OneDrive folder created:", (result as DriveItem).id);
        break;
      }

      case "createClientStructure": {
        if (!request.clientName || !request.organizacaoId) {
          throw new Error("clientName and organizacaoId are required");
        }

        // Use explicit parentFolderId if provided, otherwise resolve from system setting
        const parentId = request.parentFolderId
          || await resolveParentId(accessToken, driveId, baseFolderPath);

        result = await createClientFolderStructure(
          accessToken,
          driveId,
          request.clientName,
          parentId ? null : baseFolderPath // pass path only if parentId not resolved yet
        );

        const structured = result as { rootFolder: DriveItem; subfolders: Record<string, DriveItem> };
        const { error: updateOrgError } = await service
          .from("organizacoes")
          .update({
            drive_folder_id: structured.rootFolder.id,
            drive_folder_url: structured.rootFolder.webUrl,
          })
          .eq("id", request.organizacaoId);

        if (updateOrgError) {
          throw new Error(`Failed to persist OneDrive folder on organization: ${updateOrgError.message}`);
        }

        console.log("OneDrive client structure created:", structured.rootFolder.id);
        break;
      }

      case "listFolders": {
        result = await listFolders(accessToken, driveId, request.parentFolderId || null);
        console.log("OneDrive folders listed:", (result as DriveItem[]).length);
        break;
      }

      case "shareFolder": {
        if (!request.folderId || !request.email) {
          throw new Error("folderId and email are required");
        }
        await shareFolder(accessToken, driveId, request.folderId, request.email, request.role || "reader");
        result = { success: true, message: "Folder shared successfully" };
        console.log("OneDrive folder shared:", request.folderId);
        break;
      }

      case "uploadFile": {
        if (!request.fileName || !request.fileData || !request.mimeType) {
          throw new Error("fileName, fileData, and mimeType are required");
        }
        result = await uploadFile(
          accessToken,
          driveId,
          request.fileName,
          request.fileData,
          request.mimeType,
          request.parentFolderId || null
        );
        console.log("OneDrive file uploaded:", (result as DriveItem).id);
        break;
      }

      case "getFile": {
        if (!request.fileId) throw new Error("fileId is required");
        result = await getFileInfo(accessToken, driveId, request.fileId);
        console.log("OneDrive file info retrieved:", request.fileId);
        break;
      }

      case "getEmbedLink": {
        if (!request.fileId) throw new Error("fileId is required");
        result = await getEmbedLink(accessToken, driveId, request.fileId);
        console.log("OneDrive embed link generated:", request.fileId);
        break;
      }

      default:
        throw new Error(`Unknown action: ${(request as DriveRequest).action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in onedrive function:", error);
    await logEdgeFunctionError("onedrive", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
