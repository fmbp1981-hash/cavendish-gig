#!/usr/bin/env node
/*
  checkUserRoles.mjs
  Diagnóstico completo de roles de um usuário
  Uso:
    node tools/checkUserRoles.mjs --email fmbp1981@gmail.com
*/

import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const email = getArg("email");

if (!email) {
  console.error("Uso: node tools/checkUserRoles.mjs --email <email>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Faltam env vars: SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Falta SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Obtenha em: Supabase Dashboard → Settings → API → service_role");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("🔍 Diagnóstico de Roles\n");
  console.log(`📧 Email: ${email}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}\n`);

  // 1) Buscar usuário no Auth
  console.log("1️⃣  Buscando usuário no Auth...");
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    console.error("❌ Erro listando usuários:", usersError);
    process.exit(1);
  }

  const user = usersData.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error("❌ Usuário não encontrado no Auth!");
    process.exit(1);
  }

  console.log(`✅ Usuário encontrado:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Criado em: ${user.created_at}\n`);

  // 2) Verificar profile
  console.log("2️⃣  Verificando profile...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("❌ Erro buscando profile:", profileError);
  } else if (!profile) {
    console.error("⚠️  Profile não encontrado!");
  } else {
    console.log(`✅ Profile encontrado:`);
    console.log(`   Nome: ${profile.nome || "(não definido)"}`);
    console.log(`   Email: ${profile.email}\n`);
  }

  // 3) Verificar roles (com service role key - bypassa RLS)
  console.log("3️⃣  Verificando roles na tabela user_roles (COM SERVICE KEY)...");
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  if (rolesError) {
    console.error("❌ Erro buscando roles:", rolesError);
  } else if (!roles || roles.length === 0) {
    console.error("⚠️  NENHUMA ROLE ENCONTRADA!");
  } else {
    console.log(`✅ Roles encontradas: ${roles.length}`);
    roles.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.role} (ID: ${r.id}, Criado: ${r.created_at})`);
    });
  }

  console.log("\n" + "=".repeat(60));

  // 4) Tentar inserir role admin se não existir
  if (roles && !roles.find(r => r.role === 'admin')) {
    console.log("\n4️⃣  Role 'admin' NÃO encontrada. Tentando adicionar...");

    const { data: insertData, error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: 'admin' })
      .select();

    if (insertError) {
      if (insertError.code === "23505") {
        console.log("⚠️  Role 'admin' já existe (conflito de unique constraint)");
      } else {
        console.error("❌ Erro inserindo role 'admin':", insertError);
      }
    } else {
      console.log("✅ Role 'admin' adicionada com sucesso!");
      console.log(`   Dados inseridos:`, insertData);
    }

    // Verificar novamente
    console.log("\n5️⃣  Verificando roles novamente após inserção...");
    const { data: rolesAfter, error: rolesAfterError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (rolesAfterError) {
      console.error("❌ Erro buscando roles:", rolesAfterError);
    } else {
      console.log(`✅ Roles atuais: ${rolesAfter.length}`);
      rolesAfter.forEach((r, idx) => {
        console.log(`   ${idx + 1}. ${r.role} (ID: ${r.id})`);
      });
    }
  } else if (roles && roles.find(r => r.role === 'admin')) {
    console.log("\n✅ Role 'admin' JÁ EXISTE para este usuário!");
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📋 RESUMO:");
  console.log(`   User ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Roles: ${roles ? roles.map(r => r.role).join(", ") : "NENHUMA"}`);
  console.log("\n✅ Diagnóstico concluído!");
}

main().catch((e) => {
  console.error("\n❌ Erro inesperado:", e);
  process.exit(1);
});
