import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { loadIntegration } from "../_shared/integrations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEvent {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  attendees?: string[];  // Array of email addresses
  location?: string;
  timeZone?: string;
}

interface CalendarRequest {
  action: "create" | "list" | "update" | "delete";
  event?: CalendarEvent;
  eventId?: string;
  calendarId?: string;
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT header and claim
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Encode header and claim
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${headerB64}.${claimB64}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the token
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

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

async function createCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
  calendarId: string = "primary"
): Promise<any> {
  const googleEvent = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startDateTime,
      timeZone: event.timeZone || "America/Sao_Paulo",
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: event.timeZone || "America/Sao_Paulo",
    },
    attendees: event.attendees?.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Calendar API error:", error);
    throw new Error(`Failed to create event: ${error}`);
  }

  return await response.json();
}

async function listCalendarEvents(
  accessToken: string,
  calendarId: string = "primary",
  timeMin?: string,
  timeMax?: string
): Promise<any> {
  const params = new URLSearchParams({
    maxResults: "50",
    singleEvents: "true",
    orderBy: "startTime",
  });

  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list events: ${error}`);
  }

  return await response.json();
}

async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to delete event: ${error}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  const reqId = crypto.randomUUID().slice(0, 8);
  console.log(`[google-calendar][${reqId}] invoked method=${req.method}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const service = createServiceClient();

    // Load integration record (may be null if never configured)
    let integration = null;
    try {
      integration = await loadIntegration(service, "google-calendar", "system", null);
    } catch (integErr: any) {
      console.warn(`[google-calendar][${reqId}] loadIntegration failed: ${integErr.message}`);
    }

    if (integration && !integration.enabled) {
      console.warn(`[google-calendar][${reqId}] integration disabled`);
      return new Response(
        JSON.stringify({ error: "Google Calendar integration disabled" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const secrets = integration?.secrets as any;
    const serviceAccountJson = secrets?.GOOGLE_SERVICE_ACCOUNT || Deno.env.get("GOOGLE_SERVICE_ACCOUNT") || "";

    if (!serviceAccountJson) {
      console.error(`[google-calendar][${reqId}] GOOGLE_SERVICE_ACCOUNT not set — integration_row_found=${!!integration}`);
      return new Response(
        JSON.stringify({ error: "Google Calendar integration not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, event, eventId, calendarId }: CalendarRequest = await req.json();
    console.log(`[google-calendar][${reqId}] action=${action} calendarId=${calendarId ?? "primary"}`);

    let accessToken: string;
    try {
      accessToken = await getAccessToken(serviceAccountJson);
      console.log(`[google-calendar][${reqId}] access token obtained`);
    } catch (tokenErr: any) {
      console.error(`[google-calendar][${reqId}] getAccessToken failed: ${tokenErr.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to authenticate with Google: ${tokenErr.message}` }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let result;

    switch (action) {
      case "create":
        if (!event) throw new Error("Event data is required for create action");
        result = await createCalendarEvent(accessToken, event, calendarId);
        console.log(`[google-calendar][${reqId}] event created id=${result.id}`);
        break;

      case "list": {
        const now = new Date().toISOString();
        const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        result = await listCalendarEvents(accessToken, calendarId, now, oneMonthFromNow);
        console.log(`[google-calendar][${reqId}] events listed count=${result.items?.length}`);
        break;
      }

      case "delete":
        if (!eventId) throw new Error("Event ID is required for delete action");
        await deleteCalendarEvent(accessToken, eventId, calendarId);
        result = { success: true, message: "Event deleted" };
        console.log(`[google-calendar][${reqId}] event deleted id=${eventId}`);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error(`[google-calendar][${reqId}] unhandled error: ${error.message}`, error.stack ?? "");
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
