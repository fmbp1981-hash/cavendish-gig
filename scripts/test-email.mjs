/**
 * Script de teste para a edge function send-email.
 * Uso: $env:ADMIN_PASSWORD="sua_senha"; node scripts/test-email.mjs
 */

const SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbmZnanFsc3F6dnhsb2VhdmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDUyNzMsImV4cCI6MjA4MTAyMTI3M30.w0URRgmpDIunlHlSHlmsaLSCcwoJug-S3EY0vOtk4UI";
const ADMIN_EMAIL = "fmbp1981@gmail.com";
const TEST_RECIPIENT = "fmbp1981@gmail.com";

const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error("❌  Defina a variável ADMIN_PASSWORD antes de rodar.");
  console.error("    PowerShell: $env:ADMIN_PASSWORD='sua_senha'; node scripts/test-email.mjs");
  process.exit(1);
}

async function run() {
  // 1. Sign in
  console.log("🔑  Autenticando como admin...");
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email: ADMIN_EMAIL, password }),
  });

  const signInData = await signInRes.json();
  if (!signInData.access_token) {
    console.error("❌  Falha no login:", signInData.error_description || JSON.stringify(signInData));
    process.exit(1);
  }
  console.log("✅  Login OK — role:", signInData.user?.role ?? "n/a");

  // 2. Invoke send-email
  console.log(`\n📧  Enviando email de teste para ${TEST_RECIPIENT}...`);
  const sendRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${signInData.access_token}`,
    },
    body: JSON.stringify({
      type: "documento_aprovado",
      to: TEST_RECIPIENT,
      data: {
        documentoNome: "Contrato Social (TESTE)",
        organizacaoNome: "Empresa Teste Ltda",
        userName: "Admin",
      },
    }),
  });

  const sendData = await sendRes.json();

  if (sendRes.ok && sendData.success) {
    console.log("✅  Email enviado com sucesso!");
    console.log("    Resend message ID:", sendData.id);
    console.log(`\n    Verifique a caixa de entrada de ${TEST_RECIPIENT}`);
  } else {
    console.error("❌  Falha ao enviar email (HTTP", sendRes.status, ")");
    console.error("    Resposta:", JSON.stringify(sendData, null, 2));
  }
}

run().catch((err) => {
  console.error("❌  Erro inesperado:", err.message);
  process.exit(1);
});
