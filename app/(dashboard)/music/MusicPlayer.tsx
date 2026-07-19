'use client';

import { createContext, useContext, useState, useTransition, type ReactNode } from 'react';
import { getTrackUrl } from './actions';

type Track = { id: string; title: string; category?: string };
type PlayerCtx = {
  current: Track | null;
  loadingId: string | null;
  play: (t: Track) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

export function useMusicPlayer(): PlayerCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return c;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const play = (t: Track) => {
    setError(null);
    setLoadingId(t.id);
    start(async () => {
      const res = await getTrackUrl(t.id);
      setLoadingId(null);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setCurrent(t);
      setUrl(res.url);
    });
  };

  const close = () => {
    setCurrent(null);
    setUrl(null);
    setError(null);
  };

  return (
    <Ctx.Provider value={{ current, loadingId, play }}>
      {children}
      {/* keep space so the fixed bar never covers the last rows */}
      {current || error ? <div style={{ height: 92 }} /> : null}

      {error ? (
        <div style={{ position: 'fixed', left: 244, right: 0, bottom: 0, zIndex: 60, padding: 14, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div className="error-banner" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button className="btn sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      ) : null}

      {current && url ? (
        <div
          style={{
            position: 'fixed',
            left: 244,
            right: 0,
            bottom: 0,
            zIndex: 60,
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -4px 20px rgba(26,25,22,0.06)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0, flexShrink: 0, width: 200 }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.title}
            </div>
            {current.category ? <div className="muted" style={{ fontSize: 12 }}>{current.category}</div> : null}
          </div>
          {/* key by url so a new track autoplays on load */}
          <audio key={url} controls autoPlay src={url} style={{ flex: 1, height: 40 }} />
          <button className="btn sm" onClick={close} aria-label="Close player">
            ✕
          </button>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

/** Per-row play button — loads the signed URL and starts the bottom player. */
export function PlayButton({ id, title, category }: { id: string; title: string; category?: string }) {
  const { current, loadingId, play } = useMusicPlayer();
  const isCurrent = current?.id === id;
  const isLoading = loadingId === id;

  return (
    <button
      className={`btn sm${isCurrent ? ' primary' : ''}`}
      disabled={isLoading}
      onClick={() => play({ id, title, category })}
      title="Play"
      style={{ minWidth: 64 }}
    >
      {isLoading ? '…' : isCurrent ? '♪ Playing' : '▶ Play'}
    </button>
  );
}
