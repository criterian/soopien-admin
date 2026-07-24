'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setFreeExport } from './actions';

const OPTIONS = [
  { value: true, label: 'On · open to everyone' },
  { value: false, label: 'Off · Premium only' },
] as const;

export function FreeExportToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (next: boolean) => {
    if (next === enabled) return;
    setError(null);
    start(async () => {
      const res = await setFreeExport(next);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, marginBottom: 4 }}>Free user export / share</h2>
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.6 }}>
        When on, non-Premium users can export clips &amp; collections as shareable images. Every
        share advertises the app, so on is recommended for growth. When off, export is Premium-only
        and free users hit the paywall.
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div style={{ display: 'flex', gap: 8 }}>
        {OPTIONS.map((o) => {
          const on = o.value === enabled;
          return (
            <button
              key={String(o.value)}
              disabled={pending}
              onClick={() => change(o.value)}
              className="btn"
              style={{
                flex: 1,
                justifyContent: 'flex-start',
                borderColor: on ? 'var(--terracotta)' : 'var(--border)',
                background: on ? 'rgba(180,67,31,0.06)' : 'var(--surface)',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: `2px solid ${on ? 'var(--terracotta)' : 'var(--border)'}`,
                  background: on ? 'var(--terracotta)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? <span style={{ color: '#fff', fontSize: 10 }}>✓</span> : null}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
