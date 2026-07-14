import Link from 'next/link';
import { getModerationQueue, type ReportStatus } from './data';
import { ModerationCard } from './ModerationCard';

export const metadata = { title: 'Moderation · Soopien Admin' };
export const dynamic = 'force-dynamic';

const TABS: { key: ReportStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'actioned', label: 'Actioned' },
  { key: 'dismissed', label: 'Dismissed' },
];

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = (TABS.some((t) => t.key === statusParam) ? statusParam : 'open') as ReportStatus;

  let groups: Awaited<ReturnType<typeof getModerationQueue>> = [];
  let error: string | null = null;
  try {
    groups = await getModerationQueue(status);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load reports';
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Moderation</h1>
          <div className="sub">Reported clips, comments, and profiles (PRD §4.3, §9)</div>
        </div>
      </div>

      <div className="toolbar">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'open' ? '/moderation' : `/moderation?status=${t.key}`}
            className={`btn sm${status === t.key ? ' primary' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="error-banner">
          {error}
          {error.includes('reports') || error.toLowerCase().includes('relation') ? (
            <div style={{ marginTop: 6, fontSize: 12.5 }}>
              The <code>reports</code> table may not be migrated yet — run migration 00000000000051_reports.sql.
            </div>
          ) : null}
        </div>
      ) : null}

      {!error && groups.length === 0 ? (
        <div className="card">
          <div className="empty">Nothing in the {status} queue. 🎉</div>
        </div>
      ) : (
        groups.map((g) => <ModerationCard key={g.key} group={g} />)
      )}
    </div>
  );
}
