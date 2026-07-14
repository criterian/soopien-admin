import Link from 'next/link';
import { listClips, PAGE_SIZE, type ClipRow } from './data';
import { ClipActions } from './ClipActions';
import { fmtDate, fmtNumber } from '@/lib/format';

export const metadata = { title: 'Clips · Soopien Admin' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'mature', label: 'Mature' },
  { key: 'spoiler', label: 'Spoiler' },
  { key: 'private', label: 'Private' },
];

export default async function ClipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const { q, page: pageParam, filter } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: ClipRow[] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listClips({ q, page, filter });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load clips';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (patch: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter) params.set('filter', filter);
    if (page > 1) params.set('page', String(page));
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 1) params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `/clips?${s}` : '/clips';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Clips</h1>
          <div className="sub">{fmtNumber(total)} clips</div>
        </div>
      </div>

      <form className="toolbar" action="/clips" method="get">
        {filter ? <input type="hidden" name="filter" value={filter} /> : null}
        <input className="search-input" type="search" name="q" placeholder="Search clip text…" defaultValue={q ?? ''} />
        <button className="btn" type="submit">
          Search
        </button>
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        {FILTERS.map((f) => (
          <Link key={f.key} href={qs({ filter: f.key, page: 1 })} className={`btn sm${(filter ?? '') === f.key ? ' primary' : ''}`}>
            {f.label}
          </Link>
        ))}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Clip</th>
              <th>Type</th>
              <th>By</th>
              <th>Flags</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No clips found.</div>
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td className="primary" style={{ maxWidth: 340 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.primary_text || <span className="muted">(no text)</span>}
                    </div>
                    {c.book?.title || c.film?.title ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        from {c.book?.title ?? c.film?.title}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className="chip">{c.type}</span>
                  </td>
                  <td>
                    <Link href={`/users/${c.user_id}`} style={{ color: 'var(--terracotta)' }}>
                      @{c.profile?.username ?? c.user_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.mature_content ? <span className="chip admin">mature</span> : null}
                      {c.contains_spoilers ? <span className="chip">spoiler</span> : null}
                      {c.is_private ? <span className="chip private">private</span> : null}
                    </div>
                  </td>
                  <td className="muted">{fmtDate(c.created_at)}</td>
                  <td>
                    <ClipActions clipId={c.id} mature={c.mature_content} />
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
            <Link className="btn sm" href={qs({ page: page - 1 })}>
              ← Prev
            </Link>
          ) : null}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="btn sm" href={qs({ page: page + 1 })}>
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
