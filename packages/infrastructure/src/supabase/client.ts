import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let clientInstance: SupabaseClient<Database> | null = null;
let serverInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  clientInstance = createClient<Database>(url, anonKey);
  return clientInstance;
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (serverInstance) return serverInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  serverInstance = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serverInstance;
}
