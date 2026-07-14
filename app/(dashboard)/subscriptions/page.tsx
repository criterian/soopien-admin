import Link from 'next/link';
import { listPremiumSubs, getSubSummary, getBillingProvider, PAGE_SIZE, type PremiumSubRow } from './data';
import { BillingProviderCard } from './BillingProviderCard';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Subscriptions · Soopien Admin' };
export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'past_due', label: 'Past due' },
  { key: 'canceled', label: 'Canceled' },
  { key: 'expired', label: 'Expired' },
  { key: 'all', label: 'All' },
];

function money(cents: number | null): string {
  return cents == null ? '—' : `$${(cents / 100).toFixed(2)}`;
}

function StatusChip({ s }: { s: string }) {
  const cls = s === 'active' ? 'new' : s === 'past_due' ? 'premium' : 'archived';
  return <span className={`chip ${cls}`}>{s.replace('_', ' ')}</span>;
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = TABS.some((t) => t.key === statusParam) ? statusParam! : 'active';
  const page = Math.max(1, Number(pageParam) || 1);

  const [summary, provider] = await Promise.all([getSubSummary().catch(() => null), getBillingProvider().catch(() => 'revenuecat' as const)]);

  let rows: PremiumSubRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listPremiumSubs({ status, page });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load subscriptions';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `/subscriptions?status=${status}${p > 1 ? `&page=${p}` : ''}`;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Subscriptions</h1>
          <div className="sub">Personal Premium (PRD §5)</div>
        </div>
      </div>

      {summary ? (
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Active premium</div>
            <div className="value small">{fmtNumber(summary.active)}</div>
          </div>
          <div className="stat">
            <div className="label">via RevenueCat</div>
            <div className="value small">{fmtNumber(summary.revenuecat)}</div>
          </div>
          <div className="stat">
            <div className="label">via Lemon Squeezy</div>
            <div className="value small">{fmtNumber(summary.lemonsqueezy)}</div>
          </div>
          <div className="stat">
            <div className="label">Past due</div>
            <div className="value small">{fmtNumber(summary.pastDue)}</div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          <div className="toolbar">
            {TABS.map((t) => (
              <Link key={t.key} href={t.key === 'active' ? '/subscriptions' : `/subscriptions?status=${t.key}`} className={`btn sm${status === t.key ? ' primary' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Provider</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Renews</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">No {status === 'all' ? '' : status} subscriptions.</div>
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.user_id}>
                      <td className="primary">
                        <Link href={`/users/${s.user_id}`} style={{ color: 'var(--terracotta)' }}>
                          @{s.profile?.username ?? s.user_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="muted">{s.provider}</td>
                      <td>{s.plan ?? '—'}</td>
                      <td>{money(s.price_cents)}</td>
                      <td>
                        <StatusChip s={s.status} />
                      </td>
                      <td className="muted">{fmtDate(s.current_period_end)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="pagination">
              {page > 1 ? (
                <Link className="btn sm" href={href(page - 1)}>
                  ← Prev
                </Link>
              ) : null}
              <span>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link className="btn sm" href={href(page + 1)}>
                  Next →
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <BillingProviderCard current={provider} />
      </div>
    </div>
  );
}
