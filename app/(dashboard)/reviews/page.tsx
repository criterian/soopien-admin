import Link from 'next/link';
import { listReviews, PAGE_SIZE, type ReviewKind, type ReviewRow } from './data';
import { DeleteReview } from './DeleteReview';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Reviews · Soopien Admin' };
export const dynamic = 'force-dynamic';

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: 'var(--gold)', letterSpacing: 1 }} title={`${n}/5`}>
      {'★'.repeat(n)}
      <span style={{ color: 'var(--faint)' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; page?: string }>;
}) {
  const { kind: kindParam, page: pageParam } = await searchParams;
  const kind: ReviewKind = kindParam === 'film' ? 'film' : 'book';
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: ReviewRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listReviews({ kind, page });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load reviews';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => `/reviews?kind=${kind}${p > 1 ? `&page=${p}` : ''}`;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Reviews</h1>
          <div className="sub">{fmtNumber(total)} {kind} reviews</div>
        </div>
      </div>

      <div className="toolbar">
        <Link href="/reviews?kind=book" className={`btn sm${kind === 'book' ? ' primary' : ''}`}>
          Books
        </Link>
        <Link href="/reviews?kind=film" className={`btn sm${kind === 'film' ? ' primary' : ''}`}>
          Films
        </Link>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Rating</th>
              <th>Review</th>
              <th>{kind === 'film' ? 'Film' : 'Book'}</th>
              <th>By</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No reviews found.</div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Stars n={r.rating} />
                  </td>
                  <td className="primary" style={{ maxWidth: 320 }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {r.contains_spoilers ? <span className="chip">spoiler</span> : null}
                      {r.is_private ? <span className="chip private">private</span> : null}
                    </div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.body || <span className="muted">(no text)</span>}
                    </div>
                  </td>
                  <td>{r.title ?? <span className="muted">—</span>}</td>
                  <td>
                    <Link href={`/users/${r.user_id}`} style={{ color: 'var(--terracotta)' }}>
                      @{r.profile?.username ?? r.user_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="muted">{fmtDate(r.created_at)}</td>
                  <td>
                    <DeleteReview kind={kind} id={r.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="pagination">
          {page > 1 ? (
            <Link className="btn sm" href={pageHref(page - 1)}>
              ← Prev
            </Link>
          ) : null}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="btn sm" href={pageHref(page + 1)}>
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
