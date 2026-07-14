import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type PayoutRow = {
  id: string;
  period: string;
  total_net_cents: number;
  currency: string;
  method: string | null;
  status: string;
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  founder: { username: string; display_name: string | null } | null;
};

export async function listPayouts(status: string): Promise<PayoutRow[]> {
  let query = supabaseAdmin
    .from('club_payouts')
    .select('id, period, total_net_cents, currency, method, status, reference, paid_at, created_at, founder:profiles!club_payouts_founder_id_fkey(username, display_name)')
    .order('period', { ascending: false })
    .limit(300);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PayoutRow[];
}

export type EarningsSummary = { unpaidNetCents: number; foundersWithUnpaid: number; overThreshold: number };

const THRESHOLD_CENTS = 1000; // matches the API's $10 payout threshold

/** Unpaid-earnings overview — what the next payout run would produce. */
export async function getEarningsSummary(): Promise<EarningsSummary> {
  const { data } = await supabaseAdmin
    .from('club_earnings')
    .select('founder_id, net_cents')
    .is('payout_id', null)
    .limit(5000);
  const rows = (data ?? []) as { founder_id: string; net_cents: number }[];

  const byFounder = new Map<string, number>();
  let unpaidNetCents = 0;
  for (const r of rows) {
    unpaidNetCents += r.net_cents;
    byFounder.set(r.founder_id, (byFounder.get(r.founder_id) ?? 0) + r.net_cents);
  }
  const overThreshold = [...byFounder.values()].filter((n) => n >= THRESHOLD_CENTS).length;
  return { unpaidNetCents, foundersWithUnpaid: byFounder.size, overThreshold };
}
