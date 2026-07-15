import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook, listAuthorOptions, listPublisherOptions } from '../data';
import { languageLabel } from '../languages';
import { BookEditForm } from './BookEditForm';
import { CoverField } from './CoverField';
import { fmtNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value small">{value}</div>
    </div>
  );
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, authors, publishers] = await Promise.all([
    getBook(id),
    listAuthorOptions().catch(() => []),
    listPublisherOptions().catch(() => []),
  ]);
  if (!res) notFound();
  const { book, authors: linked, publisher, stats } = res;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/books" className="muted" style={{ fontSize: 13 }}>
          ← Books
        </Link>
      </div>

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 26 }}>{book.title}</h1>
          <div className="sub">
            {[book.author ?? 'Unknown author', languageLabel(book.language), book.isbn].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <BookEditForm book={book} authors={authors} publishers={publishers} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Covers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <CoverField bookId={book.id} side="front" url={book.cover_front_url} title={book.title} />
              <CoverField bookId={book.id} side="back" url={book.cover_back_url} title={book.title} />
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <Metric label="Readers" value={fmtNumber(stats.readers)} />
            <Metric label="Clips" value={fmtNumber(stats.clips)} />
            <Metric label="Reviews" value={fmtNumber(stats.reviews)} />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Linked entities</h2>
            <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 6 }}>Authors</div>
            {linked.length === 0 ? (
              <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>None linked (using text field)</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {linked.map((a) => (
                  <Link key={`${a.id}-${a.role}`} href={`/authors/${a.id}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{a.name}</span>
                    {a.role !== 'author' ? <span className="chip">{a.role}</span> : null}
                    {a.verified ? <span className="chip new">✓</span> : null}
                  </Link>
                ))}
              </div>
            )}
            <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 6 }}>Publisher</div>
            {publisher ? (
              <Link href={`/publishers/${publisher.id}`} style={{ color: 'var(--text)', fontWeight: 500 }}>
                {publisher.name} {publisher.verified ? <span className="chip new">✓</span> : null}
              </Link>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>None linked{book.publisher ? ` (text: ${book.publisher})` : ''}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
