'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { callAdminApi } from '@/lib/adminApi';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { LIMIT_DEFS, type LimitName } from './data';

const NAMES = new Set<string>(LIMIT_DEFS.map((d) => d.name));

/** Set (or clear) a freemium cap override in app_config. */
export async function setLimit(name: LimitName, value: number | null) {
  await requireAdmin();
  if (!NAMES.has(name)) return { error: 'Unknown limit.' };
  const key = `freemium_${name}`;

  if (value === null) {
    // Reset to default = remove the override row.
    const { error } = await supabaseAdmin.from('app_config').delete().eq('key', key);
    if (error) return { error: error.message };
  } else {
    if (!Number.isInteger(value) || value < 0) return { error: 'Value must be a non-negative integer.' };
    const { error } = await supabaseAdmin
      .from('app_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return { error: error.message };
  }
  revalidatePath('/config');
  return { ok: true };
}

/**
 * Toggle whether free (non-Premium) users may export/share clips & collections.
 * Routed through the API (not a direct app_config write) so the API validates
 * and busts its config cache — the change is live immediately, not after ~30s.
 */
export async function setFreeExport(enabled: boolean) {
  await requireAdmin();
  const res = await callAdminApi<{ freeExportEnabled: boolean }>('/admin/config/free-export', {
    method: 'PUT',
    body: { enabled },
  });
  if (!res.ok) return { error: res.error };
  revalidatePath('/config');
  return { ok: true as const };
}
