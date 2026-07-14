'use server';

import { requireAdmin } from '@/lib/auth';
import { sendBroadcast, type Segment } from './send';

export type { Segment };

/** Send an announcement push to a segment (directly — no API dependency). */
export async function broadcast(input: { title: string; body: string; segment: Segment }): Promise<{ error: string } | { recipients: number }> {
  await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) return { error: 'Title and message are required.' };
  try {
    const { sent } = await sendBroadcast(input.segment, {
      title: input.title.trim(),
      body: input.body.trim(),
      data: { kind: 'announcement' },
    });
    return { recipients: sent };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send.' };
  }
}
