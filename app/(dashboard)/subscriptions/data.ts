import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BILLING_PROVIDERS, type BillingProvider } from './constants';

export const PAGE_SIZE = 30;
export type { BillingProvider };

export type PremiumSubRow = {
  user_id: string;
  provider: string;
  status: string;
  plan: string | null;
  price_cents: number | null;
  current_period_end: string | null;
  created_at: string;
  profile: { username: string; display_name: string | null } | null;
};

export async function listPremiumSubs(opts: { status?: string; page?: number }): Promise<{ rows: PremiumSubRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  // premium_subscriptions.user_id → auth.users (not public.profiles), so there's
  // no PostgREST relationship to embed. Fetch the rows, then join usernames in JS.
  let query = supabaseAdmin
    .from('premium_subscriptions')
    .select('user_id, provider, status, plan, price_cents, current_period_end, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const subs = (data ?? []) as Omit<PremiumSubRow, 'profile'>[];

  const ids = subs.map((s) => s.user_id);
  const byId = new Map<string, { username: string; display_name: string | null }>();
  if (ids.length) {
    const { data: profs } = await supabaseAdmin.from('profiles').select('id, username, display_name').in('id', ids);
    for (const p of (profs ?? []) as { id: string; username: string; display_name: string | null }[]) {
      byId.set(p.id, { username: p.username, display_name: p.display_name });
    }
  }

  return {
    rows: subs.map((s) => ({ ...s, profile: byId.get(s.user_id) ?? null })),
    total: count ?? 0,
  };
}

export type SubSummary = { active: number; revenuecat: number; lemonsqueezy: number; pastDue: number };

/** Headline counts for the subscriptions page. */
export async function getSubSummary(): Promise<SubSummary> {
  const c = (f: (q: any) => any) => f(supabaseAdmin.from('premium_subscriptions').select('*', { count: 'exact', head: true })).then((r: any) => r.count ?? 0);
  const [active, revenuecat, lemonsqueezy, pastDue] = await Promise.all([
    c((q) => q.eq('status', 'active')),
    c((q) => q.eq('status', 'active').eq('provider', 'revenuecat')),
    c((q) => q.eq('status', 'active').eq('provider', 'lemonsqueezy')),
    c((q) => q.eq('status', 'past_due')),
  ]);
  return { active, revenuecat, lemonsqueezy, pastDue };
}

/** The active personal-Premium billing rail (from app_config, default revenuecat). */
export async function getBillingProvider(): Promise<BillingProvider> {
  const { data } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'premium_billing_provider')
    .maybeSingle();
  const v = (data as { value?: string } | null)?.value;
  return (BILLING_PROVIDERS as readonly string[]).includes(v ?? '') ? (v as BillingProvider) : 'revenuecat';
}
