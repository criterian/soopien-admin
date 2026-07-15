'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBook, deleteBook, type BookPatch } from '../actions';
import type { BookDetail } from '../data';
import { LANGUAGES, resolveLanguage } from '../languages';

const num = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const nn = (s: string): string | null => (s.trim() ? s.trim() : null);

type Option = { value: string; label: string };

/**
 * Select over known options + an "add new" escape hatch for anything not listed.
 * A value that isn't a known option (legacy/free-text data) is surfaced as its
 * own option rather than silently dropped.
 */
function Picker({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const known = options.some((o) => o.value === value);
  const opts = !value || known ? options : [{ value, label: `${value} — custom` }, ...options];

  return (
    <div className="field">
      <label>{label}</label>
      {adding ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button type="button" className="btn sm" onClick={() => setAdding(false)}>
            Done
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
            <option value="">— none —</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn sm" onClick={() => { onChange(''); setAdding(true); }} title={placeholder}>
            + New
          </button>
        </div>
      )}
    </div>
  );
}

export function BookEditForm({
  book,
  authors,
  publishers,
}: {
  book: BookDetail;
  authors: { id: string; name: string }[];
  publishers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [f, setF] = useState({
    title: book.title ?? '',
    // Normalize legacy 3-letter codes (`tur`) onto the canonical option (`tr`).
    author: book.author ?? '',
    publisher: book.publisher ?? '',
    isbn: book.isbn ?? '',
    edition: book.edition ?? '',
    language: resolveLanguage(book.language)?.code ?? book.language ?? '',
    page_count: book.page_count != null ? String(book.page_count) : '',
    synopsis: book.synopsis ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
  };
  const setVal = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  function save() {
    setError(null);
    const patch: BookPatch = {
      title: f.title.trim(),
      author: nn(f.author),
      publisher: nn(f.publisher),
      isbn: nn(f.isbn),
      edition: nn(f.edition),
      language: nn(f.language),
      page_count: num(f.page_count),
      synopsis: nn(f.synopsis),
    };
    start(async () => {
      const res = await updateBook(book.id, patch);
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!window.confirm('Delete this book? Its clips, library entries, and reviews will be removed too.')) return;
    setError(null);
    start(async () => {
      const res = await deleteBook(book.id);
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

        <Picker
          label="Author"
          value={f.author}
          onChange={setVal('author')}
          options={authors.map((a) => ({ value: a.name, label: a.name }))}
          placeholder="New author name"
        />
        <Picker
          label="Language"
          value={f.language}
          onChange={setVal('language')}
          options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
          placeholder="Language code or name"
        />

        <Picker
          label="Publisher"
          value={f.publisher}
          onChange={setVal('publisher')}
          options={publishers.map((p) => ({ value: p.name, label: p.name }))}
          placeholder="New publisher name"
        />
        <div className="field">
          <label>ISBN</label>
          <input value={f.isbn} onChange={set('isbn')} />
        </div>
        <div className="field">
          <label>Edition</label>
          <input value={f.edition} onChange={set('edition')} />
        </div>
        <div className="field">
          <label>Page count</label>
          <input value={f.page_count} onChange={set('page_count')} />
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
          Delete book
        </button>
      </div>
    </div>
  );
}
