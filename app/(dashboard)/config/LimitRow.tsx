'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLimit } from './actions';
import type { LimitValue } from './data';

export function LimitRow({ limit }: { limit: LimitValue }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [val, setVal] = useState(String(limit.value));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = val.trim() !== String(limit.value);

  const save = () => {
    const n = parseInt(val, 10);
    if (!Number.isFinite(n) || n < 0) {
      setError('Enter a non-negative integer.');
      return;
    }
    setError(null);
    start(async () => {
      const res = await setLimit(limit.name, n);
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  };

  const reset = () => {
    setError(null);
    start(async () => {
      const res = await setLimit(limit.name, null);
      if (res?.error) setError(res.error);
      else {
        setVal(String(limit.def));
        setSaved(false);
        router.refresh();
      }
    });
  };

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'var(--text)' }}>{limit.label}</span>
            {limit.overridden ? <span className="chip admin">custom</span> : <span className="chip">default</span>}
          </div>
          <div className="muted" style={{ fontSize: 12.5 }}>{limit.help} Default: {limit.def}.</div>
        </div>
        <input
          value={val}
          onChange={(e) => { setVal(e.target.value.replace(/[^0-9]/g, '')); setSaved(false); }}
          inputMode="numeric"
          style={{ width: 76, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}
        />
        <button className="btn sm primary" disabled={pending || !dirty} onClick={save}>
          Save
        </button>
        {limit.overridden ? (
          <button className="btn sm" disabled={pending} onClick={reset} title="Reset to default">
            Reset
          </button>
        ) : null}
      </div>
      {error ? <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
      {saved && !dirty ? <div style={{ color: 'var(--green)', fontSize: 12, marginTop: 6 }}>✓ Saved — live within ~30s</div> : null}
    </div>
  );
}
