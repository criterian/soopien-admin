'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBook } from './actions';

/**
 * Add a book to the shared catalog.
 *
 * ISBN first, deliberately. Given one, the catalogs return the cover, synopsis,
 * subjects, page count, language and the Open Library work key — everything the
 * discovery index needs. Typed by hand, a book usually arrives as a title and an
 * author, which is close to nothing to search against: a book with no synopsis
 * and no subjects indexes as three lines and never surfaces for anything except
 * its own title.
 */
export function NewBookForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function submit() {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await createBook({ title: title.trim(), author: author.trim(), isbn: isbn.trim() });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.existed) {
        setNotice('That ISBN is already in the catalog — opening it.');
      }
      setIsbn('');
      setTitle('');
      setAuthor('');
      if (res.bookId) router.push(`/books/${res.bookId}`);
      else router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        New book
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 18, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, margin: 0 }}>New book</h2>
        <button
          type="button"
          className="btn-ghost"
          style={{ marginLeft: 'auto', fontSize: 12 }}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>ISBN</label>
          <input
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="9789750718533"
            inputMode="numeric"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>
            Title <span style={{ color: '#a33' }}>*</span>
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>Author</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <p className="muted" style={{ fontSize: 11.5, marginBottom: 12, lineHeight: 1.55 }}>
        With an ISBN the cover, synopsis, subjects, language and page count are fetched
        automatically — and those are what discovery searches. Without one, only what you type is
        stored, so add the ISBN whenever you have it.
      </p>

      <button
        type="button"
        className="btn btn-primary"
        disabled={pending || !title.trim()}
        onClick={submit}
      >
        {pending ? 'Adding…' : 'Add to catalog'}
      </button>

      {error && <p style={{ fontSize: 12.5, color: '#a33', marginTop: 10 }}>{error}</p>}
      {notice && !error && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          {notice}
        </p>
      )}
    </div>
  );
}
