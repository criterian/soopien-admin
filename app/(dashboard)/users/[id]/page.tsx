import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUser, getUserActivity } from '../data';
import { UserActions } from './UserActions';
import { requireAdmin } from '@/lib/auth';
import { fmtDate, fmtDateTime, fmtNumber, ageFromDob, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value small">{value}</div>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, user] = await Promise.all([requireAdmin(), getUser(id)]);
  if (!user) notFound();
  const activity = await getUserActivity(id);
  const age = ageFromDob(user.date_of_birth);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/users" className="muted" style={{ fontSize: 13 }}>
          ← Users
        </Link>
      </div>

      <div className="page-head">
        <div className="user-cell">
          <span className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
            {initials(user.display_name ?? user.username)}
          </span>
          <div>
            <h1 style={{ fontSize: 26 }}>{user.display_name ?? user.username}</h1>
            <div className="sub" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              @{user.username}
              {user.subscription_tier === 'premium' ? (
                <span className="chip premium">✦ premium</span>
              ) : (
                <span className="chip">freemium</span>
              )}
              {user.is_admin ? <span className="chip admin">admin</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div>
          <div className="stat-grid">
            <Metric label="Points" value={fmtNumber(user.total_points)} />
            <Metric label="Clips" value={fmtNumber(activity.clips)} />
            <Metric label="Books" value={fmtNumber(activity.books)} />
            <Metric label="Films" value={fmtNumber(activity.films)} />
            <Metric label="Reviews" value={fmtNumber(activity.reviews)} />
            <Metric label="Followers" value={fmtNumber(activity.followers)} />
            <Metric label="Following" value={fmtNumber(activity.following)} />
            <Metric label="Clubs" value={fmtNumber(activity.clubs)} />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 14 }}>Profile</h2>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12, fontSize: 13.5 }}>
              <dt className="muted">User ID</dt>
              <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{user.id}</dd>
              <dt className="muted">Age</dt>
              <dd style={{ margin: 0 }}>
                {age ?? '—'} {age !== null && age < 17 ? <span className="chip">under 17</span> : null}
              </dd>
              <dt className="muted">Date of birth</dt>
              <dd style={{ margin: 0 }}>{fmtDate(user.date_of_birth)}</dd>
              <dt className="muted">Premium until</dt>
              <dd style={{ margin: 0 }}>
                {user.subscription_tier !== 'premium' ? (
                  <span className="muted">—</span>
                ) : user.premium_until ? (
                  <>
                    {fmtDate(user.premium_until)}
                    {new Date(user.premium_until).getTime() < Date.now() ? (
                      <span className="chip" style={{ marginLeft: 6, background: 'rgba(192,80,74,0.12)', color: 'var(--rose)' }}>expired</span>
                    ) : null}
                  </>
                ) : (
                  'No expiry'
                )}
              </dd>
              <dt className="muted">Visibility</dt>
              <dd style={{ margin: 0 }}>{user.is_private ? 'Private' : 'Public'}</dd>
              <dt className="muted">Language</dt>
              <dd style={{ margin: 0 }}>{user.language ?? 'en'}</dd>
              <dt className="muted">Bio</dt>
              <dd style={{ margin: 0 }}>{user.bio || <span className="muted">—</span>}</dd>
              <dt className="muted">Joined</dt>
              <dd style={{ margin: 0 }}>{fmtDateTime(user.created_at)}</dd>
            </dl>
          </div>
        </div>

        <UserActions
          userId={user.id}
          tier={user.subscription_tier}
          premiumUntil={user.premium_until}
          isAdmin={user.is_admin}
          isSelf={me.id === user.id}
          username={user.username}
        />
      </div>
    </div>
  );
}
