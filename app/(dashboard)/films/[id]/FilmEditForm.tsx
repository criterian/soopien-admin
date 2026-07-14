'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateFilm, deleteFilm, type FilmPatch } from '../actions';
import type { FilmDetail } from '../data';

const nn = (s: string): string | null => (s.trim() ? s.trim() : null);
const int = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function FilmEditForm({ film }: { film: FilmDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [f, setF] = useState({
    title: film.title ?? '',
    release_year: film.release_year != null ? String(film.release_year) : '',
    director: film.director ?? '',
    media_type: (film.media_type as 'movie' | 'tv') ?? 'movie',
    runtime_minutes: film.runtime_minutes != null ? String(film.runtime_minutes) : '',
    language: film.language ?? '',
    genres: (film.genres ?? []).join(', '),
    synopsis: film.synopsis ?? '',
    poster_url: film.poster_url ?? '',
    backdrop_url: film.backdrop_url ?? '',
    trailer_url: film.trailer_url ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };

  function save() {
    setError(null);
    const patch: FilmPatch = {
      title: f.title.trim(),
      release_year: int(f.release_year),
      director: nn(f.director),
      media_type: f.media_type,
      runtime_minutes: int(f.runtime_minutes),
      language: nn(f.language),
      genres: f.genres.split(',').map((g) => g.trim()).filter(Boolean),
      synopsis: nn(f.synopsis),
      poster_url: nn(f.poster_url),
      backdrop_url: nn(f.backdrop_url),
      trailer_url: nn(f.trailer_url),
    };
    start(async () => {
      const res = await updateFilm(film.id, patch);
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!window.confirm('Delete this film? Its clips, shelf entries, and reviews will be removed too.')) return;
    setError(null);
    start(async () => {
      const res = await deleteFilm(film.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, marginBottom: 14 }}>Edit metadata</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Title</label>
          <input value={f.title} onChange={set('title')} />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={f.media_type} onChange={set('media_type')}>
            <option value="movie">Movie</option>
            <option value="tv">TV</option>
          </select>
        </div>
        <div className="field">
          <label>Release year</label>
          <input value={f.release_year} onChange={set('release_year')} />
        </div>
        <div className="field">
          <label>Director</label>
          <input value={f.director} onChange={set('director')} />
        </div>
        <div className="field">
          <label>Runtime (min)</label>
          <input value={f.runtime_minutes} onChange={set('runtime_minutes')} />
        </div>
        <div className="field">
          <label>Language</label>
          <input value={f.language} onChange={set('language')} />
        </div>
        <div className="field">
          <label>Genres (comma-separated)</label>
          <input value={f.genres} onChange={set('genres')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Poster URL</label>
          <input value={f.poster_url} onChange={set('poster_url')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Backdrop URL</label>
          <input value={f.backdrop_url} onChange={set('backdrop_url')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Trailer URL</label>
          <input value={f.trailer_url} onChange={set('trailer_url')} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Synopsis</label>
          <textarea rows={4} value={f.synopsis} onChange={set('synopsis')} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
        <button className="btn primary" disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {saved ? <span style={{ color: 'var(--green)', fontSize: 13 }}>✓ Saved</span> : null}
        <button className="btn danger sm" disabled={pending} onClick={remove} style={{ marginLeft: 'auto' }}>
          Delete film
        </button>
      </div>
    </div>
  );
}
