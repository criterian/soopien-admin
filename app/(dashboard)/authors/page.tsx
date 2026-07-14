import Link from 'next/link';
import { listAuthors, PAGE_SIZE, type AuthorRow } from './data';
import { fmtNumber, initials } from '@/lib/format';

export const metadata = { title: 'Authors · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: AuthorRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listAuthors({ q, page });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load authors';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/authors?${s}` : '/authors';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Authors</h1>
          <div className="sub">{fmtNumber(total)} author entities</div>
        </div>
      </div>

      <form className="toolbar" action="/authors" method="get">
        <input className="search-input" type="search" name="q" placeholder="Search author name…" defaultValue={q ?? ''} />
        <button className="btn" type="submit">
          Search
        </button>
        {q ? (
          <Link className="btn sm" href="/authors">
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Author</th>
              <th>Books</th>
              <th>Verified</th>
              <th>Claimed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty">No authors found.</div>
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id}>
                  <td className="primary">
                    <Link href={`/authors/${a.id}`} className="user-cell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {a.photo_url ? (
                        <img src={a.photo_url} alt="" className="avatar" style={{ objectFit: 'cover' }} />
                      ) : (
                        <span className="avatar">{initials(a.name)}</span>
                      )}
                      {a.name}
                    </Link>
                  </td>
                  <td>{fmtNumber(a.bookCount)}</td>
                  <td>{a.verified ? <span className="chip new">✓ verified</span> : <span className="muted">—</span>}</td>
                  <td>{a.claimed_by ? <span className="chip">claimed</span> : <span className="muted">—</span>}</td>
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
