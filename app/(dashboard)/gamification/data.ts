import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type LeaderRow = {
  id: string;
  username: string;
  display_name: string | null;
  total_points: number;
  subscription_tier: string;
};

export async function getLeaderboard(limit = 50): Promise<LeaderRow[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name, total_points, subscription_tier')
    .order('total_points', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderRow[];
}

/** Count of users holding each achievement (tallied from user_achievements). */
export async function getAchievementDistribution(): Promise<{ key: string; count: number }[]> {
  const { data } = await supabaseAdmin.from('user_achievements').select('key').limit(10000);
  const tally = new Map<string, number>();
  for (const r of (data ?? []) as { key: string }[]) tally.set(r.key, (tally.get(r.key) ?? 0) + 1);
  return [...tally.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}
