'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { importGutenbergBatch, parseAllPendingTexts, searchGutenberg } from '../actions';

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
}: {
  row: BookRow;
  chosen: number | null;
  onChoose: (id: number | null) => void;
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
    </tr>
  );
}

export function BulkImport({ books }: { books: BookRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [picks, setPicks] = useState<Record<string, number | null>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = Object.entries(picks).filter(([, id]) => id !== null) as Array<[string, number]>;

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

      {books.length === 0 ? (
        <p className="muted">Every book in the catalog already has a text.</p>
      ) : (
        <>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Catalog book</th>
                <th>Project Gutenberg match</th>
              </tr>
            </thead>
            <tbody>
              {books.map((row) => (
                <Row
                  key={row.bookId}
                  row={row}
                  chosen={picks[row.bookId] ?? null}
                  onChoose={(id) => setPicks((p) => ({ ...p, [row.bookId]: id }))}
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
