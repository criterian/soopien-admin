import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 25;

export type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  premium_until: string | null;
  is_admin: boolean;
  is_private: boolean;
  total_points: number;
  date_of_birth: string;
  language: string | null;
  created_at: string;
};

export type UserListResult = { rows: UserRow[]; total: number };

const COLS =
  'id, username, display_name, avatar_url, subscription_tier, premium_until, is_admin, is_private, total_points, date_of_birth, language, created_at';

/** Paginated user list with optional username/display-name search. */
export async function listUsers(opts: { q?: string; page?: number }): Promise<UserListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from('profiles')
    .select(COLS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const q = opts.q?.trim();
  if (q) {
    // Match username OR display name, case-insensitively.
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as UserRow[], total: count ?? 0 };
}

export type UserDetail = UserRow & {
  bio: string | null;
  film_streak?: number;
  streak_freezes?: number;
  updated_at: string;
};

export type UserActivity = {
  clips: number;
  books: number;
  films: number;
  reviews: number;
  followers: number;
  following: number;
  clubs: number;
};

export async function getUser(id: string): Promise<UserDetail | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select(`${COLS}, bio, updated_at`)
    .eq('id', id)
    .maybeSingle();
  return (data as UserDetail | null) ?? null;
}

/** Cross-table activity counts for a single user (concurrent). */
export async function getUserActivity(id: string): Promise<UserActivity> {
  const c = (table: string, col: string) =>
    supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(col, id)
      .then((r) => r.count ?? 0);

  const [clips, books, films, bookReviews, filmReviews, followers, following, clubs] =
    await Promise.all([
      c('clips', 'user_id'),
      c('user_books', 'user_id'),
      c('user_films', 'user_id'),
      c('book_reviews', 'user_id'),
      c('film_reviews', 'user_id'),
      c('follows', 'followee_id'),
      c('follows', 'follower_id'),
      c('club_members', 'user_id'),
    ]);

  return {
    clips,
    books,
    films,
    reviews: bookReviews + filmReviews,
    followers,
    following,
    clubs,
  };
}
