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
export default async function BulkTextsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const { limit } = await searchParams;
  // Bounded here rather than trusted from the URL: each listed book costs an
  // external Gutenberg lookup.
  const size = Math.min(Math.max(Number.parseInt(limit ?? '25', 10) || 25, 5), 50);
  const res = await callAdminApi<{ books: BookRow[]; remaining: number; dismissed: number }>(
    `/admin/texts/candidates?limit=${size}`,
  );

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
        <BulkImport
          books={res.data.books}
          size={size}
          remaining={res.data.remaining}
          dismissed={res.data.dismissed}
        />
      ) : (
        <p style={{ color: '#a33', fontSize: 13 }}>Could not load candidates: {res.error}</p>
      )}
    </div>
  );
}
