'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { callAdminApi } from '@/lib/adminApi';

/** Run the monthly payout generation for a 'YYYY-MM' period (via the API). */
export async function generatePayouts(period: string): Promise<{ error: string } | { created: number; skippedFounders: number }> {
  await requireAdmin();
  if (!/^\d{4}-\d{2}$/.test(period)) return { error: 'Period must be YYYY-MM.' };
  const res = await callAdminApi<{ created: number; skippedFounders: number }>('/admin/payouts/generate', {
    method: 'POST',
    body: { period },
  });
  if (!res.ok) return { error: res.error };
  revalidatePath('/payouts');
  return res.data;
}

/** Record that a payout was settled out-of-band (Wise/PayPal/bank). */
export async function markPaid(id: string, reference: string) {
  await requireAdmin();
  const res = await callAdminApi(`/admin/payouts/${id}/mark-paid`, { method: 'POST', body: { reference } });
  if (!res.ok) return { error: res.error };
  revalidatePath('/payouts');
  return { ok: true };
}
