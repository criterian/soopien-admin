import Link from 'next/link';
import { listPayouts, getEarningsSummary, type PayoutRow } from './data';
import { GenerateRun, MarkPaidButton } from './PayoutControls';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Payouts · Soopien Admin' };
export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'failed', label: 'Failed' },
  { key: 'all', label: 'All' },
];

const money = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = TABS.some((t) => t.key === statusParam) ? statusParam! : 'pending';

  const summary = await getEarningsSummary().catch(() => null);
  let rows: PayoutRow[] = [];
  let error: string | null = null;
  try {
    rows = await listPayouts(status);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load payouts';
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Payouts</h1>
          <div className="sub">Founder payouts — paid out-of-band, monthly (PRD §4.8.1, §5.4)</div>
        </div>
      </div>

      {summary ? (
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Unpaid earnings (net)</div>
            <div className="value small">{money(summary.unpaidNetCents)}</div>
          </div>
          <div className="stat">
            <div className="label">Founders with unpaid</div>
            <div className="value small">{fmtNumber(summary.foundersWithUnpaid)}</div>
          </div>
          <div className="stat">
            <div className="label">Over $10 threshold</div>
            <div className="value small">{fmtNumber(summary.overThreshold)}</div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          <div className="toolbar">
            {TABS.map((t) => (
              <Link key={t.key} href={t.key === 'pending' ? '/payouts' : `/payouts?status=${t.key}`} className={`btn sm${status === t.key ? ' primary' : ''}`}>
                {t.label}
              </Link>
            ))}
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Founder</th>
                  <th>Period</th>
                  <th>Net</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">No {status === 'all' ? '' : status} payouts.</div>
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id}>
                      <td className="primary">@{p.founder?.username ?? p.id.slice(0, 8)}</td>
                      <td className="muted">{p.period}</td>
                      <td className="primary">{money(p.total_net_cents, p.currency)}</td>
                      <td className="muted">{p.method ?? '—'}</td>
                      <td>
                        {p.status === 'paid' ? (
                          <span className="chip new">paid</span>
                        ) : p.status === 'failed' ? (
                          <span className="chip" style={{ background: 'rgba(192,80,74,0.12)', color: 'var(--rose)' }}>failed</span>
                        ) : (
                          <span className="chip premium">pending</span>
                        )}
                        {p.status === 'paid' && p.paid_at ? (
                          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                            {fmtDate(p.paid_at)}
                            {p.reference ? ` · ${p.reference}` : ''}
                          </div>
                        ) : null}
                      </td>
                      <td>{p.status === 'pending' ? <MarkPaidButton id={p.id} /> : null}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <GenerateRun />
      </div>
    </div>
  );
}
