'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePublisher, setPublisherVerified, deletePublisher, type PublisherPatch } from '../actions';
import type { PublisherDetail } from '../data';

const nn = (s: string): string | null => (s.trim() ? s.trim() : null);
const yr = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function PublisherEditForm({ publisher }: { publisher: PublisherDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({
    name: publisher.name ?? '',
    website: publisher.website ?? '',
    country: publisher.country ?? '',
    founded_year: publisher.founded_year != null ? String(publisher.founded_year) : '',
    logo_url: publisher.logo_url ?? '',
    description: publisher.description ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };

  const run = (fn: () => Promise<{ error?: string } | void>, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res && 'error' in res && res.error) setError(res.error);
      else {
        after?.();
        router.refresh();
      }
    });
  };

  function save() {
    const patch: PublisherPatch = {
      name: f.name.trim(),
      description: nn(f.description),
      logo_url: nn(f.logo_url),
      website: nn(f.website),
      country: nn(f.country),
      founded_year: yr(f.founded_year),
    };
    run(() => updatePublisher(publisher.id, patch), () => setSaved(true));
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16 }}>Publisher</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {publisher.verified ? <span className="chip new">✓ verified</span> : null}
          <button className="btn sm" disabled={pending} onClick={() => run(() => setPublisherVerified(publisher.id, !publisher.verified))}>
            {publisher.verified ? 'Unverify' : 'Verify'}
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Name</label>
          <input value={f.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label>Country</label>
          <input value={f.country} onChange={set('country')} />
        </div>
        <div className="field">
          <label>Founded year</label>
          <input value={f.founded_year} onChange={set('founded_year')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Website</label>
          <input value={f.website} onChange={set('website')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Logo URL</label>
          <input value={f.logo_url} onChange={set('logo_url')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Description</label>
          <textarea rows={4} value={f.description} onChange={set('description')} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn primary" disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ color: 'var(--green)', fontSize: 13 }}>✓ Saved</span> : null}
        <button
          className="btn danger sm"
          disabled={pending}
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            if (window.confirm("Delete this publisher? Books keep their text publisher; publisher_id is cleared.")) run(() => deletePublisher(publisher.id));
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
