'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTrack, setTrackActive, deleteTrack } from './actions';
import { MUSIC_CATEGORIES, type MusicCategoryKey } from './constants';

export function AddTrackForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<MusicCategoryKey>(MUSIC_CATEGORIES[0].key);
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [dur, setDur] = useState('');

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await createTrack({
        category,
        title,
        storage_key: key,
        duration_seconds: dur.trim() ? parseInt(dur, 10) : null,
      });
      if (res?.error) setError(res.error);
      else {
        setTitle('');
        setKey('');
        setDur('');
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
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="soopien_lofi_001" />
      </div>
      <div className="field">
        <label>Storage key (R2 object key)</label>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="lofi_focus/soopien_lofi_001.m3u8" />
      </div>
      <div className="field">
        <label>Duration (seconds, optional)</label>
        <input value={dur} onChange={(e) => setDur(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
      </div>
      <button className="btn primary" disabled={pending || !title.trim() || !key.trim()} onClick={submit} style={{ width: '100%', justifyContent: 'center' }}>
        {pending ? 'Adding…' : 'Add track'}
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
