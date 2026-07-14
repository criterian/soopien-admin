import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublisher } from '../data';
import { PublisherEditForm } from './PublisherEditForm';

export const dynamic = 'force-dynamic';

export default async function PublisherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getPublisher(id);
  if (!res) notFound();
  const { publisher, books } = res;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/publishers" className="muted" style={{ fontSize: 13 }}>
          ← Publishers
        </Link>
      </div>

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 26 }}>{publisher.name}</h1>
          <div className="sub">
            {books.length} book{books.length === 1 ? '' : 's'}
            {publisher.country ? ` · ${publisher.country}` : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <PublisherEditForm publisher={publisher} />

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Books</h2>
          {books.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>No linked books.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {books.map((b) => (
                <Link key={b.id} href={`/books/${b.id}`} style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
