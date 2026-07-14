import 'server-only';
import { createSupabaseServerClient } from './supabase/server';

const API_URL = process.env.API_URL ?? 'http://localhost:8787';

/**
 * Call a Hono API `/admin/*` endpoint as the logged-in admin. The API re-checks
 * `profiles.is_admin` on its side, so we forward the admin's Supabase JWT. Used
 * for actions whose business logic already lives in the API (payout runs,
 * billing-provider switch) rather than re-implementing them here.
 */
export async function callAdminApi<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: 'Not authenticated', status: 401 };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: init?.body != null ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
  } catch (e) {
    return { ok: false, error: `API unreachable (${API_URL}): ${(e as Error).message}`, status: 0 };
  }

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return { ok: false, error: (json.error as string) ?? `API error ${res.status}`, status: res.status };
  }
  return { ok: true, data: json as T };
}
