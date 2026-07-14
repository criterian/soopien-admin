'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setVisibility, deleteClub } from '../actions';

export function ClubActions({ clubId, visibility, name }: { clubId: string; visibility: string; name: string }) {
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

  const confirmDelete = () => {
    const typed = window.prompt(`Disband "${name}"? This removes the club and all its members, schedule, posts, and tiers.\n\nType the club name to confirm:`);
    if (typed === name) run(() => deleteClub(clubId));
    else if (typed !== null) setError('Name did not match — deletion cancelled.');
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Admin actions</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="field">
        <label>Visibility</label>
        <select
          value={visibility}
          disabled={pending}
          onChange={(e) => run(() => setVisibility(clubId, e.target.value as 'public' | 'private' | 'secret'))}
        >
          <option value="public">Public — searchable, in Discover</option>
          <option value="private">Private — invite only</option>
          <option value="secret">Secret — link only</option>
        </select>
      </div>

      <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 14, marginTop: 4 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 8 }}>
          Danger zone — disbanding cascades to all club data.
        </div>
        <button className="btn sm danger" disabled={pending} onClick={confirmDelete}>
          Disband club
        </button>
      </div>
    </div>
  );
}
