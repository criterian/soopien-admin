'use server';

import { requireAdmin } from '@/lib/auth';
import { callAdminApi } from '@/lib/adminApi';

export type Segment = 'all' | 'premium' | 'freemium';

/** Send an announcement push via the API's broadcast endpoint. */
export async function broadcast(input: { title: string; body: string; segment: Segment }): Promise<{ error: string } | { recipients: number }> {
  await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) return { error: 'Title and message are required.' };
  const res = await callAdminApi<{ recipients: number }>('/admin/push/broadcast', {
    method: 'POST',
    body: { title: input.title.trim(), body: input.body.trim(), segment: input.segment },
  });
  if (!res.ok) return { error: res.error };
  return res.data;
}
