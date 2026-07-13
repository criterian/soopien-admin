import 'server-only';
import { supabaseAdmin } from './supabase/admin';

/** Exact row count for a table, optionally filtered. Cheap (head request). */
async function count(
  table: string,
  filter?: (q: ReturnType<typeof buildBase>) => ReturnType<typeof buildBase>,
): Promise<number> {
  let q = buildBase(table);
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) return 0;
  return n ?? 0;
}

function buildBase(table: string) {
  return supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export type DashboardStats = {
  users: number;
  premium: number;
  newUsers7d: number;
  clips: number;
  clips7d: number;
  books: number;
  films: number;
  clubs: number;
  pendingPayouts: number;
  newContact: number;
};

/** All dashboard KPIs, gathered concurrently. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const week = daysAgoISO(7);

  const [
    users,
    premium,
    newUsers7d,
    clips,
    clips7d,
    books,
    films,
    clubs,
    pendingPayouts,
    newContact,
  ] = await Promise.all([
    count('profiles'),
    count('profiles', (q) => q.eq('subscription_tier', 'premium')),
    count('profiles', (q) => q.gte('created_at', week)),
    count('clips'),
    count('clips', (q) => q.gte('created_at', week)),
    count('books'),
    count('films'),
    count('book_clubs'),
    count('club_payouts', (q) => q.eq('status', 'pending')),
    count('contact_messages', (q) => q.eq('status', 'new')),
  ]);

  return {
    users,
    premium,
    newUsers7d,
    clips,
    clips7d,
    books,
    films,
    clubs,
    pendingPayouts,
    newContact,
  };
}
