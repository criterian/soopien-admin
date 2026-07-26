'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { importGutenbergBatch, parseAllPendingTexts, searchGutenberg, skipBookText } from '../actions';

/**
 * Bulk Project Gutenberg import (DISCOVERY.md §7.3).
 *
 * Proposals with a confirmation step, not a bulk button. Matching is genuinely
 * unreliable in ways only a person catches: Gutenberg is almost entirely
 * English, so a translated title finds nothing and we fall back to searching by
 * author — which puts "Pride and Prejudice" correctly at the top for the Turkish
 * edition, and puts three unrelated Proclus volumes under "Devlet" because
 * Gutenberg spells Platon as Plato.
 *
 * So every row defaults to Skip, and each has its own search box for when the
 * proposals are wrong.
 */

export type Candidate = {
  gutenbergId: number;
  title: string;
  authors: string[];
  languages: string[];
  downloads: number;
  titleScore: number;
};

export type BookRow = {
  bookId: string;
  title: string;
  author: string | null;
  language: string | null;
  candidates: Candidate[];
};

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

function describe(c: Candidate): string {
  const who = c.authors.join(', ');
  return `#${c.gutenbergId} · ${c.title}${who ? ` — ${who}` : ''} · ${fmt(c.downloads)} downloads`;
}

function Row({
  row,
  chosen,
  onChoose,
  onDismiss,
  busy,
}: {
  row: BookRow;
  chosen: number | null;
  onChoose: (id: number | null) => void;
  onDismiss: () => void;
  busy: boolean;
}) {
  const [extra, setExtra] = useState<Candidate[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const options = [...row.candidates, ...extra.filter((e) => !row.candidates.some((c) => c.gutenbergId === e.gutenbergId))];

  async function doSearch() {
    if (!query.trim()) return;
    setSearching(true);
    const res = await searchGutenberg(query.trim());
    setSearching(false);
    if (!res.error) setExtra(res.results);
  }

  return (
    <tr>
      <td style={{ verticalAlign: 'top', paddingTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{row.title}</div>
        <div className="muted" style={{ fontSize: 12 }}>
          {[row.author, row.language].filter(Boolean).join(' · ') || '—'}
        </div>
      </td>
      <td style={{ verticalAlign: 'top', paddingTop: 8 }}>
        <select
          value={chosen ?? ''}
          onChange={(e) => onChoose(e.target.value ? Number(e.target.value) : null)}
          style={{ width: '100%', marginBottom: 6 }}
        >
          {/* Skip is the default: an unreviewed row must import nothing. */}
          <option value="">Skip</option>
          {options.map((c) => (
            <option key={c.gutenbergId} value={c.gutenbergId}>
              {describe(c)}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void doSearch();
              }
            }}
            placeholder="Search Gutenberg — try the original title"
            style={{ flex: 1, fontSize: 12.5 }}
          />
          <button type="button" className="btn-ghost" onClick={() => void doSearch()} disabled={searching}>
            {searching ? '…' : 'Find'}
          </button>
        </div>

        {!row.candidates.length && !extra.length && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>
            Nothing proposed — likely still in copyright, or Gutenberg spells the author differently.
          </p>
        )}
      </td>
      <td style={{ verticalAlign: 'top', paddingTop: 10, textAlign: 'right' }}>
        {/* Dismissing is reversible — Gutenberg keeps digitising, so this
            records "not there today", not "never look again". */}
        <button
          type="button"
          className="btn-ghost"
          onClick={onDismiss}
          disabled={busy}
          title="Not on Gutenberg — take it off this list"
          style={{ fontSize: 12, whiteSpace: 'nowrap' }}
        >
          Dismiss
        </button>
      </td>
    </tr>
  );
}

export function BulkImport({
  books,
  size,
  remaining,
  dismissed,
}: {
  books: BookRow[];
  size: number;
  remaining: number;
  dismissed: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [picks, setPicks] = useState<Record<string, number | null>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = Object.entries(picks).filter(([, id]) => id !== null) as Array<[string, number]>;
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visible = books.filter((b) => !hidden.has(b.bookId));

  function dismiss(bookId: string) {
    // Hidden immediately so a long list can be cleared without waiting on a
    // round trip per row; the server call still decides what persists.
    setHidden((h) => new Set(h).add(bookId));
    start(async () => {
      const res = await skipBookText(bookId);
      if (res.error) {
        setHidden((h) => {
          const next = new Set(h);
          next.delete(bookId);
          return next;
        });
        setError(res.error);
      }
    });
  }

  function runImport() {
    setError(null);
    setResult(null);
    start(async () => {
      const res = await importGutenbergBatch(selected.map(([bookId, gutenbergId]) => ({ bookId, gutenbergId })));
      if (res.error) {
        setError(res.error);
        return;
      }
      const failed = (res.results ?? []).filter((r) => !r.ok);
      setResult(
        `Imported ${res.imported ?? 0}` +
          (failed.length ? ` · ${failed.length} failed: ${failed.map((f) => f.error).join('; ')}` : ''),
      );
      setPicks({});
      router.refresh();
    });
  }

  function runParse() {
    setError(null);
    setResult(null);
    start(async () => {
      const res = await parseAllPendingTexts();
      if (res.error) setError(res.error);
      else setResult(`Parsed ${res.report?.ready ?? 0} · ${res.report?.blocks ?? 0} blocks · ${res.report?.failed ?? 0} failed`);
      router.refresh();
    });
  }

  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Everything imported here is fetched from Project Gutenberg and stored as{' '}
          <strong>public domain</strong>. That is not a setting on this page — it is the only thing
          Gutenberg publishes. For anything else, use the Full text panel on the book itself and
          choose the licence deliberately.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          fontSize: 13,
          flexWrap: 'wrap',
        }}
      >
        <span className="muted">
          {remaining} book{remaining === 1 ? '' : 's'} still without a text
          {dismissed > 0 && ` · ${dismissed} dismissed`}
        </span>
        <span style={{ marginLeft: 'auto' }} className="muted">
          Show
        </span>
        <select
          value={size}
          onChange={(e) => router.push(`/books/texts?limit=${e.target.value}`)}
          style={{ width: 80 }}
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => router.refresh()} disabled={pending}>
          Load next
        </button>
      </div>

      {books.length === 0 ? (
        <p className="muted">Every book in the catalog already has a text.</p>
      ) : (
        <>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Catalog book</th>
                <th>Project Gutenberg match</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <Row
                  key={row.bookId}
                  row={row}
                  chosen={picks[row.bookId] ?? null}
                  onChoose={(id) => setPicks((p) => ({ ...p, [row.bookId]: id }))}
                  onDismiss={() => dismiss(row.bookId)}
                  busy={pending}
                />
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending || selected.length === 0}
              onClick={runImport}
            >
              {pending ? 'Working…' : `Import ${selected.length} selected`}
            </button>
            <button type="button" className="btn" disabled={pending} onClick={runParse}>
              Parse pending texts
            </button>
          </div>
        </>
      )}

      {error && <p style={{ fontSize: 13, color: '#a33', marginTop: 12 }}>{error}</p>}
      {result && !error && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          {result}
        </p>
      )}

      <p className="muted" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
        Import stores the file and queues it. Parsing turns it into blocks, and the search index
        picks those up within a minute. Check the resulting file title on each book — a text
        attached to the wrong book is silent, and the book simply starts answering questions it has
        nothing to do with.
      </p>
    </>
  );
}
