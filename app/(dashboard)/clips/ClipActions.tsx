'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setClipMature, deleteClip } from './actions';

export function ClipActions({ clipId, mature }: { clipId: string; mature: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string } | void>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    start(async () => {
      const res = await fn();
      if (res && 'error' in res && res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      {error ? <span style={{ color: 'var(--rose)', fontSize: 11 }}>{error}</span> : null}
      <button className="btn sm" disabled={pending} onClick={() => run(() => setClipMature(clipId, !mature))}>
        {mature ? 'Unflag' : 'Flag mature'}
      </button>
      <button
        className="btn sm danger"
        disabled={pending}
        onClick={() => run(() => deleteClip(clipId), 'Delete this clip permanently?')}
      >
        Delete
      </button>
    </div>
  );
}
