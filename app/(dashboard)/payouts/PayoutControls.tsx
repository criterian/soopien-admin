'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { generatePayouts, markPaid } from './actions';

export function GenerateRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [period, setPeriod] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    setMsg(null);
    start(async () => {
      const res = await generatePayouts(period.trim());
      if ('error' in res) setError(res.error);
      else {
        setMsg(`Created ${res.created} payout(s); ${res.skippedFounders} founder(s) below threshold.`);
        router.refresh();
      }
    });
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, marginBottom: 4 }}>Run monthly payouts</h2>
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
        Groups unpaid earnings per founder into a pending payout. Idempotent; $10 minimum.
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      {msg ? <div className="error-banner" style={{ background: 'rgba(46,125,82,0.1)', borderColor: 'rgba(46,125,82,0.35)', color: '#1f6b43' }}>{msg}</div> : null}
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="search-input" style={{ minWidth: 0, flex: 1 }} placeholder="YYYY-MM" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <button className="btn primary" disabled={pending || !period.trim()} onClick={run}>
          {pending ? 'Running…' : 'Generate'}
        </button>
      </div>
    </div>
  );
}

export function MarkPaidButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    const reference = window.prompt('Transfer reference (Wise/PayPal/bank id)?');
    if (reference == null) return;
    setError(null);
    start(async () => {
      const res = await markPaid(id, reference.trim());
      if (res && 'error' in res && res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      {error ? <span style={{ color: 'var(--rose)', fontSize: 11 }}>{error}</span> : null}
      <button className="btn sm primary" disabled={pending} onClick={onClick}>
        Mark paid
      </button>
    </div>
  );
}
