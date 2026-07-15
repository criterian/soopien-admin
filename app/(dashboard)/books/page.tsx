import Link from 'next/link';
import { listBooks, findDuplicateIsbns, PAGE_SIZE, type BookRow } from './data';
import { languageLabel } from './languages';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Books · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: BookRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listBooks({ q, page });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load books';
  }
  // Data-quality banner (cheap; only worth showing on the first page).
  const dupes = page === 1 && !q ? await findDuplicateIsbns().catch(() => []) : [];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/books?${s}` : '/books';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Books</h1>
          <div className="sub">{fmtNumber(total)} in catalog</div>
        </div>
      </div>

      {dupes.length > 0 ? (
        <div className="error-banner" style={{ background: 'rgba(232,184,75,0.14)', borderColor: 'rgba(194,138,44,0.4)', color: '#8a6316' }}>
          ⚠ {dupes.length} ISBN{dupes.length > 1 ? 's are' : ' is'} shared by multiple books (PRD §4.1 requires unique ISBNs):{' '}
          {dupes.slice(0, 6).map((d) => (
            <Link key={d.isbn} href={`/books?q=${d.isbn}`} style={{ color: 'inherit', textDecoration: 'underline', marginRight: 8 }}>
              {d.isbn} ×{d.count}
            </Link>
          ))}
        </div>
      ) : null}

      <form className="toolbar" action="/books" method="get">
        <input className="search-input" type="search" name="q" placeholder="Search title, author, or ISBN…" defaultValue={q ?? ''} />
        <button className="btn" type="submit">
          Search
        </button>
        {q ? (
          <Link className="btn sm" href="/books">
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>ISBN</th>
              <th>Lang</th>
              <th>Pages</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No books found.</div>
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id}>
                  <td className="primary" style={{ maxWidth: 300 }}>
                    <Link href={`/books/${b.id}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {b.cover_front_url ? (
                        <img src={b.cover_front_url} alt="" style={{ width: 28, height: 40, borderRadius: 3, objectFit: 'cover', background: 'var(--fill)' }} />
                      ) : (
                        <span style={{ width: 28, height: 40, borderRadius: 3, background: 'var(--fill)', display: 'inline-block' }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
                    </Link>
                  </td>
                  <td>{b.author ?? <span className="muted">—</span>}</td>
                  <td className="muted">{b.publisher ?? '—'}</td>
                  <td className="muted" style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.isbn ?? '—'}</td>
                  <td className="muted">{languageLabel(b.language)}</td>
                  <td className="muted">{b.page_count ?? '—'}</td>
                  <td className="muted">{fmtDate(b.created_at)}</td>
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
