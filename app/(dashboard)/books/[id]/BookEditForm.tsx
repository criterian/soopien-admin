'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateBook, deleteBook, type BookPatch } from '../actions';
import type { BookDetail } from '../data';

const num = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const nn = (s: string): string | null => (s.trim() ? s.trim() : null);

export function BookEditForm({ book }: { book: BookDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [f, setF] = useState({
    title: book.title ?? '',
    author: book.author ?? '',
    publisher: book.publisher ?? '',
    isbn: book.isbn ?? '',
    edition: book.edition ?? '',
    language: book.language ?? '',
    page_count: book.page_count != null ? String(book.page_count) : '',
    synopsis: book.synopsis ?? '',
    cover_front_url: book.cover_front_url ?? '',
    cover_back_url: book.cover_back_url ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
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
      cover_front_url: nn(f.cover_front_url),
      cover_back_url: nn(f.cover_back_url),
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

  const Field = ({ label, k, wide, ta }: { label: string; k: keyof typeof f; wide?: boolean; ta?: boolean }) => (
    <div className="field" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <label>{label}</label>
      {ta ? (
        <textarea rows={4} value={f[k]} onChange={set(k)} />
      ) : (
        <input value={f[k]} onChange={set(k)} />
      )}
    </div>
  );

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, marginBottom: 14 }}>Edit metadata</h2>
      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Field label="Title" k="title" wide />
        <Field label="Author (text)" k="author" />
        <Field label="Publisher (text)" k="publisher" />
        <Field label="ISBN" k="isbn" />
        <Field label="Edition" k="edition" />
        <Field label="Language" k="language" />
        <Field label="Page count" k="page_count" />
        <Field label="Cover front URL" k="cover_front_url" wide />
        <Field label="Cover back URL" k="cover_back_url" wide />
        <Field label="Synopsis" k="synopsis" wide ta />
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
