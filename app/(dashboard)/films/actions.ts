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
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
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

/** Delete a film. Its clips, shelf entries, and reviews cascade via FK. */
export async function deleteFilm(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('films').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/films');
  redirect('/films');
}
