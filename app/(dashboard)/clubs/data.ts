import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 25;

export type ClubRow = {
  id: string;
  name: string;
  kind: string;
  visibility: string;
  is_paid: boolean;
  member_count: number;
  created_at: string;
  founder: { username: string } | null;
};

export async function listClubs(opts: { q?: string; page?: number; filter?: string }): Promise<{
  rows: ClubRow[];
  total: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('book_clubs')
    .select('id, name, kind, visibility, is_paid, member_count, created_at, founder:profiles!book_clubs_created_by_fkey(username)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.ilike('name', `%${q}%`);
  if (opts.filter === 'book' || opts.filter === 'film') query = query.eq('kind', opts.filter);
  if (opts.filter === 'paid') query = query.eq('is_paid', true);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as ClubRow[], total: count ?? 0 };
}

export type ClubMember = {
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export type ClubDetail = {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  visibility: string;
  is_paid: boolean;
  price_cents: number | null;
  invite_code: string | null;
  member_count: number;
  created_at: string;
  created_by: string;
  founder: { username: string; display_name: string | null } | null;
  activeTitle: string | null;
};

export async function getClub(id: string): Promise<{
  club: ClubDetail;
  members: ClubMember[];
  stats: { weeks: number; posts: number; tiers: number; paidMembers: number };
} | null> {
  const { data } = await supabaseAdmin
    .from('book_clubs')
    .select('id, name, description, kind, visibility, is_paid, price_cents, invite_code, member_count, created_at, created_by, current_book_id, current_film_id, founder:profiles!book_clubs_created_by_fkey(username, display_name)')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const c = data as any;

  // Resolve the active book/film title.
  let activeTitle: string | null = null;
  if (c.current_book_id) {
    const { data: b } = await supabaseAdmin.from('books').select('title').eq('id', c.current_book_id).maybeSingle();
    activeTitle = (b as { title?: string } | null)?.title ?? null;
  } else if (c.current_film_id) {
    const { data: f } = await supabaseAdmin.from('films').select('title').eq('id', c.current_film_id).maybeSingle();
    activeTitle = (f as { title?: string } | null)?.title ?? null;
  }

  const [members, weeks, posts, tiers, paidMembers] = await Promise.all([
    supabaseAdmin
      .from('club_members')
      .select('user_id, role, status, joined_at, profile:profiles(username, display_name, avatar_url)')
      .eq('club_id', id)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true })
      .limit(500),
    supabaseAdmin.from('club_weeks').select('*', { count: 'exact', head: true }).eq('club_id', id).then((r) => r.count ?? 0),
    supabaseAdmin.from('club_posts').select('*', { count: 'exact', head: true }).eq('club_id', id).then((r) => r.count ?? 0),
    supabaseAdmin.from('club_tiers').select('*', { count: 'exact', head: true }).eq('club_id', id).then((r) => r.count ?? 0),
    supabaseAdmin
      .from('club_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', id)
      .eq('status', 'active')
      .then((r) => r.count ?? 0),
  ]);

  return {
    club: {
      id: c.id,
      name: c.name,
      description: c.description,
      kind: c.kind,
      visibility: c.visibility,
      is_paid: c.is_paid,
      price_cents: c.price_cents,
      invite_code: c.invite_code,
      member_count: c.member_count,
      created_at: c.created_at,
      created_by: c.created_by,
      founder: c.founder,
      activeTitle,
    },
    members: (members.data ?? []) as unknown as ClubMember[],
    stats: { weeks, posts, tiers, paidMembers },
  };
}
