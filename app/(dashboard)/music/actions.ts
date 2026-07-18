'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { r2Configured, putTrack } from '@/lib/r2';
import { CATEGORY_BY_KEY, type MusicCategoryKey } from './constants';

/** Whether audio upload is available (R2 configured on the server). */
export async function isUploadEnabled(): Promise<boolean> {
  return r2Configured();
}

const AUDIO_EXT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
};

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'track';

/**
 * Create a track. If an audio `file` is provided it's uploaded to the R2 music
 * bucket under `<category>/<slug>.<ext>` and that becomes the storage_key;
 * otherwise a manual `storage_key` (for an object already in R2) is used.
 */
export async function createTrack(formData: FormData) {
  await requireAdmin();

  const category = String(formData.get('category') ?? '') as MusicCategoryKey;
  const cat = CATEGORY_BY_KEY.get(category);
  if (!cat) return { error: 'Unknown category.' };

  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Title is required.' };

  const durationRaw = String(formData.get('duration_seconds') ?? '').trim();
  const duration = durationRaw ? parseInt(durationRaw, 10) : null;

  const file = formData.get('file');
  const manualKey = String(formData.get('storage_key') ?? '').trim();

  let storageKey: string;

  if (file instanceof File && file.size > 0) {
    if (!r2Configured()) return { error: 'Audio upload is off (R2 not configured). Provide a storage key instead.' };
    const type = file.type || 'audio/mpeg';
    const ext = AUDIO_EXT[type] ?? (file.name.split('.').pop() ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!type.startsWith('audio/') && !Object.values(AUDIO_EXT).includes(ext)) {
      return { error: 'That file is not audio.' };
    }
    if (file.size > 120 * 1024 * 1024) return { error: 'Audio must be under 120 MB.' };

    storageKey = `${category}/${slug(title)}.${ext}`;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await putTrack(storageKey, buffer, type);
    } catch (e) {
      return { error: `Upload failed: ${(e as Error).message}` };
    }
  } else if (manualKey) {
    storageKey = manualKey;
  } else {
    return { error: 'Upload an audio file or enter a storage key.' };
  }

  // Next sort index within the category.
  const { count } = await supabaseAdmin
    .from('music_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('category', category);

  const { error } = await supabaseAdmin.from('music_tracks').insert({
    category,
    mood: cat.mood,
    tier: cat.tier,
    title,
    storage_key: storageKey,
    duration_seconds: Number.isFinite(duration) && (duration ?? 0) > 0 ? duration : null,
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
