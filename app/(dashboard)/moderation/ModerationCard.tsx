'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveTarget, removeContent, setClipMature } from './actions';
import type { ModerationGroup } from './data';
import { fmtDateTime } from '@/lib/format';

const REASON_LABEL: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  spoiler_unmarked: 'Unmarked spoiler',
  harassment: 'Harassment',
  copyright: 'Copyright',
  other: 'Other',
};

export function ModerationCard({ group }: { group: ModerationGroup }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const p = group.preview;

  const run = (fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res && 'error' in res && res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 18, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="chip admin">{group.targetType}</span>
          {group.count > 1 ? <span className="chip">{group.count} reports</span> : null}
          {group.reasons.map((r) => (
            <span key={r} className="chip">
              {REASON_LABEL[r] ?? r}
            </span>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {fmtDateTime(group.latest)}
        </span>
      </div>

      {/* Target preview */}
      <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-elev)', borderRadius: 8, border: '1px solid var(--divider)' }}>
        {p.deleted ? (
          <span className="muted">⚠ Content already removed or unavailable.</span>
        ) : p.kind === 'clip' ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Media clips (capture/place/video/…) carry no text — show the image. */}
            {p.thumb ? (
              <Link href={`/clips/${p.id}`} style={{ flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumb}
                  alt=""
                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--fill)', display: 'block' }}
                />
              </Link>
            ) : p.media ? (
              <div style={{ width: 96, height: 96, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--fill)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 22 }}>
                {p.media === 'video' ? '▶' : '♪'}
              </div>
            ) : null}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                <span className="chip">{p.type}</span>
                {p.source ? <span className="muted" style={{ fontSize: 12.5 }}>from {p.source}</span> : null}
                {p.isPrivate ? <span className="chip private">private</span> : null}
                {p.spoiler ? <span className="chip">spoiler</span> : null}
                {p.mature ? <span className="chip admin">mature</span> : null}
              </div>
              <div style={{ color: 'var(--text)', fontWeight: 500 }}>
                {p.title || <span className="muted">{p.media || p.thumb ? '(media clip — no text)' : '(no text)'}</span>}
              </div>
              {p.body ? <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{p.body}</div> : null}
              <div className="muted" style={{ fontSize: 12, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>
                  by{' '}
                  {p.ownerId ? (
                    <Link href={`/users/${p.ownerId}`} style={{ color: 'var(--terracotta)' }}>
                      @{p.ownerName ?? p.ownerId.slice(0, 8)}
                    </Link>
                  ) : (
                    '—'
                  )}
                </span>
                <Link href={`/clips/${p.id}`} style={{ color: 'var(--terracotta)' }}>
                  View full clip →
                </Link>
              </div>
            </div>
          </div>
        ) : p.kind === 'comment' ? (
          <div>
            <div style={{ color: 'var(--text)' }}>{p.body}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>
                comment by{' '}
                {p.ownerId ? (
                  <Link href={`/users/${p.ownerId}`} style={{ color: 'var(--terracotta)' }}>
                    view user
                  </Link>
                ) : (
                  '—'
                )}
              </span>
              <Link href={`/clips/${p.clipId}`} style={{ color: 'var(--terracotta)' }}>
                View clip →
              </Link>
            </div>
          </div>
        ) : p.kind === 'profile' ? (
          <div>
            <div style={{ color: 'var(--text)', fontWeight: 500 }}>{p.displayName ?? p.username}</div>
            <Link href={`/users/${p.id}`} className="muted" style={{ fontSize: 12.5, color: 'var(--terracotta)' }}>
              @{p.username} — open profile
            </Link>
          </div>
        ) : null}
      </div>

      {/* Report notes */}
      {group.reports.some((r) => r.note) ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {group.reports
            .filter((r) => r.note)
            .map((r) => (
              <div key={r.id} className="muted" style={{ fontSize: 12.5 }}>
                “{r.note}” — @{r.reporter}
              </div>
            ))}
        </div>
      ) : null}

      {error ? <div className="error-banner" style={{ marginTop: 12 }}>{error}</div> : null}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn sm" disabled={pending} onClick={() => run(() => resolveTarget(group.targetType, group.targetId, 'dismissed'))}>
          Dismiss
        </button>
        {p.kind === 'clip' && !p.deleted ? (
          <button className="btn sm" disabled={pending} onClick={() => run(() => setClipMature(p.id, !p.mature))}>
            {p.mature ? 'Unflag mature' : 'Flag mature'}
          </button>
        ) : null}
        {group.targetType !== 'profile' ? (
          <button className="btn sm danger" disabled={pending} onClick={() => run(() => removeContent(group.targetType, group.targetId))}>
            Remove content
          </button>
        ) : (
          <Link className="btn sm" href={`/users/${group.targetId}`}>
            Review user →
          </Link>
        )}
        {group.targetType !== 'profile' ? (
          <button className="btn sm" disabled={pending} onClick={() => run(() => resolveTarget(group.targetType, group.targetId, 'actioned'))}>
            Mark actioned
          </button>
        ) : null}
      </div>
    </div>
  );
}
