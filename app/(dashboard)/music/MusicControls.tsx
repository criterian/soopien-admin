'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTrack, setTrackActive, deleteTrack } from './actions';
import { MUSIC_CATEGORIES, type MusicCategoryKey } from './constants';

export function AddTrackForm({ uploadEnabled, defaultCategory }: { uploadEnabled: boolean; defaultCategory?: MusicCategoryKey }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<MusicCategoryKey>(defaultCategory ?? MUSIC_CATEGORIES[0].key);
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [dur, setDur] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showKey, setShowKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    if (!f) return;
    // Auto-fill title from the filename (minus extension), if empty.
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
    // Read duration from the audio metadata.
    const url = URL.createObjectURL(f);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) setDur(String(Math.round(audio.duration)));
      URL.revokeObjectURL(url);
    };
    audio.src = url;
  };

  const canSubmit = !pending && title.trim() && (file || key.trim());

  const submit = () => {
    setError(null);
    const fd = new FormData();
    fd.set('category', category);
    fd.set('title', title);
    fd.set('duration_seconds', dur);
    if (file) fd.set('file', file);
    if (key.trim()) fd.set('storage_key', key.trim());

    start(async () => {
      const res = await createTrack(fd);
      if (res?.error) setError(res.error);
      else {
        setTitle('');
        setKey('');
        setDur('');
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
        router.refresh();
      }
    });
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>Add track</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="field">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as MusicCategoryKey)}>
          {MUSIC_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label} ({c.tier})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Audio file</label>
        <input ref={fileRef} type="file" accept="audio/*" onChange={onFile} disabled={!uploadEnabled} />
        {!uploadEnabled ? (
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--rose)' }}>
            Uploads are off — set the <code>R2_*</code> env on the server (then redeploy) to enable. You can still
            add a track by storage key below.
          </div>
        ) : file ? (
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB{dur ? ` · ${dur}s` : ''}
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Uploads to R2 as {category}/&lt;title&gt;.ext</div>
        )}
      </div>

      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="soopien_lofi_001" />
      </div>

      <div className="field">
        <label>Duration (seconds, optional)</label>
        <input value={dur} onChange={(e) => setDur(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
      </div>

      {uploadEnabled ? (
        <button type="button" className="btn sm" onClick={() => setShowKey((s) => !s)} style={{ marginBottom: 10 }}>
          {showKey ? 'Hide' : 'Advanced: use an existing R2 key'}
        </button>
      ) : null}
      {showKey || !uploadEnabled ? (
        <div className="field">
          <label>Storage key (R2 object key)</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="lofi_focus/soopien_lofi_001.m4a" />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Used only when no file is uploaded.</div>
        </div>
      ) : null}

      <button className="btn primary" disabled={!canSubmit} onClick={submit} style={{ width: '100%', justifyContent: 'center' }}>
        {pending ? (file ? 'Uploading…' : 'Adding…') : 'Add track'}
      </button>
    </div>
  );
}

export function TrackControls({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ error?: string } | void>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    start(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
      <button className="btn sm" disabled={pending} onClick={() => run(() => setTrackActive(id, !active))}>
        {active ? 'Deactivate' : 'Activate'}
      </button>
      <button className="btn sm danger" disabled={pending} onClick={() => run(() => deleteTrack(id), 'Delete this track?')}>
        Delete
      </button>
    </div>
  );
}
