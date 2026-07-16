'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAuthor, setAuthorVerified, deleteAuthor } from '../actions';
import type { AuthorDetail } from '../data';

const nn = (s: string): string | null => (s.trim() ? s.trim() : null);

export function AuthorEditForm({ author }: { author: AuthorDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(author.name ?? '');
  const [bio, setBio] = useState(author.bio ?? '');
  const [photo, setPhoto] = useState(author.photo_url ?? '');

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

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16 }}>Author</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {author.verified ? <span className="chip new">✓ verified</span> : null}
          <button className="btn sm" disabled={pending} onClick={() => run(() => setAuthorVerified(author.id, !author.verified))}>
            {author.verified ? 'Unverify' : 'Verify'}
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
      </div>
      <div className="field">
        <label>Photo URL</label>
        <input value={photo} onChange={(e) => { setPhoto(e.target.value); setSaved(false); }} />
      </div>
      <div className="field">
        <label>Bio</label>
        <textarea rows={5} value={bio} onChange={(e) => { setBio(e.target.value); setSaved(false); }} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          className="btn primary"
          disabled={pending}
          onClick={() => run(() => updateAuthor(author.id, { name: name.trim(), bio: nn(bio), photo_url: nn(photo) }), () => setSaved(true))}
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {saved ? <span style={{ color: 'var(--green)', fontSize: 13 }}>✓ Saved</span> : null}
        <button
          className="btn danger sm"
          disabled={pending}
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            if (window.confirm('Delete this person? Their book and film links are removed; books/films keep their text fields.')) run(() => deleteAuthor(author.id));
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
