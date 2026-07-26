'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBookText, importBookText, parsePendingTexts, type TextLicense } from '../actions';
import type { BookText } from '../data';

/**
 * Full-text management for a book (DISCOVERY.md §7, §9).
 *
 * Uploading a book's text is the one admin action with legal consequences, so
 * the licence is a deliberate choice with no pre-selected safe-looking default,
 * and what each value permits is stated on screen rather than assumed known.
 */

type TextRow = BookText & { chunks: number };

const LICENSES: Array<{ value: TextLicense; label: string; hint: string }> = [
  {
    value: 'public_domain',
    label: 'Public domain',
    hint: 'Indexed and quotable. Gutenberg, Standard Ebooks, pre-1929 works.',
  },
  {
    value: 'licensed',
    label: 'Licensed',
    hint: 'Quotable within what the publisher agreed to. Keep the agreement on file.',
  },
  {
    value: 'no_display',
    label: 'Index only',
    hint: 'Helps discovery find the book. Never shown to a reader, not one sentence.',
  },
];

const STATUS_COLOR: Record<TextRow['status'], string> = {
  ready: '#2f7d55',
  parsing: '#8a6d1f',
  pending: '#8a6d1f',
  failed: '#a33',
};

function StatusPill({ status }: { status: TextRow['status'] }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: STATUS_COLOR[status],
        border: `1px solid ${STATUS_COLOR[status]}44`,
        background: `${STATUS_COLOR[status]}11`,
        borderRadius: 999,
        padding: '2px 8px',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {status}
    </span>
  );
}

export function BookTextsPanel({ bookId, texts }: { bookId: string; texts: TextRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<'gutenberg' | 'url'>('gutenberg');
  const [gutenbergId, setGutenbergId] = useState('');
  const [url, setUrl] = useState('');
  const [license, setLicense] = useState<TextLicense | ''>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPending = texts.some((t) => t.status === 'pending' || t.status === 'parsing');

  function run(action: () => Promise<{ ok?: boolean; error?: string; report?: unknown }>, done?: string) {
    setError(null);
    setMessage(null);
    start(async () => {
      const res = await action();
      if (res.error) setError(res.error);
      else {
        setMessage(done ?? 'Done');
        router.refresh();
      }
    });
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h2 style={{ fontSize: 15, marginBottom: 4 }}>Full text</h2>
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.5 }}>
        Makes the book itself searchable, not just its blurb. Only ever used to help readers find the
        right book — the file is never served to anyone.
      </p>

      {texts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {texts.map((t) => (
            <div
              key={t.id}
              style={{
                border: '1px solid var(--border, #e6e1d8)',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 13 }}>{t.format.toUpperCase()}</strong>
                <StatusPill status={t.status} />
                <span className="muted" style={{ fontSize: 12 }}>
                  {LICENSES.find((l) => l.value === t.license)?.label ?? t.license}
                </span>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={pending}
                  onClick={() => run(() => deleteBookText(bookId, t.id), 'Text removed')}
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#a33' }}
                >
                  Remove
                </button>
              </div>

              <div className="muted" style={{ fontSize: 12 }}>
                {t.block_count > 0 ? `${t.block_count} blocks` : 'not parsed yet'}
                {t.status === 'ready' && ` · ${t.chunks} chunks indexed`}
                {t.status === 'ready' && t.chunks === 0 && ' (ingest runs within a minute)'}
              </div>

              {t.title && (
                <div className="muted" style={{ fontSize: 12 }}>
                  File title: {t.title}
                </div>
              )}
              {t.source_url && (
                <a
                  href={t.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="muted"
                  style={{ fontSize: 11.5, wordBreak: 'break-all' }}
                >
                  {t.source_url}
                </a>
              )}
              {t.error && (
                <div style={{ fontSize: 12, color: '#a33', lineHeight: 1.45 }}>{t.error}</div>
              )}
            </div>
          ))}

          {hasPending && (
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => run(() => parsePendingTexts(bookId), 'Parsed')}
            >
              {pending ? 'Parsing…' : 'Parse pending text'}
            </button>
          )}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border, #e6e1d8)', paddingTop: 14 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 12.5 }}>
          <label style={{ display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              checked={mode === 'gutenberg'}
              onChange={() => setMode('gutenberg')}
            />
            Gutenberg id
          </label>
          <label style={{ display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer' }}>
            <input type="radio" checked={mode === 'url'} onChange={() => setMode('url')} />
            Direct URL
          </label>
        </div>

        {mode === 'gutenberg' ? (
          <>
            <input
              value={gutenbergId}
              onChange={(e) => setGutenbergId(e.target.value)}
              placeholder="84"
              inputMode="numeric"
              style={{ width: '100%', marginBottom: 4 }}
            />
            <p className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
              The number in gutenberg.org/ebooks/<strong>84</strong>. The EPUB edition is fetched.
            </p>
          </>
        ) : (
          <>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://standardebooks.org/…/download/…epub"
              style={{ width: '100%', marginBottom: 4 }}
            />
            <p className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
              Must end in .epub or .txt. PDF is not supported yet.
            </p>
          </>
        )}

        <label style={{ display: 'block', fontSize: 12.5, marginBottom: 5 }}>Licence</label>
        <select
          value={license}
          onChange={(e) => setLicense(e.target.value as TextLicense)}
          style={{ width: '100%', marginBottom: 6 }}
        >
          {/* No pre-selected value: picking the licence has to be a decision. */}
          <option value="">Choose…</option>
          {LICENSES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        {license && (
          <p className="muted" style={{ fontSize: 11.5, marginBottom: 12, lineHeight: 1.5 }}>
            {LICENSES.find((l) => l.value === license)?.hint}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || !license}
          onClick={() =>
            run(
              () => importBookText(bookId, { url, gutenbergId, license: license as TextLicense }),
              'Imported — now parse it',
            )
          }
          style={{ width: '100%' }}
        >
          {pending ? 'Importing…' : 'Import text'}
        </button>

        {error && <p style={{ fontSize: 12, color: '#a33', marginTop: 10 }}>{error}</p>}
        {message && !error && (
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
