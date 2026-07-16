'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFilmImage, setFilmMediaUrl, type FilmMedia } from '../actions';

function Lightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
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
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(26,25,22,0.88)', display: 'grid', placeItems: 'center', padding: 32, cursor: 'zoom-out' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6, boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }} />
      <button className="btn sm" onClick={onClose} style={{ position: 'fixed', top: 20, right: 20 }}>
        Close ✕
      </button>
    </div>
  );
}

/** YouTube thumbnail for a trailer URL, if we can parse a video id. */
function youtubeThumb(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export function FilmMediaField({
  filmId,
  kind,
  url,
  title,
  aspect,
}: {
  filmId: string;
  kind: FilmMedia;
  url: string | null;
  title: string;
  aspect: string; // e.g. '2 / 3' poster, '16 / 9' backdrop/trailer
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(url ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const isImage = kind === 'poster' || kind === 'backdrop';
  const label = kind === 'poster' ? 'Poster' : kind === 'backdrop' ? 'Backdrop' : 'Trailer';
  const thumb = isImage ? url : url ? youtubeThumb(url) : null;

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
    run(() => uploadFilmImage(filmId, kind as 'poster' | 'backdrop', fd));
    e.target.value = '';
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>

      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={`${title} — ${label}`}
          onClick={() => (isImage ? setZoom(true) : window.open(url!, '_blank'))}
          title={isImage ? 'Click to view full size' : 'Open trailer'}
          style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--fill)', cursor: isImage ? 'zoom-in' : 'pointer', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', aspectRatio: aspect, borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--fill)', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 12.5, textAlign: 'center', padding: 8 }}>
          {url && !isImage ? 'Trailer set (no preview)' : 'None'}
        </div>
      )}

      {error ? <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 6 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        {isImage ? (
          <button className="btn sm" disabled={pending} onClick={() => fileRef.current?.click()}>
            {pending ? 'Working…' : url ? 'Replace' : 'Upload'}
          </button>
        ) : null}
        {url && !isImage ? (
          <a className="btn sm" href={url} target="_blank" rel="noreferrer">
            Open ↗
          </a>
        ) : null}
        <button className="btn sm" disabled={pending} onClick={() => setShowUrl((s) => !s)} title="Set by URL">
          URL
        </button>
        {url ? (
          <button
            className="btn sm danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Remove the ${label.toLowerCase()}?`)) run(() => setFilmMediaUrl(filmId, kind, null));
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
            placeholder={isImage ? 'https://image…' : 'https://youtube.com/watch?v=…'}
            style={{ flex: 1, minWidth: 0, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5 }}
          />
          <button className="btn sm primary" disabled={pending} onClick={() => run(() => setFilmMediaUrl(filmId, kind, urlDraft))}>
            Set
          </button>
        </div>
      ) : null}

      {zoom && isImage && url ? <Lightbox url={url} alt={`${title} — ${label}`} onClose={() => setZoom(false)} /> : null}
    </div>
  );
}
