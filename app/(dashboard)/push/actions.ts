'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { sendBroadcast, type Segment } from './send';

export type { Segment };

/**
 * Announce to a segment: saves an inbox notification for every user in it, and
 * pushes to those with a registered device. No API dependency.
 */
export async function broadcast(input: { title: string; body: string; segment: Segment }): Promise<
  { error: string } | { recipients: number; pushed: number }
> {
  await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) return { error: 'Title and message are required.' };
  try {
    const res = await sendBroadcast(input.segment, { title: input.title.trim(), body: input.body.trim() });
    revalidatePath('/push');
    return res;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send.' };
  }
}
