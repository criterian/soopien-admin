import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY.
 *
 * The `server-only` import makes the build fail if this module is ever pulled
 * into a client bundle, so the service_role key can never leak to the browser.
 * Every admin read/write goes through this client.
 *
 * Created LAZILY on first use, not at import time: `next build` imports this
 * module while collecting page data, but the service_role key is a runtime-only
 * secret (never a build arg), so a top-level `createClient` would throw during
 * the build. The proxy defers the env check to the first real query at runtime.
 */
let cached: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — see .env.example');
  }
  cached = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return cached;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(client(), prop, receiver);
    return typeof value === 'function' ? value.bind(client()) : value;
  },
}) as SupabaseClient;
