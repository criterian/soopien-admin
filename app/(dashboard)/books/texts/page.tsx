import Link from 'next/link';
import { callAdminApi } from '@/lib/adminApi';
import { BulkImport, type BookRow } from './BulkImport';

export const dynamic = 'force-dynamic';

/**
 * Bulk full-text import from Project Gutenberg (DISCOVERY.md §7.3).
 *
 * Candidates are proposed by the API — matching needs Gutendex and the catalog
 * together, and the API is already where every decision about what may be
 * stored lives.
 */
export default async function BulkTextsPage() {
  const res = await callAdminApi<{ books: BookRow[] }>('/admin/texts/candidates?limit=25');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/books" className="muted" style={{ fontSize: 13 }}>
          ← Books
        </Link>
      </div>

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 26 }}>Bulk text import</h1>
          <div className="sub">
            Books with no full text yet, matched against Project Gutenberg. Review each pairing —
            nothing is imported until you pick it.
          </div>
        </div>
      </div>

      {res.ok ? (
        <BulkImport books={res.data.books} />
      ) : (
        <p style={{ color: '#a33', fontSize: 13 }}>Could not load candidates: {res.error}</p>
      )}
    </div>
  );
}
