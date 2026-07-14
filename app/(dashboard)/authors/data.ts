import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 30;

export type AuthorRow = {
  id: string;
  name: string;
  verified: boolean;
  claimed_by: string | null;
  photo_url: string | null;
  created_at: string;
  bookCount: number;
};

export async function listAuthors(opts: { q?: string; page?: number }): Promise<{ rows: AuthorRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('authors')
    .select('id, name, verified, claimed_by, photo_url, created_at', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.ilike('name', `%${q}%`);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const authors = (data ?? []) as Omit<AuthorRow, 'bookCount'>[];

  // Book counts for just this page, in one query.
  const ids = authors.map((a) => a.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: links } = await supabaseAdmin.from('book_authors').select('author_id').in('author_id', ids);
    for (const l of (links ?? []) as { author_id: string }[]) counts.set(l.author_id, (counts.get(l.author_id) ?? 0) + 1);
  }

  return {
    rows: authors.map((a) => ({ ...a, bookCount: counts.get(a.id) ?? 0 })),
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
} | null> {
  const { data } = await supabaseAdmin
    .from('authors')
    .select('id, name, bio, photo_url, verified, claimed_by, links, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;

  const { data: links } = await supabaseAdmin
    .from('book_authors')
    .select('role, book:books(id, title)')
    .eq('author_id', id)
    .limit(200);

  const books = ((links ?? []) as any[])
    .filter((l) => l.book)
    .map((l) => ({ id: l.book.id, title: l.book.title, role: l.role }));

  return { author: data as AuthorDetail, books };
}
