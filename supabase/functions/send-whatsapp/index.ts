import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  type: "sms" | "whatsapp";
  to: string; // Phone number with country code (e.g., +5511999999999)
  message: string;
  templateName?: string; // For WhatsApp template messages
  templateParams?: Record<string, string>;
}

async function sendSMS(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<any> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: from,
      Body: body,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio SMS error: ${error}`);
  }

  return await response.json();
}

async function sendWhatsApp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<any> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  // Format numbers for WhatsApp
  const whatsappFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: whatsappTo,
      From: whatsappFrom,
      Body: body,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio WhatsApp error: ${error}`);
  }

  return await response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-whatsapp function called");

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

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER") || "";

    if (!accountSid || !authToken) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "Twilio integration not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, to, message }: WhatsAppRequest = await req.json();
    console.log(`Sending ${type}`);

    let result;

    if (type === "whatsapp") {
      result = await sendWhatsApp(accountSid, authToken, twilioPhone, to, message);
    } else {
      result = await sendSMS(accountSid, authToken, twilioPhone, to, message);
    }

    console.log(`Message sent successfully: ${result.sid}`);

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
