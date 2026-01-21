#!/usr/bin/env node
/*
  grantRole.mjs
  Uso:
    node tools/grantRole.mjs --email fmbp1981@gmail.com --role admin

  Requer:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY

  Observação:
    Este script é o caminho recomendado para bootstrap do primeiro admin.
*/

import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const email = getArg("email");
const role = getArg("role");

if (!email || !role) {
  console.error("Uso: node tools/grantRole.mjs --email <email> --role <admin|consultor|cliente|parceiro>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam env vars: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1) Tentar encontrar pelo profiles (trigger handle_new_user deve ter criado)
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,nome")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("Erro consultando profiles:", profileError);
    process.exit(1);
  }

  // 2) Fallback: procurar no Auth Admin API (caso profile não exista por algum motivo)
  if (!profile) {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      console.error("Erro listando usuários do Auth:", usersError);
      process.exit(1);
    }

    const u = usersData.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (!u) {
      console.error("Usuário não encontrado. O email já se cadastrou no sistema?");
      process.exit(1);
    }

    // Garantir profile
    const nome = (u.user_metadata?.nome || u.user_metadata?.name || null) ?? null;
    const { error: insertProfileError } = await supabase
      .from("profiles")
      .upsert({ id: u.id, email: u.email, nome }, { onConflict: "id" });

    if (insertProfileError) {
      console.error("Erro criando profile:", insertProfileError);
      process.exit(1);
    }

    profile = { id: u.id, email: u.email, nome };
  }

  // 3) Insert role (se já existir, ignora devido ao UNIQUE constraint)
  const { error: insertRoleError } = await supabase
    .from("user_roles")
    .insert({ user_id: profile.id, role });

  // Se o erro for de violação de unique constraint (role já existe), ignorar
  if (insertRoleError && insertRoleError.code !== "23505") {
    console.error("Erro gravando user_roles:", insertRoleError);
    process.exit(1);
  }

  console.log(`OK: ${email} agora tem role '${role}' (user_id=${profile.id}).`);
}

main().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
