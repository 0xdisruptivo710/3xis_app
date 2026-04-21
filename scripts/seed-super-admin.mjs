// scripts/seed-super-admin.mjs
//
// Cria (ou promove) o super_admin da plataforma 3X.
//
// Uso:
//   node scripts/seed-super-admin.mjs
//
// Variaveis de ambiente necessarias (procura em .env, .env.local, e env do shell):
//   NEXT_PUBLIC_SUPABASE_URL       - URL do projeto Supabase
//   SUPABASE_SERVICE_ROLE_KEY      - chave service_role (NUNCA commitar)
//
// Variaveis opcionais (com defaults):
//   SUPER_ADMIN_EMAIL    (default: aios.chatbot@gmail.com)
//   SUPER_ADMIN_PASSWORD (default: senha aleatoria gerada e impressa)
//   SUPER_ADMIN_NAME     (default: Plataforma 3X)
//
// O script e idempotente:
//   - Se o usuario nao existe -> cria + define role super_admin
//   - Se o usuario ja existe   -> apenas garante role super_admin no profile

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

// ----- carrega .env / .env.local de forma simples (sem dep externa) -----
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));
loadEnvFile(resolve(process.cwd(), 'apps/admin/.env.local'));
loadEnvFile(resolve(process.cwd(), 'apps/app/.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('[seed-super-admin] ERRO: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  console.error('  Crie um .env.local na raiz do projeto ou em apps/admin/.env.local');
  process.exit(1);
}

const EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'aios.chatbot@gmail.com').toLowerCase().trim();
const NAME = process.env.SUPER_ADMIN_NAME || 'Plataforma 3X';
const PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD || `3X-${randomBytes(8).toString('hex')}!`;
const PASSWORD_WAS_GENERATED = !process.env.SUPER_ADMIN_PASSWORD;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  // listUsers nao filtra por email diretamente; pagina ate achar
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  console.log(`[seed-super-admin] Alvo: ${EMAIL}`);

  let user = await findUserByEmail(EMAIL);

  if (!user) {
    console.log('[seed-super-admin] Usuario nao existe. Criando...');
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log(`[seed-super-admin] Usuario criado: ${user.id}`);
  } else {
    console.log(`[seed-super-admin] Usuario ja existe: ${user.id}`);
    console.log('[seed-super-admin] Atualizando senha para a senha impressa abaixo...');
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: NAME },
    });
    if (updateError) throw updateError;
  }

  // O trigger handle_new_user cria o profile automaticamente,
  // mas pode ainda nao existir caso o trigger esteja desabilitado.
  // Garantimos a presenca via upsert.
  const { error: upsertError } = await admin
    .from('x3_profiles')
    .upsert(
      {
        id: user.id,
        full_name: NAME,
        role: 'super_admin',
        store_id: null,
      },
      { onConflict: 'id' }
    );

  if (upsertError) throw upsertError;

  console.log('[seed-super-admin] Profile garantido com role=super_admin');
  console.log('');
  console.log('============================================================');
  console.log(' SUPER ADMIN PRONTO');
  console.log('============================================================');
  console.log(` Email:  ${EMAIL}`);
  if (PASSWORD_WAS_GENERATED) {
    console.log(` Senha:  ${PASSWORD}`);
    console.log('');
    console.log(' >>> Esta senha foi gerada agora. Anote em local seguro');
    console.log(' >>> e troque no primeiro login pelo painel Supabase ou');
    console.log(' >>> via fluxo de "esqueci minha senha".');
  } else {
    console.log(' Senha:  (definida via SUPER_ADMIN_PASSWORD)');
  }
  console.log('============================================================');
}

main().catch((err) => {
  console.error('[seed-super-admin] ERRO:', err.message || err);
  process.exit(1);
});
