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
