import Link from 'next/link';
import { getAffiliateAnalytics } from './data';
import { TimeseriesChart } from './TimeseriesChart';
import { COUNTRY_LABEL, OFFER_PROVIDER_META, type AffiliateAnalytics, type OfferCountry } from './constants';

export const metadata = { title: 'Affiliate analytics · Soopien Admin' };
export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90] as const;

const EMPTY: AffiliateAnalytics = {
  days: 30,
  totalClicks: 0,
  byProvider: [],
  byCountry: [],
  timeseries: [],
  topBooks: [],
  capped: false,
};

/** Horizontal CSS bar rows for a breakdown. */
function BarList({ rows, color }: { rows: { key: string; label: string; value: number; color?: string }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div className="empty" style={{ padding: 16 }}>No data yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r) => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 120, fontSize: 13, color: 'var(--text2)' }}>{r.label}</span>
          <div style={{ flex: 1, height: 8, background: 'var(--fill)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: r.color ?? color ?? 'var(--terracotta)', borderRadius: 4 }} />
          </div>
          <span style={{ width: 44, textAlign: 'right', fontSize: 13, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AffiliateAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.days) as (typeof RANGES)[number]) ? Number(sp.days) : 30;

  let a = EMPTY;
  let error: string | null = null;
  try {
    a = await getAffiliateAnalytics(days);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load analytics';
  }

  const topProvider = a.byProvider[0];
  const topCountry = a.byCountry[0];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Affiliate analytics</h1>
          <div className="sub">Book buy-link clicks — attribution &amp; demand</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="toolbar" style={{ display: 'flex', gap: 4 }}>
            {RANGES.map((r) => (
              <Link key={r} href={`/affiliates?days=${r}`} className={`btn sm${r === days ? ' primary' : ''}`}>
                {r}d
              </Link>
            ))}
          </div>
          <Link href="/affiliates/config" className="btn sm">
            Config →
          </Link>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {a.capped ? <div className="error-banner" style={{ background: 'var(--fill)', color: 'var(--muted)' }}>Showing a capped sample — totals may undercount.</div> : null}

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="label">Total clicks</div>
          <div className="value">{a.totalClicks}</div>
          <div className="delta muted">last {a.days} days</div>
        </div>
        <div className="stat">
          <div className="label">Top seller</div>
          <div className="value">{topProvider ? topProvider.label : '—'}</div>
          <div className="delta muted">{topProvider ? `${topProvider.clicks} clicks` : 'no clicks yet'}</div>
        </div>
        <div className="stat">
          <div className="label">Top marketplace</div>
          <div className="value">{topCountry ? topCountry.country : '—'}</div>
          <div className="delta muted">{topCountry ? `${topCountry.clicks} clicks` : 'no clicks yet'}</div>
        </div>
        <div className="stat">
          <div className="label">Books with clicks</div>
          <div className="value">{a.topBooks.length}</div>
          <div className="delta muted">unique titles</div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, marginBottom: 12 }}>Clicks over time</h2>
        <TimeseriesChart points={a.timeseries} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>By seller</h2>
          <BarList rows={a.byProvider.map((p) => ({ key: p.provider, label: p.label, value: p.clicks, color: OFFER_PROVIDER_META[p.provider]?.color }))} />
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>By marketplace</h2>
          <BarList rows={a.byCountry.map((c) => ({ key: c.country, label: COUNTRY_LABEL[c.country as OfferCountry] ?? c.country, value: c.clicks }))} color="var(--navy)" />
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 15, marginBottom: 12 }}>Most-clicked books</h2>
        {a.topBooks.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>No clicks yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th style={{ textAlign: 'right' }}>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {a.topBooks.map((b) => (
                  <tr key={b.bookId}>
                    <td>
                      <Link href={`/books/${b.bookId}`} style={{ color: 'var(--terracotta)' }}>
                        {b.title}
                      </Link>
                    </td>
                    <td className="muted">{b.author ?? '—'}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
