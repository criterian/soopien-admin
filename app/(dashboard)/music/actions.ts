'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CATEGORY_BY_KEY, type MusicCategoryKey } from './constants';

export async function createTrack(input: {
  category: MusicCategoryKey;
  title: string;
  storage_key: string;
  duration_seconds: number | null;
}) {
  await requireAdmin();
  const cat = CATEGORY_BY_KEY.get(input.category);
  if (!cat) return { error: 'Unknown category.' };
  if (!input.title.trim() || !input.storage_key.trim()) return { error: 'Title and storage key are required.' };

  // Next sort index within the category.
  const { count } = await supabaseAdmin
    .from('music_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('category', input.category);

  const { error } = await supabaseAdmin.from('music_tracks').insert({
    category: input.category,
    mood: cat.mood,
    tier: cat.tier,
    title: input.title.trim(),
    storage_key: input.storage_key.trim(),
    duration_seconds: input.duration_seconds,
    sort: count ?? 0,
    active: true,
  });
  if (error) return { error: error.message };
  revalidatePath('/music');
  return { ok: true };
}

export async function setTrackActive(id: string, active: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('music_tracks').update({ active }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/music');
  return { ok: true };
}

export async function deleteTrack(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('music_tracks').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/music');
  return { ok: true };
}
