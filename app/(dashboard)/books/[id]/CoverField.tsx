'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCover, setCoverUrl, type CoverSide } from '../actions';

/** Full-size overlay for a cover. Click anywhere or press Esc to dismiss. */
function Lightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(26,25,22,0.88)',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        cursor: 'zoom-out',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6, boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}
      />
      <button
        className="btn sm"
        onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 20 }}
        aria-label="Close"
      >
        Close ✕
      </button>
    </div>
  );
}

export function CoverField({ bookId, side, url, title }: { bookId: string; side: CoverSide; url: string | null; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(url ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const label = side === 'front' ? 'Front cover' : 'Back cover';

  const run = (fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res && 'error' in res && res.error) setError(res.error);
      else router.refresh();
    });
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    run(() => uploadCover(bookId, side, fd));
    e.target.value = ''; // allow re-picking the same file
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${title} — ${label}`}
          onClick={() => setZoom(true)}
          title="Click to view full size"
          style={{
            width: '100%',
            aspectRatio: '2 / 3',
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--fill)',
            cursor: 'zoom-in',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '2 / 3',
            borderRadius: 8,
            border: '1px dashed var(--border)',
            background: 'var(--fill)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)',
            fontSize: 12.5,
          }}
        >
          No image
        </div>
      )}

      {error ? <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 6 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button className="btn sm" disabled={pending} onClick={() => fileRef.current?.click()}>
          {pending ? 'Working…' : url ? 'Replace' : 'Upload'}
        </button>
        <button className="btn sm" disabled={pending} onClick={() => setShowUrl((s) => !s)} title="Use an external image URL">
          URL
        </button>
        {url ? (
          <button
            className="btn sm danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Remove the ${label.toLowerCase()}?`)) run(() => setCoverUrl(bookId, side, null));
            }}
          >
            Remove
          </button>
        ) : null}
      </div>

      {showUrl ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://…"
            style={{ flex: 1, minWidth: 0, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5 }}
          />
          <button className="btn sm primary" disabled={pending} onClick={() => run(() => setCoverUrl(bookId, side, urlDraft))}>
            Set
          </button>
        </div>
      ) : null}

      {zoom && url ? <Lightbox url={url} alt={`${title} — ${label}`} onClose={() => setZoom(false)} /> : null}
    </div>
  );
}
