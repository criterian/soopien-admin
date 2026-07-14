'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeMember, approveMember } from '../actions';
import type { ClubMember } from '../data';
import { fmtDate, initials } from '@/lib/format';

export function MembersPanel({ clubId, members }: { clubId: string; members: ClubMember[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = (userId: string, fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    setBusy(userId);
    start(async () => {
      const res = await fn();
      if (res && 'error' in res && res.error) setError(res.error);
      else router.refresh();
      setBusy(null);
    });
  };

  const active = members.filter((m) => m.status !== 'removed');

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Members ({active.length})</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {members.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>No members.</div>
        ) : (
          members.map((m) => {
            const name = m.profile?.display_name ?? m.profile?.username ?? m.user_id.slice(0, 8);
            const isAdmin = m.role === 'admin';
            return (
              <div
                key={m.user_id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--divider)', opacity: m.status === 'removed' ? 0.5 : 1 }}
              >
                <Link href={`/users/${m.user_id}`} className="user-cell" style={{ flex: 1, minWidth: 0 }}>
                  <span className="avatar">{initials(name)}</span>
                  <span style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                      {isAdmin ? <span className="chip admin">admin</span> : m.role === 'co_admin' ? <span className="chip">co-admin</span> : null}
                      {m.status === 'pending' ? <span className="chip">pending</span> : null}
                      {m.status === 'removed' ? <span className="chip archived">removed</span> : null}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>joined {fmtDate(m.joined_at)}</div>
                  </span>
                </Link>

                {m.status === 'pending' ? (
                  <button className="btn sm" disabled={pending && busy === m.user_id} onClick={() => run(m.user_id, () => approveMember(clubId, m.user_id))}>
                    Approve
                  </button>
                ) : null}
                {m.status === 'active' && !isAdmin ? (
                  <button className="btn sm danger" disabled={pending && busy === m.user_id} onClick={() => run(m.user_id, () => removeMember(clubId, m.user_id))}>
                    Remove
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
