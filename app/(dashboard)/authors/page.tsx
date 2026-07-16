import Link from 'next/link';
import { listAuthors, PAGE_SIZE, type AuthorRow, type PeopleFilter } from './data';
import { fmtNumber, initials } from '@/lib/format';

export const metadata = { title: 'People · Soopien Admin' };
export const dynamic = 'force-dynamic';

const TABS: { key: PeopleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'authors', label: 'Book authors' },
  { key: 'cast', label: 'Film cast & crew' },
];

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const { q, page: pageParam, filter: filterParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const filter = (TABS.some((t) => t.key === filterParam) ? filterParam : 'all') as PeopleFilter;

  let rows: AuthorRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listAuthors({ q, page, filter });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load people';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter !== 'all') params.set('filter', filter);
    if (page > 1) params.set('page', String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 1 || (k === 'filter' && v === 'all')) params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `/authors?${s}` : '/authors';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>People</h1>
          <div className="sub">{fmtNumber(total)} people — book authors + film directors/cast (one shared registry)</div>
        </div>
      </div>

      <form className="toolbar" action="/authors" method="get">
        {filter !== 'all' ? <input type="hidden" name="filter" value={filter} /> : null}
        <input className="search-input" type="search" name="q" placeholder="Search name…" defaultValue={q ?? ''} />
        <button className="btn" type="submit">
          Search
        </button>
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        {TABS.map((t) => (
          <Link key={t.key} href={hrefFor({ filter: t.key, page: 1 })} className={`btn sm${filter === t.key ? ' primary' : ''}`}>
            {t.label}
          </Link>
        ))}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Person</th>
              <th>Books</th>
              <th>Films</th>
              <th>Verified</th>
              <th>Claimed</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty">No people found.</div>
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
                  <td>{a.bookCount > 0 ? fmtNumber(a.bookCount) : <span className="muted">—</span>}</td>
                  <td>{a.filmCount > 0 ? fmtNumber(a.filmCount) : <span className="muted">—</span>}</td>
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
