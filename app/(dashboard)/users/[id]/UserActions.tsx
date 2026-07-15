'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setTier, setAdmin, deleteUser } from '../actions';

type Props = {
  userId: string;
  tier: string;
  premiumUntil: string | null;
  isAdmin: boolean;
  isSelf: boolean;
  username: string;
};

/** YYYY-MM-DD `n` months from today — for the expiry presets. */
function inMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function UserActions({ userId, tier, premiumUntil, isAdmin, isSelf, username }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [until, setUntil] = useState(premiumUntil ? premiumUntil.slice(0, 10) : '');

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
        <div>
          <Row
            label="Subscription tier"
            value={
              tier === 'premium'
                ? `Premium ✦ ${premiumUntil ? `· until ${new Date(premiumUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : '· no expiry'}`
                : 'Freemium'
            }
          >
            <button className="btn sm" disabled={pending} onClick={() => setEditing((e) => !e)}>
              {editing ? 'Cancel' : tier === 'premium' ? 'Change' : 'Grant premium'}
            </button>
          </Row>

          {editing ? (
            <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-elev)', border: '1px solid var(--divider)', borderRadius: 8 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 8 }}>
                Premium until — leave empty for no expiry.
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  value={until}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setUntil(e.target.value)}
                  style={{ flex: 1, minWidth: 130, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                {until ? (
                  <button className="btn sm" onClick={() => setUntil('')} title="No expiry">
                    Clear
                  </button>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { label: '+1 month', months: 1 },
                  { label: '+3 months', months: 3 },
                  { label: '+1 year', months: 12 },
                ].map((p) => (
                  <button key={p.label} className="btn sm" onClick={() => setUntil(inMonths(p.months))}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  className="btn sm primary"
                  disabled={pending}
                  onClick={() => run(async () => {
                    const res = await setTier(userId, 'premium', until || null);
                    if (!res?.error) setEditing(false);
                    return res;
                  })}
                >
                  {tier === 'premium' ? 'Save expiry' : 'Grant premium'}
                </button>
                {tier === 'premium' ? (
                  <button
                    className="btn sm danger"
                    disabled={pending}
                    onClick={() => run(async () => {
                      const res = await setTier(userId, 'freemium');
                      if (!res?.error) setEditing(false);
                      return res;
                    })}
                  >
                    Downgrade to freemium
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

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
