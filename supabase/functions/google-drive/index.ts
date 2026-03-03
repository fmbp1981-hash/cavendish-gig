import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";
import { logEdgeFunctionError } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriveRequest {
  action: "createFolder" | "createClientStructure" | "listFolders" | "shareFolder" | "uploadFile" | "getFile" | "getEmbedLink";
  parentFolderId?: string;
  folderName?: string;
  clientName?: string;
  email?: string;
  folderId?: string;
  fileId?: string;
  role?: "reader" | "writer" | "commenter";
  fileData?: string; // base64 encoded file
  fileName?: string;
  mimeType?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${claimB64}`;

  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    console.error("Token response:", tokenData);
    throw new Error("Failed to get access token");
  }

  return tokenData.access_token;
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<DriveFolder> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  
  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create folder: ${error}`);
  }

  const folder = await response.json();
  
  // Get the web view link
  const detailsResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folder.id}?fields=id,name,webViewLink`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  return await detailsResponse.json();
}

async function shareFolder(
  accessToken: string,
  folderId: string,
  email: string,
  role: "reader" | "writer" | "commenter"
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "user",
        role,
        emailAddress: email,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to share folder: ${error}`);
  }
}

async function createClientFolderStructure(
  accessToken: string,
  clientName: string,
  baseFolderId?: string
): Promise<{
  rootFolder: DriveFolder;
  subfolders: Record<string, DriveFolder>;
}> {
  // Create main client folder
  const rootFolder = await createFolder(accessToken, clientName, baseFolderId);
  
  // Create standard subfolders structure
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

  const subfolders: Record<string, DriveFolder> = {};
  
  for (const name of subfolderNames) {
    const folder = await createFolder(accessToken, name, rootFolder.id);
    subfolders[name] = folder;
  }

  return { rootFolder, subfolders };
}

async function listFolders(
  accessToken: string,
  parentId?: string
): Promise<DriveFolder[]> {
  const query = parentId
    ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list folders: ${error}`);
  }

  const data = await response.json();
  return data.files || [];
}

async function uploadFile(
  accessToken: string,
  fileName: string,
  fileData: string, // base64 encoded
  mimeType: string,
  folderId?: string
): Promise<DriveFolder> {
  // Decode base64
  const binaryString = atob(fileData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create metadata
  const metadata = {
    name: fileName,
    ...(folderId && { parents: [folderId] }),
  };

  // Create multipart request body
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const encoder = new TextEncoder();

  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const dataPart = delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileData;

  const multipartBody = encoder.encode(metadataPart + dataPart + closeDelimiter);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("google-drive function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authorization (JWT is enforced by verify_jwt, but we also check role)
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
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

    const [{ data: isAdmin }, { data: isConsultor }] = await Promise.all([
      authClient.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      authClient.rpc("has_role", { _user_id: user.id, _role: "consultor" }),
    ]);
    if (!isAdmin && !isConsultor) {
      return new Response(
        JSON.stringify({ error: "Acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const service = createServiceClient();
    const integration = await loadIntegration(service, "google-drive", "system", null);

    if (integration && !integration.enabled) {
      return new Response(
        JSON.stringify({ error: "Google Drive integration disabled" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const secrets = integration?.secrets as any;
    const serviceAccountJson = secrets?.GOOGLE_SERVICE_ACCOUNT || Deno.env.get("GOOGLE_SERVICE_ACCOUNT") || "";

    if (!serviceAccountJson) {
      console.error("GOOGLE_SERVICE_ACCOUNT not configured");
      return new Response(
        JSON.stringify({ error: "Google Drive integration not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const request: DriveRequest = await req.json();
    const accessToken = await getAccessToken(serviceAccountJson);

    let result;

    switch (request.action) {
      case "createFolder":
        if (!request.folderName) throw new Error("folderName is required");
        result = await createFolder(accessToken, request.folderName, request.parentFolderId);
        console.log("Folder created:", result.id);
        break;

      case "createClientStructure":
        if (!request.clientName) throw new Error("clientName is required");
        result = await createClientFolderStructure(
          accessToken, 
          request.clientName,
          request.parentFolderId
        );
        console.log("Client structure created:", result.rootFolder.id);
        break;

      case "listFolders":
        result = await listFolders(accessToken, request.parentFolderId);
        console.log("Folders listed:", result.length);
        break;

      case "shareFolder":
        if (!request.folderId || !request.email) {
          throw new Error("folderId and email are required");
        }
        await shareFolder(
          accessToken,
          request.folderId,
          request.email,
          request.role || "reader"
        );
        result = { success: true, message: "Folder shared successfully" };
        console.log("Folder shared:", request.folderId);
        break;

      case "uploadFile":
        if (!request.fileName || !request.fileData || !request.mimeType) {
          throw new Error("fileName, fileData, and mimeType are required");
        }
        result = await uploadFile(
          accessToken,
          request.fileName,
          request.fileData,
          request.mimeType,
          request.parentFolderId
        );
        console.log("File uploaded:", result.id);
        break;

      case "getFile": {
        if (!request.fileId) {
          throw new Error("fileId is required");
        }
        const fileResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${request.fileId}?fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink,size`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!fileResponse.ok) {
          const error = await fileResponse.text();
          throw new Error(`Failed to get file: ${error}`);
        }
        result = await fileResponse.json();
        console.log("File info retrieved:", request.fileId);
        break;
      }

      case "getEmbedLink":
        if (!request.fileId) {
          throw new Error("fileId is required");
        }
        result = {
          embedLink: `https://drive.google.com/file/d/${request.fileId}/preview`,
          viewLink: `https://drive.google.com/file/d/${request.fileId}/view`
        };
        console.log("Embed link generated:", request.fileId);
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in google-drive function:", error);
    await logEdgeFunctionError("google-drive", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
