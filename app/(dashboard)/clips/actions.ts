'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function setClipMature(clipId: string, mature: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('clips').update({ mature_content: mature }).eq('id', clipId);
  if (error) return { error: error.message };
  revalidatePath('/clips');
  return { ok: true };
}

export async function deleteClip(clipId: string) {
  await requireAdmin();
  // Also resolve any open reports against this clip.
  const { error } = await supabaseAdmin.from('clips').delete().eq('id', clipId);
  if (error) return { error: error.message };
  await supabaseAdmin
    .from('reports')
    .update({ status: 'actioned' })
    .eq('target_type', 'clip')
    .eq('target_id', clipId)
    .eq('status', 'open');
  revalidatePath('/clips');
  return { ok: true };
}
