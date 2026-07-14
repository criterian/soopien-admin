import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 25;
export type ReviewKind = 'book' | 'film';

export type ReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  contains_spoilers: boolean;
  is_private: boolean;
  created_at: string;
  user_id: string;
  profile: { username: string } | null;
  title: string | null;
};

export async function listReviews(opts: { kind: ReviewKind; page?: number }): Promise<{
  rows: ReviewRow[];
  total: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const table = opts.kind === 'film' ? 'film_reviews' : 'book_reviews';
  const titleRel = opts.kind === 'film' ? 'film:films(title)' : 'book:books(title)';

  const { data, count, error } = await supabaseAdmin
    .from(table)
    .select(`id, rating, body, contains_spoilers, is_private, created_at, user_id, profile:profiles(username), ${titleRel}`, {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    contains_spoilers: r.contains_spoilers,
    is_private: r.is_private,
    created_at: r.created_at,
    user_id: r.user_id,
    profile: r.profile,
    title: r.book?.title ?? r.film?.title ?? null,
  })) as ReviewRow[];

  return { rows, total: count ?? 0 };
}
