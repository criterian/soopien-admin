import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 30;

export type PeopleFilter = 'all' | 'authors' | 'cast';

export type AuthorRow = {
  id: string;
  name: string;
  verified: boolean;
  claimed_by: string | null;
  photo_url: string | null;
  created_at: string;
  bookCount: number;
  filmCount: number;
};

/**
 * People registry. The `authors` table is shared: book authors AND film
 * directors/cast live here (linked via book_authors / film_people). The filter
 * uses `!inner` embeds to narrow to rows that actually have that kind of credit.
 */
export async function listAuthors(opts: { q?: string; page?: number; filter?: PeopleFilter }): Promise<{ rows: AuthorRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const filter = opts.filter ?? 'all';

  const embed = filter === 'authors' ? ', book_authors!inner(book_id)' : filter === 'cast' ? ', film_people!inner(film_id)' : '';

  let query = supabaseAdmin
    .from('authors')
    .select(`id, name, verified, claimed_by, photo_url, created_at${embed}`, { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.ilike('name', `%${q}%`);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const authors = (data ?? []) as unknown as { id: string; name: string; verified: boolean; claimed_by: string | null; photo_url: string | null; created_at: string }[];

  // Book + film credit counts for just this page, one query each.
  const ids = authors.map((a) => a.id);
  const books = new Map<string, number>();
  const films = new Map<string, number>();
  if (ids.length) {
    const [ba, fp] = await Promise.all([
      supabaseAdmin.from('book_authors').select('author_id').in('author_id', ids),
      supabaseAdmin.from('film_people').select('author_id').in('author_id', ids),
    ]);
    for (const l of (ba.data ?? []) as { author_id: string }[]) books.set(l.author_id, (books.get(l.author_id) ?? 0) + 1);
    for (const l of (fp.data ?? []) as { author_id: string }[]) films.set(l.author_id, (films.get(l.author_id) ?? 0) + 1);
  }

  return {
    rows: authors.map((a) => ({ ...a, bookCount: books.get(a.id) ?? 0, filmCount: films.get(a.id) ?? 0 })),
    total: count ?? 0,
  };
}

export type AuthorDetail = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  verified: boolean;
  claimed_by: string | null;
  links: Record<string, unknown>;
  created_at: string;
};

export async function getAuthor(id: string): Promise<{
  author: AuthorDetail;
  books: { id: string; title: string; role: string }[];
  films: { id: string; title: string; role: string; character: string | null }[];
} | null> {
  const { data } = await supabaseAdmin
    .from('authors')
    .select('id, name, bio, photo_url, verified, claimed_by, links, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;

  const [ba, fp] = await Promise.all([
    supabaseAdmin.from('book_authors').select('role, book:books(id, title)').eq('author_id', id).limit(200),
    supabaseAdmin.from('film_people').select('role, character, position, film:films(id, title)').eq('author_id', id).order('position', { ascending: true }).limit(200),
  ]);

  const books = ((ba.data ?? []) as any[]).filter((l) => l.book).map((l) => ({ id: l.book.id, title: l.book.title, role: l.role }));
  const films = ((fp.data ?? []) as any[])
    .filter((l) => l.film)
    .map((l) => ({ id: l.film.id, title: l.film.title, role: l.role, character: l.character ?? null }));

  return { author: data as AuthorDetail, books, films };
}
