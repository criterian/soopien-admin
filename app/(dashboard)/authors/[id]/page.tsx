import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuthor } from '../data';
import { AuthorEditForm } from './AuthorEditForm';

export const dynamic = 'force-dynamic';

export default async function AuthorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getAuthor(id);
  if (!res) notFound();
  const { author, books } = res;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/authors" className="muted" style={{ fontSize: 13 }}>
          ← Authors
        </Link>
      </div>

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 26 }}>{author.name}</h1>
          <div className="sub">
            {books.length} book{books.length === 1 ? '' : 's'}
            {author.claimed_by ? ' · claimed' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <AuthorEditForm author={author} />

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Books</h2>
          {books.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>No linked books.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {books.map((b) => (
                <Link key={`${b.id}-${b.role}`} href={`/books/${b.id}`} style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
                  {b.role !== 'author' ? <span className="chip">{b.role}</span> : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
