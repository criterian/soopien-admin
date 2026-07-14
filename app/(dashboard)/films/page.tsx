import Link from 'next/link';
import { listFilms, PAGE_SIZE, type FilmRow } from './data';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Films · Soopien Admin' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV' },
];

export default async function FilmsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const { q, page: pageParam, filter } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: FilmRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listFilms({ q, page, filter });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load films';
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
    return s ? `/films?${s}` : '/films';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Films</h1>
          <div className="sub">{fmtNumber(total)} in catalog</div>
        </div>
      </div>

      <form className="toolbar" action="/films" method="get">
        {filter ? <input type="hidden" name="filter" value={filter} /> : null}
        <input className="search-input" type="search" name="q" placeholder="Search title or director…" defaultValue={q ?? ''} />
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
              <th>Title</th>
              <th>Type</th>
              <th>Year</th>
              <th>Director</th>
              <th>IMDb</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No films found.</div>
                </td>
              </tr>
            ) : (
              rows.map((f) => (
                <tr key={f.id}>
                  <td className="primary" style={{ maxWidth: 320 }}>
                    <Link href={`/films/${f.id}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {f.poster_url ? (
                        <img src={f.poster_url} alt="" style={{ width: 28, height: 40, borderRadius: 3, objectFit: 'cover', background: 'var(--fill)' }} />
                      ) : (
                        <span style={{ width: 28, height: 40, borderRadius: 3, background: 'var(--fill)', display: 'inline-block' }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</span>
                    </Link>
                  </td>
                  <td>
                    <span className="chip">{f.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                  </td>
                  <td className="muted">{f.release_year ?? '—'}</td>
                  <td className="muted">{f.director ?? '—'}</td>
                  <td className="muted">{f.imdb_rating != null ? f.imdb_rating : '—'}</td>
                  <td className="muted">{fmtDate(f.created_at)}</td>
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
