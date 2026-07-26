'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { callAdminApi } from '@/lib/adminApi';
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

// ── Book texts (Smart Discovery Phase 3, DISCOVERY.md §7) ───────────────────

export type TextLicense = 'public_domain' | 'licensed' | 'no_display';

/**
 * Import a full text for a book.
 *
 * Goes through the API rather than writing here: the API is what downloads the
 * file, stores it in the private R2 bucket and validates the format. Duplicating
 * any of that in the panel would mean two places deciding what is legal to
 * store.
 */
export async function importBookText(
  bookId: string,
  input: { url?: string; gutenbergId?: string; license: TextLicense },
) {
  await requireAdmin();

  const url = input.url?.trim();
  const gutenbergId = input.gutenbergId?.trim();
  if (!url && !gutenbergId) return { error: 'Enter a URL or a Project Gutenberg id' };
  if (gutenbergId && !/^\d+$/.test(gutenbergId)) return { error: 'Gutenberg id must be a number' };

  const res = await callAdminApi('/admin/texts/import', {
    method: 'POST',
    body: {
      bookId,
      ...(url ? { url } : { gutenbergId: Number(gutenbergId) }),
      license: input.license,
    },
  });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

/** Run the parser over pending texts — turns an upload into searchable chunks. */
export async function parsePendingTexts(bookId: string) {
  await requireAdmin();
  const res = await callAdminApi<{ report: { ready: number; failed: number; blocks: number } }>(
    '/admin/jobs/text-parse',
    { method: 'POST', body: { limit: 3 } },
  );
  if (!res.ok) return { error: res.error };
  revalidatePath(`/books/${bookId}`);
  return { ok: true, report: res.data.report };
}

/** Remove a text, its blocks, its chunks and the stored file. */
export async function deleteBookText(bookId: string, textId: string) {
  await requireAdmin();
  const res = await callAdminApi(`/admin/texts/${textId}`, { method: 'DELETE' });
  if (!res.ok) return { error: res.error };
  revalidatePath(`/books/${bookId}`);
  return { ok: true };
}

// ── Bulk Gutenberg import (DISCOVERY.md §7.3) ───────────────────────────────

/** Mirrors GutenbergCandidate in apps/api lib/kb/gutenberg.ts. */
export type GutenbergCandidate = {
  gutenbergId: number;
  title: string;
  authors: string[];
  languages: string[];
  downloads: number;
  titleScore: number;
};

/** Free-form Gutenberg search, for rows whose proposals are wrong. */
export async function searchGutenberg(query: string) {
  await requireAdmin();
  const res = await callAdminApi<{ results: GutenbergCandidate[] }>(
    `/admin/texts/search?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return { error: res.error as string, results: [] as GutenbergCandidate[] };
  return { results: res.data.results, error: undefined };
}

/**
 * Import confirmed book↔Gutenberg pairings. Always public domain — this path
 * only ever fetches from Gutenberg, so exposing a licence choice here would add
 * a way to get it wrong and no way to get it more right.
 */
export async function importGutenbergBatch(items: Array<{ bookId: string; gutenbergId: number }>) {
  await requireAdmin();
  if (!items.length) return { error: 'Nothing selected' };

  const res = await callAdminApi<{ imported: number; results: Array<{ bookId: string; ok: boolean; error?: string }> }>(
    '/admin/texts/import-batch',
    { method: 'POST', body: { items, license: 'public_domain' } },
  );
  if (!res.ok) return { error: res.error };

  revalidatePath('/books/texts');
  return { imported: res.data.imported, results: res.data.results };
}

/** Parse whatever is pending, across all books. */
export async function parseAllPendingTexts() {
  await requireAdmin();
  const res = await callAdminApi<{ report: { ready: number; failed: number; blocks: number } }>(
    '/admin/jobs/text-parse',
    { method: 'POST', body: { limit: 10 } },
  );
  if (!res.ok) return { error: res.error };
  revalidatePath('/books/texts');
  return { report: res.data.report };
}

/** Dismiss a book from the bulk import list — reversible, see migration 78. */
export async function skipBookText(bookId: string, reason?: string) {
  await requireAdmin();
  const res = await callAdminApi('/admin/texts/skip', {
    method: 'POST',
    body: { bookId, reason },
  });
  if (!res.ok) return { error: res.error };
  revalidatePath('/books/texts');
  return { ok: true };
}
