'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type FilmPatch = {
  title: string;
  release_year: number | null;
  director: string | null;
  media_type: 'movie' | 'tv';
  runtime_minutes: number | null;
  language: string | null;
  genres: string[];
  synopsis: string | null;
  // poster/backdrop/trailer are managed by the media card (upload/set-url).
};

export async function updateFilm(id: string, patch: FilmPatch) {
  await requireAdmin();
  if (!patch.title.trim()) return { error: 'Title is required.' };
  const { error } = await supabaseAdmin
    .from('films')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/films/${id}`);
  revalidatePath('/films');
  return { ok: true };
}

const COVERS_BUCKET = 'book-covers'; // shared public image bucket (see apps/api lib/storage.ts)

export type FilmMedia = 'poster' | 'backdrop' | 'trailer';
const mediaCol = (m: FilmMedia) => (m === 'poster' ? 'poster_url' : m === 'backdrop' ? 'backdrop_url' : 'trailer_url');

/** Upload a poster/backdrop image and point the film at it. */
export async function uploadFilmImage(filmId: string, kind: 'poster' | 'backdrop', formData: FormData) {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };
  if (!file.type.startsWith('image/')) return { error: 'That file is not an image.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'Image must be under 10 MB.' };

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `films/${filmId}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage
    .from(COVERS_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) return { error: upErr.message };

  const url = supabaseAdmin.storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin
    .from('films')
    .update({ [mediaCol(kind)]: url, updated_at: new Date().toISOString() })
    .eq('id', filmId);
  if (error) return { error: error.message };

  revalidatePath(`/films/${filmId}`);
  revalidatePath('/films');
  return { ok: true };
}

/** Point poster/backdrop/trailer at a URL, or clear it (null). */
export async function setFilmMediaUrl(filmId: string, kind: FilmMedia, url: string | null) {
  await requireAdmin();
  const value = url?.trim() ? url.trim() : null;
  const { error } = await supabaseAdmin
    .from('films')
    .update({ [mediaCol(kind)]: value, updated_at: new Date().toISOString() })
    .eq('id', filmId);
  if (error) return { error: error.message };
  revalidatePath(`/films/${filmId}`);
  revalidatePath('/films');
  return { ok: true };
}

/** Delete a film. Its clips, shelf entries, and reviews cascade via FK. */
export async function deleteFilm(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('films').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/films');
  redirect('/films');
}
