'use client';

import { useState } from 'react';
import { ComposeForm } from '../../emails/ComposeForm';
import type { UserEmailActivity } from '../../emails/types';

const PREF_LABELS: Record<string, string> = {
  product_news: 'Product news',
  weekly_digest: 'Weekly digest',
  onboarding: 'Getting started',
};

function fmt(iso: string): string {
  // Locale-independent, matches the rest of the admin's compact date style.
  return iso.slice(0, 10);
}

/**
 * Per-user email panel on the user detail page: what they're subscribed to,
 * whether their address is suppressed, the recent send + consent history, and a
 * composer to send this one person an email (consent/suppression still enforced
 * server-side).
 */
export function EmailPanel({
  userId,
  userLabel,
  activity,
}: {
  userId: string;
  userLabel: string;
  activity: UserEmailActivity;
}) {
  const [composing, setComposing] = useState(false);

  return (
    <div className="card" style={{ padding: 20, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16 }}>Email</h2>
        <button className="btn" onClick={() => setComposing((v) => !v)}>
          {composing ? 'Close' : 'Send email'}
        </button>
      </div>

      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 12, columnGap: 12, fontSize: 13.5 }}>
        <dt className="muted">Address</dt>
        <dd style={{ margin: 0 }}>{activity.email ?? <span className="muted">—</span>}</dd>

        <dt className="muted">Deliverability</dt>
        <dd style={{ margin: 0 }}>
          {activity.suppressed ? (
            <span className="chip" style={{ background: 'rgba(192,80,74,0.12)', color: 'var(--rose)' }}>
              suppressed · {activity.suppressed.reason}
            </span>
          ) : (
            <span className="chip" style={{ background: 'rgba(46,125,82,0.12)', color: '#1f6b43' }}>
              deliverable
            </span>
          )}
        </dd>

        <dt className="muted">Subscribed</dt>
        <dd style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(PREF_LABELS) as (keyof typeof PREF_LABELS)[]).map((k) => {
            const on = (activity.preferences as Record<string, boolean>)[k];
            return (
              <span
                key={k}
                className="chip"
                style={on ? undefined : { opacity: 0.45, textDecoration: 'line-through' }}
              >
                {PREF_LABELS[k]}
              </span>
            );
          })}
        </dd>
      </dl>

      {composing ? (
        <div style={{ marginTop: 16 }}>
          <ComposeForm userId={userId} userLabel={userLabel} />
        </div>
      ) : null}

      {activity.sends.length ? (
        <div style={{ marginTop: 18 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Recent sends
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {activity.sends.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.status === 'failed' ? '⚠ ' : ''}
                  {s.subject}
                </span>
                <span className="muted" style={{ flexShrink: 0 }}>
                  {s.category} · {fmt(s.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activity.consents.length ? (
        <div style={{ marginTop: 18 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Consent log
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {activity.consents.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                <span>
                  {c.action === 'granted' ? '✓' : '✕'} {c.kind}
                </span>
                <span className="muted" style={{ flexShrink: 0 }}>
                  {c.locale ?? ''} · {fmt(c.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
