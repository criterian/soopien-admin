'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteReview } from './actions';
import type { ReviewKind } from './data';

export function DeleteReview({ kind, id }: { kind: ReviewKind; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    if (!window.confirm('Delete this review permanently?')) return;
    setError(null);
    start(async () => {
      const res = await deleteReview(kind, id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      {error ? <span style={{ color: 'var(--rose)', fontSize: 11 }}>{error}</span> : null}
      <button className="btn sm danger" disabled={pending} onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
