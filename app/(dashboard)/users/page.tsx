import Link from 'next/link';
import { listUsers, PAGE_SIZE } from './data';
import { fmtDate, fmtNumber, ageFromDob, initials } from '@/lib/format';

export const metadata = { title: 'Users · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let rows: Awaited<ReturnType<typeof listUsers>>['rows'] = [];
  let total = 0;
  let error: string | null = null;
  try {
    const res = await listUsers({ q, page });
    rows = res.rows;
    total = res.total;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load users';
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/users?${s}` : '/users';
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <div className="sub">{fmtNumber(total)} accounts</div>
        </div>
      </div>

      <form className="toolbar" action="/users" method="get">
        <input
          className="search-input"
          type="search"
          name="q"
          placeholder="Search by username or display name…"
          defaultValue={q ?? ''}
        />
        <button className="btn" type="submit">
          Search
        </button>
        {q ? (
          <Link className="btn sm" href="/users">
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>Tier</th>
              <th>Age</th>
              <th>Visibility</th>
              <th>Points</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No users found.</div>
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className="primary">
                    <Link href={`/users/${u.id}`} className="user-cell">
                      <span className="avatar">{initials(u.display_name ?? u.username)}</span>
                      <span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {u.display_name ?? u.username}
                          {u.is_admin ? <span className="chip admin">admin</span> : null}
                        </div>
                        <div className="muted" style={{ fontSize: 12.5 }}>
                          @{u.username}
                        </div>
                      </span>
                    </Link>
                  </td>
                  <td>
                    {u.subscription_tier === 'premium' ? (
                      <span className="chip premium">✦ premium</span>
                    ) : (
                      <span className="chip">freemium</span>
                    )}
                  </td>
                  <td>{ageFromDob(u.date_of_birth) ?? '—'}</td>
                  <td>
                    {u.is_private ? (
                      <span className="chip private">private</span>
                    ) : (
                      <span className="muted">public</span>
                    )}
                  </td>
                  <td>{fmtNumber(u.total_points)}</td>
                  <td className="muted">{fmtDate(u.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="pagination">
          {page > 1 ? (
            <Link className="btn sm" href={qs(page - 1)}>
              ← Prev
            </Link>
          ) : (
            <span className="btn sm" style={{ opacity: 0.4 }}>
              ← Prev
            </span>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="btn sm" href={qs(page + 1)}>
              Next →
            </Link>
          ) : (
            <span className="btn sm" style={{ opacity: 0.4 }}>
              Next →
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
