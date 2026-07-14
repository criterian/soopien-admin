import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 30;

export type PublisherRow = {
  id: string;
  name: string;
  country: string | null;
  verified: boolean;
  claimed_by: string | null;
  logo_url: string | null;
  bookCount: number;
};

export async function listPublishers(opts: { q?: string; page?: number }): Promise<{ rows: PublisherRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('publishers')
    .select('id, name, country, verified, claimed_by, logo_url', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.ilike('name', `%${q}%`);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const pubs = (data ?? []) as Omit<PublisherRow, 'bookCount'>[];

  const ids = pubs.map((p) => p.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: books } = await supabaseAdmin.from('books').select('publisher_id').in('publisher_id', ids);
    for (const b of (books ?? []) as { publisher_id: string }[]) counts.set(b.publisher_id, (counts.get(b.publisher_id) ?? 0) + 1);
  }

  return {
    rows: pubs.map((p) => ({ ...p, bookCount: counts.get(p.id) ?? 0 })),
    total: count ?? 0,
  };
}

export type PublisherDetail = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  country: string | null;
  founded_year: number | null;
  verified: boolean;
  claimed_by: string | null;
};

export async function getPublisher(id: string): Promise<{
  publisher: PublisherDetail;
  books: { id: string; title: string }[];
} | null> {
  const { data } = await supabaseAdmin
    .from('publishers')
    .select('id, name, description, logo_url, website, country, founded_year, verified, claimed_by')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;

  const { data: books } = await supabaseAdmin.from('books').select('id, title').eq('publisher_id', id).limit(200);
  return { publisher: data as PublisherDetail, books: (books ?? []) as { id: string; title: string }[] };
}
