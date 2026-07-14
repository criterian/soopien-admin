'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type BookPatch = {
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  edition: string | null;
  language: string | null;
  page_count: number | null;
  synopsis: string | null;
  cover_front_url: string | null;
  cover_back_url: string | null;
};

/** Edit catalog metadata for a book. */
export async function updateBook(id: string, patch: BookPatch) {
  await requireAdmin();
  if (!patch.title.trim()) return { error: 'Title is required.' };

  const { error } = await supabaseAdmin
    .from('books')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    // Unique ISBN violation (PRD §4.1) surfaces here.
    if (error.code === '23505') return { error: 'That ISBN already belongs to another book.' };
    return { error: error.message };
  }
  revalidatePath(`/books/${id}`);
  revalidatePath('/books');
  return { ok: true };
}

/** Delete a book. Its clips, library entries, and reviews cascade via FK. */
export async function deleteBook(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('books').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/books');
  redirect('/books');
}
