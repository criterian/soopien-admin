'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setBillingProvider } from './actions';
import { BILLING_PROVIDERS, type BillingProvider } from './constants';

const LABEL: Record<BillingProvider, string> = {
  revenuecat: 'RevenueCat (store IAP)',
  lemonsqueezy: 'Lemon Squeezy (web checkout)',
};

export function BillingProviderCard({ current }: { current: BillingProvider }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (provider: BillingProvider) => {
    if (provider === current) return;
    setError(null);
    start(async () => {
      const res = await setBillingProvider(provider);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, marginBottom: 4 }}>Active billing rail</h2>
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Governs web / manual Premium flows. iOS &amp; Android force store IAP regardless.
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BILLING_PROVIDERS.map((p) => {
          const on = p === current;
          return (
            <button
              key={p}
              disabled={pending}
              onClick={() => change(p)}
              className="btn"
              style={{ justifyContent: 'flex-start', borderColor: on ? 'var(--terracotta)' : 'var(--border)', background: on ? 'rgba(180,67,31,0.06)' : 'var(--surface)' }}
            >
              <span style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${on ? 'var(--terracotta)' : 'var(--border)'}`, background: on ? 'var(--terracotta)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {on ? <span style={{ color: '#fff', fontSize: 10 }}>✓</span> : null}
              </span>
              {LABEL[p]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
