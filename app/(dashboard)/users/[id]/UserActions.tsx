'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setTier, setAdmin, deleteUser } from '../actions';

type Props = {
  userId: string;
  tier: string;
  isAdmin: boolean;
  isSelf: boolean;
  username: string;
};

export function UserActions({ userId, tier, isAdmin, isSelf, username }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res && 'error' in res && res.error) setError(res.error);
      else router.refresh();
    });
  };

  const confirmDelete = () => {
    const typed = window.prompt(
      `Permanently delete @${username} and all their content? This cannot be undone.\n\nType the username to confirm:`,
    );
    if (typed === username) run(() => deleteUser(userId));
    else if (typed !== null) setError('Username did not match — deletion cancelled.');
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, marginBottom: 14 }}>Admin actions</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Row label="Subscription tier" value={tier === 'premium' ? 'Premium ✦' : 'Freemium'}>
          {tier === 'premium' ? (
            <button className="btn sm" disabled={pending} onClick={() => run(() => setTier(userId, 'freemium'))}>
              Downgrade to freemium
            </button>
          ) : (
            <button className="btn sm primary" disabled={pending} onClick={() => run(() => setTier(userId, 'premium'))}>
              Grant premium
            </button>
          )}
        </Row>

        <Row label="Admin access" value={isAdmin ? 'Granted' : 'None'}>
          {isAdmin ? (
            <button
              className="btn sm"
              disabled={pending || isSelf}
              title={isSelf ? 'You cannot revoke your own access' : undefined}
              onClick={() => run(() => setAdmin(userId, false))}
            >
              Revoke admin
            </button>
          ) : (
            <button className="btn sm" disabled={pending} onClick={() => run(() => setAdmin(userId, true))}>
              Make admin
            </button>
          )}
        </Row>

        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 14, marginTop: 2 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 8 }}>
            Danger zone — GDPR deletion removes the account and all owned content.
          </div>
          <button
            className="btn sm danger"
            disabled={pending || isSelf}
            title={isSelf ? 'You cannot delete your own account here' : undefined}
            onClick={confirmDelete}
          >
            Delete user permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>{label}</div>
        <div style={{ fontWeight: 500 }}>{value}</div>
      </div>
      {children}
    </div>
  );
}
