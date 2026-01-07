#!/usr/bin/env node

import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const email = (getArgValue('--email') || 'fmbp1981@gmail.com').trim();
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (!email || !email.includes('@')) {
  console.error('Invalid email. Use: --email user@example.com');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,nome')
    .ilike('email', email)
    .maybeSingle();

  if (profileError) {
    console.error('Failed to query profiles:', profileError.message);
    process.exit(1);
  }

  if (!profile?.id) {
    console.error(
      `Profile not found for email ${email}.\n` +
        `Ensure the user has signed up/logged in at least once (so handle_new_user creates the profile), then try again.`
    );
    process.exit(2);
  }

  const { error: upsertError } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: profile.id, role: 'admin' },
      { onConflict: 'user_id,role' }
    );

  if (upsertError) {
    console.error('Failed to upsert user_roles:', upsertError.message);
    process.exit(1);
  }

  console.log('OK');
  console.log(`Promoted to admin: ${email}`);
  console.log(`user_id: ${profile.id}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
