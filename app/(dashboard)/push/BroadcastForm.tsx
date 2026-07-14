'use client';

import { useState, useTransition } from 'react';
import { broadcast, type Segment } from './actions';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'all', label: 'All users' },
  { key: 'premium', label: 'Premium only' },
  { key: 'freemium', label: 'Freemium only' },
];

export function BroadcastForm() {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);

  const send = () => {
    setError(null);
    setSent(null);
    if (!window.confirm(`Send this announcement to ${SEGMENTS.find((s) => s.key === segment)?.label}?`)) return;
    start(async () => {
      const res = await broadcast({ title, body, segment });
      if ('error' in res) setError(res.error);
      else {
        setSent(res.recipients);
        setTitle('');
        setBody('');
      }
    });
  };

  return (
    <div className="card" style={{ padding: 20, maxWidth: 560 }}>
      <h2 style={{ fontSize: 16, marginBottom: 14 }}>New announcement</h2>
      {error ? <div className="error-banner">{error}</div> : null}
      {sent != null ? (
        <div className="error-banner" style={{ background: 'rgba(46,125,82,0.1)', borderColor: 'rgba(46,125,82,0.35)', color: '#1f6b43' }}>
          ✓ Queued to {sent} recipient{sent === 1 ? '' : 's'}.
        </div>
      ) : null}

      <div className="field">
        <label>Segment</label>
        <select value={segment} onChange={(e) => setSegment(e.target.value as Segment)}>
          {SEGMENTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="What's new" />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={240} placeholder="A short announcement…" />
      </div>
      <button className="btn primary" disabled={pending || !title.trim() || !body.trim()} onClick={send}>
        {pending ? 'Sending…' : 'Send broadcast'}
      </button>
    </div>
  );
}
