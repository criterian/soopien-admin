'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { callAdminApi } from '@/lib/adminApi';
import type { BillingProvider } from './constants';

/**
 * Switch the active personal-Premium billing rail. Goes through the API (which
 * owns app_config + the provider validation) rather than writing app_config here.
 */
export async function setBillingProvider(provider: BillingProvider) {
  await requireAdmin();
  const res = await callAdminApi('/admin/config/billing-provider', { method: 'PUT', body: { provider } });
  if (!res.ok) return { error: res.error };
  revalidatePath('/subscriptions');
  return { ok: true };
}
