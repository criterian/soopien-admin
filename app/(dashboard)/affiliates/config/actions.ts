'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { callAdminApi } from '@/lib/adminApi';
import type { AffiliateConfig } from '../constants';

/**
 * Save the affiliate config. Routed through the API (not a direct app_config
 * write) so the API validates the shape and busts its Redis cache — buy-links
 * pick up the new tags near-instantly.
 */
export async function saveAffiliateConfig(config: AffiliateConfig) {
  await requireAdmin();
  const res = await callAdminApi<{ config: AffiliateConfig }>('/admin/affiliate/config', {
    method: 'PUT',
    body: config,
  });
  if (!res.ok) return { error: res.error };
  revalidatePath('/affiliates/config');
  revalidatePath('/affiliates');
  return { ok: true as const };
}
