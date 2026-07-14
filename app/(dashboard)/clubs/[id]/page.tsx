import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClub } from '../data';
import { MembersPanel } from './MembersPanel';
import { ClubActions } from './ClubActions';
import { fmtDate, fmtNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value small">{value}</div>
    </div>
  );
}

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getClub(id);
  if (!res) notFound();
  const { club, members, stats } = res;
  const price = club.price_cents != null ? `$${(club.price_cents / 100).toFixed(2)}` : null;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/clubs" className="muted" style={{ fontSize: 13 }}>
          ← Clubs
        </Link>
      </div>

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 26, display: 'flex', gap: 8, alignItems: 'center' }}>
            {club.name}
            <span className="chip">{club.kind === 'film' ? '▦ film' : '▤ book'}</span>
            {club.is_paid ? <span className="chip premium">paid{price ? ` · ${price}` : ''}</span> : null}
          </h1>
          <div className="sub">
            by @{club.founder?.username ?? '—'} · {club.visibility} · created {fmtDate(club.created_at)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <Metric label="Members" value={fmtNumber(club.member_count)} />
            <Metric label="Schedule weeks" value={fmtNumber(stats.weeks)} />
            <Metric label="Posts" value={fmtNumber(stats.posts)} />
            {club.is_paid ? <Metric label="Paid members" value={fmtNumber(stats.paidMembers)} /> : null}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, marginBottom: 14 }}>About</h2>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 12, columnGap: 12, fontSize: 13.5 }}>
              <dt className="muted">Active {club.kind}</dt>
              <dd style={{ margin: 0 }}>{club.activeTitle ?? <span className="muted">— none set</span>}</dd>
              <dt className="muted">Description</dt>
              <dd style={{ margin: 0 }}>{club.description || <span className="muted">—</span>}</dd>
              {club.is_paid ? (
                <>
                  <dt className="muted">Tiers</dt>
                  <dd style={{ margin: 0 }}>{fmtNumber(stats.tiers)}</dd>
                </>
              ) : null}
              {club.invite_code ? (
                <>
                  <dt className="muted">Invite code</dt>
                  <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{club.invite_code}</dd>
                </>
              ) : null}
              <dt className="muted">Club ID</dt>
              <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{club.id}</dd>
            </dl>
          </div>

          <MembersPanel clubId={club.id} members={members} />
        </div>

        <ClubActions clubId={club.id} visibility={club.visibility} name={club.name} />
      </div>
    </div>
  );
}
