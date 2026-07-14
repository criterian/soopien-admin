import Link from 'next/link';
import { listPublishers, PAGE_SIZE, type PublisherRow } from './data';
import { fmtNumber, initials } from '@/lib/format';

export const metadata = { title: 'Publishers · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function PublishersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: PublisherRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listPublishers({ q, page });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load publishers';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/publishers?${s}` : '/publishers';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Publishers</h1>
          <div className="sub">{fmtNumber(total)} publisher entities</div>
        </div>
      </div>

      <form className="toolbar" action="/publishers" method="get">
        <input className="search-input" type="search" name="q" placeholder="Search publisher name…" defaultValue={q ?? ''} />
        <button className="btn" type="submit">
          Search
        </button>
        {q ? (
          <Link className="btn sm" href="/publishers">
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Publisher</th>
              <th>Country</th>
              <th>Books</th>
              <th>Verified</th>
              <th>Claimed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty">No publishers found.</div>
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="primary">
                    <Link href={`/publishers/${p.id}`} className="user-cell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.logo_url ? (
                        <img src={p.logo_url} alt="" className="avatar" style={{ objectFit: 'contain', background: '#fff' }} />
                      ) : (
                        <span className="avatar">{initials(p.name)}</span>
                      )}
                      {p.name}
                    </Link>
                  </td>
                  <td className="muted">{p.country ?? '—'}</td>
                  <td>{fmtNumber(p.bookCount)}</td>
                  <td>{p.verified ? <span className="chip new">✓ verified</span> : <span className="muted">—</span>}</td>
                  <td>{p.claimed_by ? <span className="chip">claimed</span> : <span className="muted">—</span>}</td>
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
  );
}
