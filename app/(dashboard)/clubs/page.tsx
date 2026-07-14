import Link from 'next/link';
import { listClubs, PAGE_SIZE, type ClubRow } from './data';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Clubs · Soopien Admin' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'book', label: 'Book' },
  { key: 'film', label: 'Film' },
  { key: 'paid', label: 'Paid' },
];

const VIS: Record<string, string> = { public: 'public', private: 'private', secret: 'secret' };

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const { q, page: pageParam, filter } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: ClubRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listClubs({ q, page, filter });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load clubs';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter) params.set('filter', filter);
    if (page > 1) params.set('page', String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 1) params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `/clubs?${s}` : '/clubs';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Clubs</h1>
          <div className="sub">{fmtNumber(total)} clubs</div>
        </div>
      </div>

      <form className="toolbar" action="/clubs" method="get">
        {filter ? <input type="hidden" name="filter" value={filter} /> : null}
        <input className="search-input" type="search" name="q" placeholder="Search club name…" defaultValue={q ?? ''} />
        <button className="btn" type="submit">
          Search
        </button>
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        {FILTERS.map((f) => (
          <Link key={f.key} href={hrefFor({ filter: f.key, page: 1 })} className={`btn sm${(filter ?? '') === f.key ? ' primary' : ''}`}>
            {f.label}
          </Link>
        ))}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Club</th>
              <th>Type</th>
              <th>Visibility</th>
              <th>Founder</th>
              <th>Members</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No clubs found.</div>
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td className="primary">
                    <Link href={`/clubs/${c.id}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {c.name}
                      {c.is_paid ? <span className="chip premium">paid</span> : null}
                    </Link>
                  </td>
                  <td>
                    <span className="chip">{c.kind === 'film' ? '▦ film' : '▤ book'}</span>
                  </td>
                  <td className="muted">{VIS[c.visibility] ?? c.visibility}</td>
                  <td>
                    <span className="muted">@{c.founder?.username ?? '—'}</span>
                  </td>
                  <td>{fmtNumber(c.member_count)}</td>
                  <td className="muted">{fmtDate(c.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="pagination">
          {page > 1 ? (
            <Link className="btn sm" href={hrefFor({ page: page - 1 })}>
              ← Prev
            </Link>
          ) : null}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="btn sm" href={hrefFor({ page: page + 1 })}>
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
