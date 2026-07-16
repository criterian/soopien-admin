'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateFilm, deleteFilm, type FilmPatch } from '../actions';
import type { FilmDetail } from '../data';
import { LANGUAGES, resolveLanguage } from '@/lib/languages';
import { Picker } from '@/components/Picker';
import { TagPicker } from '@/components/TagPicker';

const nn = (s: string): string | null => (s.trim() ? s.trim() : null);
const int = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function FilmEditForm({
  film,
  directors,
  genreOptions,
}: {
  film: FilmDetail;
  directors: string[];
  genreOptions: string[];
}) {
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
    language: resolveLanguage(film.language)?.code ?? film.language ?? '',
    synopsis: film.synopsis ?? '',
  });
  const [genres, setGenres] = useState<string[]>(film.genres ?? []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };
  const setVal = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
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
      genres,
      synopsis: nn(f.synopsis),
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

        <Picker
          label="Director"
          value={f.director}
          onChange={setVal('director')}
          options={directors.map((d) => ({ value: d, label: d }))}
          placeholder="New director name"
        />
        <Picker
          label="Language"
          value={f.language}
          onChange={setVal('language')}
          options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
          placeholder="Language code or name"
        />

        <div className="field">
          <label>Runtime (min)</label>
          <input value={f.runtime_minutes} onChange={set('runtime_minutes')} />
        </div>

        <TagPicker label="Genres" values={genres} onChange={(v) => { setGenres(v); setSaved(false); }} options={genreOptions} placeholder="Add a genre…" />

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
