import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS. SERVER ONLY.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * pulled into a client bundle, so the service_role key can never leak to the
 * browser. Every admin read/write goes through this client (PRD: the admin panel
 * is the sole reader of locked-down tables like contact_messages).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — see .env.example',
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
