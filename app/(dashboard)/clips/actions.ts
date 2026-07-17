'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

type Flag = 'mature_content' | 'contains_spoilers' | 'is_private';

async function setFlag(clipId: string, flag: Flag, value: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('clips').update({ [flag]: value }).eq('id', clipId);
  if (error) return { error: error.message };
  revalidatePath('/clips');
  revalidatePath(`/clips/${clipId}`);
  return { ok: true };
}

export async function setClipMature(clipId: string, value: boolean) {
  return setFlag(clipId, 'mature_content', value);
}
export async function setClipSpoiler(clipId: string, value: boolean) {
  return setFlag(clipId, 'contains_spoilers', value);
}
export async function setClipPrivate(clipId: string, value: boolean) {
  return setFlag(clipId, 'is_private', value);
}

/** Delete a comment on a clip (moderation). */
export async function deleteClipComment(commentId: string, clipId: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('clip_comments').delete().eq('id', commentId);
  if (error) return { error: error.message };
  revalidatePath(`/clips/${clipId}`);
  return { ok: true };
}

async function removeClip(clipId: string) {
  const { error } = await supabaseAdmin.from('clips').delete().eq('id', clipId);
  if (error) return error.message;
  // Resolve any open reports against this clip.
  await supabaseAdmin
    .from('reports')
    .update({ status: 'actioned' })
    .eq('target_type', 'clip')
    .eq('target_id', clipId)
    .eq('status', 'open');
  return null;
}

/** Delete from the list (stays on /clips). */
export async function deleteClip(clipId: string) {
  await requireAdmin();
  const err = await removeClip(clipId);
  if (err) return { error: err };
  revalidatePath('/clips');
  return { ok: true };
}

/** Delete from the detail page → back to the list. */
export async function deleteClipAndReturn(clipId: string) {
  await requireAdmin();
  const err = await removeClip(clipId);
  if (err) return { error: err };
  revalidatePath('/clips');
  redirect('/clips');
}
