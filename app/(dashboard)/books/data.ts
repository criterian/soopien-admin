import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 25;

export type BookRow = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  language: string | null;
  page_count: number | null;
  cover_front_url: string | null;
  created_at: string;
};

export async function listBooks(opts: { q?: string; page?: number }): Promise<{ rows: BookRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('books')
    .select('id, title, author, publisher, isbn, language, page_count, cover_front_url, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as BookRow[], total: count ?? 0 };
}

export type BookDetail = BookRow & {
  edition: string | null;
  synopsis: string | null;
  cover_back_url: string | null;
  publisher_id: string | null;
  updated_at: string;
};

export type LinkedAuthor = { id: string; name: string; role: string; verified: boolean };

export async function getBook(id: string): Promise<{
  book: BookDetail;
  authors: LinkedAuthor[];
  publisher: { id: string; name: string; verified: boolean } | null;
  stats: { readers: number; clips: number; reviews: number };
} | null> {
  const { data } = await supabaseAdmin
    .from('books')
    .select('id, title, author, publisher, isbn, edition, language, page_count, synopsis, cover_front_url, cover_back_url, publisher_id, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const book = data as BookDetail;

  const [authorLinks, publisher, readers, clips, reviews] = await Promise.all([
    supabaseAdmin
      .from('book_authors')
      .select('role, position, author:authors(id, name, verified)')
      .eq('book_id', id)
      .order('position', { ascending: true }),
    book.publisher_id
      ? supabaseAdmin.from('publishers').select('id, name, verified').eq('id', book.publisher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin.from('user_books').select('*', { count: 'exact', head: true }).eq('book_id', id).then((r) => r.count ?? 0),
    supabaseAdmin.from('clips').select('*', { count: 'exact', head: true }).eq('book_id', id).then((r) => r.count ?? 0),
    supabaseAdmin.from('book_reviews').select('*', { count: 'exact', head: true }).eq('book_id', id).then((r) => r.count ?? 0),
  ]);

  const authors: LinkedAuthor[] = ((authorLinks.data ?? []) as any[]).map((l) => ({
    id: l.author?.id,
    name: l.author?.name ?? '—',
    role: l.role,
    verified: !!l.author?.verified,
  }));

  return {
    book,
    authors,
    publisher: (publisher.data as any) ?? null,
    stats: { readers, clips, reviews },
  };
}

/** Books that share an ISBN — data-quality surfacing (PRD §4.1: no two books share an ISBN). */
export async function findDuplicateIsbns(): Promise<{ isbn: string; count: number }[]> {
  // No SQL group-by over PostgREST; pull non-null ISBNs and tally in JS.
  const { data } = await supabaseAdmin
    .from('books')
    .select('isbn')
    .not('isbn', 'is', null)
    .limit(5000);
  const tally = new Map<string, number>();
  for (const r of (data ?? []) as { isbn: string }[]) tally.set(r.isbn, (tally.get(r.isbn) ?? 0) + 1);
  return [...tally.entries()]
    .filter(([, c]) => c > 1)
    .map(([isbn, count]) => ({ isbn, count }))
    .sort((a, b) => b.count - a.count);
}
