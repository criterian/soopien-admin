'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setClipMature, setClipSpoiler, setClipPrivate, deleteClipAndReturn, deleteClipComment } from '../actions';

export function ClipModeration({
  clipId,
  mature,
  spoiler,
  isPrivate,
}: {
  clipId: string;
  mature: boolean;
  spoiler: boolean;
  isPrivate: boolean;
}) {
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

  const Toggle = ({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 13.5 }}>
        {label} {on ? <span className="chip admin" style={{ marginLeft: 4 }}>on</span> : <span className="chip" style={{ marginLeft: 4 }}>off</span>}
      </span>
      <button className="btn sm" disabled={pending} onClick={onClick}>
        {on ? 'Turn off' : 'Turn on'}
      </button>
    </div>
  );

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>Moderation</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Toggle label="Mature content" on={mature} onClick={() => run(() => setClipMature(clipId, !mature))} />
        <Toggle label="Spoiler" on={spoiler} onClick={() => run(() => setClipSpoiler(clipId, !spoiler))} />
        <Toggle label="Private" on={isPrivate} onClick={() => run(() => setClipPrivate(clipId, !isPrivate))} />

        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 12, marginTop: 2 }}>
          <button
            className="btn sm danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm('Delete this clip permanently? Its likes and comments go too.')) run(() => deleteClipAndReturn(clipId));
            }}
          >
            Delete clip
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteComment({ commentId, clipId }: { commentId: string; clipId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      className="btn sm danger"
      disabled={pending}
      title="Delete comment"
      onClick={() => {
        if (!window.confirm('Delete this comment?')) return;
        start(async () => {
          await deleteClipComment(commentId, clipId);
          router.refresh();
        });
      }}
      style={{ padding: '3px 8px', fontSize: 12 }}
    >
      Delete
    </button>
  );
}
