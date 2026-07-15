'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const COVERS_BUCKET = 'book-covers'; // public; matches apps/api lib/storage.ts

export type CoverSide = 'front' | 'back';
const coverCol = (side: CoverSide) => (side === 'front' ? 'cover_front_url' : 'cover_back_url');

export type BookPatch = {
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  edition: string | null;
  language: string | null;
  page_count: number | null;
  synopsis: string | null;
};

/** Dedup key — must match apps/api lib/people.ts normalizeName. */
const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Find-or-create an author entity by normalized name (same rule as the API). */
async function findOrCreateAuthor(name: string): Promise<{ id: string } | null> {
  const norm = normalizeName(name);
  if (!norm) return null;
  const { data: existing } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('name_normalized', norm)
    .maybeSingle();
  if (existing) return existing as { id: string };

  const { data, error } = await supabaseAdmin
    .from('authors')
    .insert({ name: name.trim(), name_normalized: norm })
    .select('id')
    .single();
  if (error) return null;
  return data as { id: string };
}

/**
 * Keep book_authors in step with the text author field. Only runs when the name
 * actually changed, so unrelated edits never touch a book's author links.
 */
async function syncAuthorLink(bookId: string, next: string | null, previous: string | null): Promise<void> {
  if ((next ?? '') === (previous ?? '')) return;
  await supabaseAdmin.from('book_authors').delete().eq('book_id', bookId).eq('role', 'author');
  if (!next) return;
  const author = await findOrCreateAuthor(next);
  if (!author) return;
  await supabaseAdmin
    .from('book_authors')
    .upsert({ book_id: bookId, author_id: author.id, role: 'author', position: 0 }, { onConflict: 'book_id,author_id,role' });
}

/** Find-or-create a publisher entity by normalized name (same rule as the API). */
async function findOrCreatePublisher(name: string): Promise<{ id: string } | null> {
  const norm = normalizeName(name);
  if (!norm) return null;
  const { data: existing } = await supabaseAdmin
    .from('publishers')
    .select('id')
    .eq('name_normalized', norm)
    .maybeSingle();
  if (existing) return existing as { id: string };

  const { data, error } = await supabaseAdmin
    .from('publishers')
    .insert({ name: name.trim(), name_normalized: norm })
    .select('id')
    .single();
  if (error) return null;
  return data as { id: string };
}

/**
 * Keep books.publisher_id in step with the text publisher field. The API resolves
 * this fill-only; here an admin's explicit edit is authoritative, so it re-points
 * (or clears) the FK — but only when the name actually changed.
 */
async function syncPublisherLink(bookId: string, next: string | null, previous: string | null): Promise<void> {
  if ((next ?? '') === (previous ?? '')) return;
  if (!next) {
    await supabaseAdmin.from('books').update({ publisher_id: null }).eq('id', bookId);
    return;
  }
  const publisher = await findOrCreatePublisher(next);
  if (!publisher) return;
  await supabaseAdmin.from('books').update({ publisher_id: publisher.id }).eq('id', bookId);
}

/** Edit catalog metadata for a book. Covers are managed separately (see below). */
export async function updateBook(id: string, patch: BookPatch) {
  await requireAdmin();
  if (!patch.title.trim()) return { error: 'Title is required.' };

  const { data } = await supabaseAdmin.from('books').select('author, publisher').eq('id', id).maybeSingle();
  const before = (data ?? null) as { author: string | null; publisher: string | null } | null;

  const { error } = await supabaseAdmin
    .from('books')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') return { error: 'That ISBN already belongs to another book.' };
    return { error: error.message };
  }

  await syncAuthorLink(id, patch.author, before?.author ?? null);
  await syncPublisherLink(id, patch.publisher, before?.publisher ?? null);

  revalidatePath(`/books/${id}`);
  revalidatePath('/books');
  return { ok: true };
}

/** Upload a new cover image and point the book at it. */
export async function uploadCover(bookId: string, side: CoverSide, formData: FormData) {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };
  if (!file.type.startsWith('image/')) return { error: 'That file is not an image.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Image must be under 8 MB.' };

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${bookId}/${side}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage
    .from(COVERS_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) return { error: upErr.message };

  const url = supabaseAdmin.storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabaseAdmin
    .from('books')
    .update({ [coverCol(side)]: url, updated_at: new Date().toISOString() })
    .eq('id', bookId);
  if (error) return { error: error.message };

  revalidatePath(`/books/${bookId}`);
  revalidatePath('/books');
  return { ok: true };
}

/** Point a cover at an external URL, or clear it (null). */
export async function setCoverUrl(bookId: string, side: CoverSide, url: string | null) {
  await requireAdmin();
  const value = url?.trim() ? url.trim() : null;
  const { error } = await supabaseAdmin
    .from('books')
    .update({ [coverCol(side)]: value, updated_at: new Date().toISOString() })
    .eq('id', bookId);
  if (error) return { error: error.message };
  revalidatePath(`/books/${bookId}`);
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
