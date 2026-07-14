import Link from 'next/link';
import { getLeaderboard, getAchievementDistribution, type LeaderRow } from './data';
import { levelFor, ACHIEVEMENT_LABELS } from './constants';
import { fmtNumber, initials } from '@/lib/format';

export const metadata = { title: 'Gamification · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function GamificationPage() {
  let leaders: LeaderRow[] = [];
  let dist: { key: string; count: number }[] = [];
  let error: string | null = null;
  try {
    [leaders, dist] = await Promise.all([getLeaderboard(50), getAchievementDistribution()]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load gamification data';
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Gamification</h1>
          <div className="sub">Points leaderboard &amp; achievements (PRD §4.6)</div>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>User</th>
                <th>Level</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {leaders.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">No data.</div>
                  </td>
                </tr>
              ) : (
                leaders.map((u, i) => {
                  const lvl = levelFor(u.total_points);
                  return (
                    <tr key={u.id}>
                      <td className="muted">{i + 1}</td>
                      <td className="primary">
                        <Link href={`/users/${u.id}`} className="user-cell">
                          <span className="avatar">{initials(u.display_name ?? u.username)}</span>
                          <span>
                            {u.display_name ?? u.username}
                            <div className="muted" style={{ fontSize: 12 }}>@{u.username}</div>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span title={`Level ${lvl.level}`}>
                          {lvl.emoji} {lvl.name}
                        </span>
                      </td>
                      <td className="primary">{fmtNumber(u.total_points)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Achievements earned</h2>
          {dist.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>None yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {dist.map((d) => (
                <div key={d.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{ACHIEVEMENT_LABELS[d.key] ?? d.key}</span>
                  <span className="muted">{fmtNumber(d.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
