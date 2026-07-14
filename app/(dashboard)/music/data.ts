import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type TrackRow = {
  id: string;
  category: string;
  mood: string;
  tier: string;
  title: string;
  storage_key: string;
  duration_seconds: number | null;
  sort: number;
  active: boolean;
  created_at: string;
};

/** All tracks, ordered by category then sort — grouped in the page. */
export async function listTracks(): Promise<TrackRow[]> {
  const { data, error } = await supabaseAdmin
    .from('music_tracks')
    .select('id, category, mood, tier, title, storage_key, duration_seconds, sort, active, created_at')
    .order('category', { ascending: true })
    .order('sort', { ascending: true })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as TrackRow[];
}
