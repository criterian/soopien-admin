'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ReportTargetType } from './data';

/** Resolve every open report against a target (dismiss = keep, action = actioned). */
export async function resolveTarget(
  targetType: ReportTargetType,
  targetId: string,
  status: 'actioned' | 'dismissed',
) {
  const me = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('reports')
    .update({ status, resolved_by: me.id, resolved_at: new Date().toISOString() })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('status', 'open');
  if (error) return { error: error.message };
  revalidatePath('/moderation');
  return { ok: true };
}

/**
 * Remove the reported content (clip or comment) and mark its reports actioned.
 * Profiles aren't deleted here — use the user's GDPR delete on the Users page.
 */
export async function removeContent(targetType: ReportTargetType, targetId: string) {
  await requireAdmin();
  if (targetType === 'profile') return { error: 'Use the Users page to remove a profile.' };

  const table = targetType === 'clip' ? 'clips' : 'clip_comments';
  const { error } = await supabaseAdmin.from(table).delete().eq('id', targetId);
  if (error) return { error: error.message };

  return resolveTarget(targetType, targetId, 'actioned');
}

/** Toggle the Mature Content flag on a clip (PRD §9.2 — admin can flag). */
export async function setClipMature(clipId: string, mature: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('clips')
    .update({ mature_content: mature })
    .eq('id', clipId);
  if (error) return { error: error.message };
  revalidatePath('/moderation');
  return { ok: true };
}
