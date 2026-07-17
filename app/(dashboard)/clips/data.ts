import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 25;

export type ClipRow = {
  id: string;
  type: string;
  primary_text: string | null;
  note: string | null;
  is_private: boolean;
  contains_spoilers: boolean;
  mature_content: boolean;
  created_at: string;
  user_id: string;
  profile: { username: string } | null;
  book: { title: string } | null;
  film: { title: string } | null;
};

export async function listClips(opts: { q?: string; page?: number; filter?: string }): Promise<{
  rows: ClipRow[];
  total: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('clips')
    .select(
      'id, type, primary_text, note, is_private, contains_spoilers, mature_content, created_at, user_id, profile:profiles(username), book:books(title), film:films(title)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.ilike('primary_text', `%${q}%`);
  if (opts.filter === 'mature') query = query.eq('mature_content', true);
  if (opts.filter === 'spoiler') query = query.eq('contains_spoilers', true);
  if (opts.filter === 'private') query = query.eq('is_private', true);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as ClipRow[], total: count ?? 0 };
}

export type ClipComment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: { username: string; display_name: string | null } | null;
};

export type ClipDetail = {
  id: string;
  type: string;
  primary_text: string | null;
  secondary_text: string | null;
  note: string | null;
  external_url: string | null;
  page: number | null;
  metadata: Record<string, unknown>;
  is_private: boolean;
  contains_spoilers: boolean;
  mature_content: boolean;
  created_at: string;
  user_id: string;
  profile: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  book: { id: string; title: string; cover_front_url: string | null } | null;
  film: { id: string; title: string; poster_url: string | null } | null;
};

export async function getClip(id: string): Promise<{
  clip: ClipDetail;
  likes: number;
  comments: ClipComment[];
  collections: { id: string; name: string }[];
} | null> {
  const { data } = await supabaseAdmin
    .from('clips')
    .select(
      'id, type, primary_text, secondary_text, note, external_url, page, metadata, is_private, contains_spoilers, mature_content, created_at, user_id, profile:profiles(id, username, display_name, avatar_url), book:books(id, title, cover_front_url), film:films(id, title, poster_url)',
    )
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;

  const [likesRes, commentsRes, collectionsRes] = await Promise.all([
    supabaseAdmin.from('clip_likes').select('*', { count: 'exact', head: true }).eq('clip_id', id),
    supabaseAdmin
      .from('clip_comments')
      .select('id, body, created_at, user_id, author:profiles(username, display_name)')
      .eq('clip_id', id)
      .order('created_at', { ascending: true })
      .limit(500),
    supabaseAdmin.from('collection_clips').select('collection:collections(id, name)').eq('clip_id', id).limit(100),
  ]);

  const collections = ((collectionsRes.data ?? []) as any[])
    .map((r) => r.collection)
    .filter(Boolean)
    .map((c: any) => ({ id: c.id, name: c.name }));

  return {
    clip: data as unknown as ClipDetail,
    likes: likesRes.count ?? 0,
    comments: (commentsRes.data ?? []) as unknown as ClipComment[],
    collections,
  };
}
