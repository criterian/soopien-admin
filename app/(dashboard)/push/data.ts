import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type PushReach = { devices: number; users: number; ios: number; android: number };

/** Registered-device reach for the broadcast form. */
export async function getPushReach(): Promise<PushReach> {
  const { data } = await supabaseAdmin.from('push_tokens').select('user_id, platform').limit(50000);
  const rows = (data ?? []) as { user_id: string; platform: string | null }[];
  const users = new Set<string>();
  let ios = 0;
  let android = 0;
  for (const r of rows) {
    users.add(r.user_id);
    if (r.platform === 'ios') ios++;
    else if (r.platform === 'android') android++;
  }
  return { devices: rows.length, users: users.size, ios, android };
}
