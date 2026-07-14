import Link from 'next/link';
import { getDashboardStats } from '@/lib/stats';
import { getOpenReportCount } from './moderation/data';
import { fmtNumber } from '@/lib/format';

export const metadata = { title: 'Dashboard · Soopien Admin' };
// Always fresh — these are live platform counts.
export const dynamic = 'force-dynamic';

function Stat({
  label,
  icon,
  value,
  delta,
  small,
}: {
  label: string;
  icon: string;
  value: string;
  delta?: string;
  small?: boolean;
}) {
  return (
    <div className="stat">
      <div className="label">
        <span>{icon}</span>
        {label}
      </div>
      <div className={`value${small ? ' small' : ''}`}>{value}</div>
      {delta ? <div className="delta">{delta}</div> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const s = await getDashboardStats();
  const openReports = await getOpenReportCount().catch(() => 0);
  const premiumPct = s.users ? Math.round((s.premium / s.users) * 100) : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Platform at a glance</div>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Total users" icon="⌘" value={fmtNumber(s.users)} delta={`+${fmtNumber(s.newUsers7d)} this week`} />
        <Stat label="Premium users" icon="✦" value={fmtNumber(s.premium)} delta={`${premiumPct}% of users`} />
        <Stat label="Clips created" icon="✂" value={fmtNumber(s.clips)} delta={`+${fmtNumber(s.clips7d)} this week`} />
        <Stat label="Books in catalog" icon="▤" value={fmtNumber(s.books)} />
        <Stat label="Films in catalog" icon="▦" value={fmtNumber(s.films)} />
        <Stat label="Book clubs" icon="◍" value={fmtNumber(s.clubs)} />
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 14 }}>Needs attention</h2>
      <div className="stat-grid">
        <Link href="/contact" style={{ display: 'contents' }}>
          <Stat label="New contact messages" icon="✉" value={fmtNumber(s.newContact)} small delta="Open inbox →" />
        </Link>
        <Link href="/payouts" style={{ display: 'contents' }}>
          <Stat label="Pending payouts" icon="➦" value={fmtNumber(s.pendingPayouts)} small delta="Payouts →" />
        </Link>
        <Link href="/moderation" style={{ display: 'contents' }}>
          <Stat label="Open reports" icon="⚑" value={fmtNumber(openReports)} small delta="Moderation queue →" />
        </Link>
      </div>
    </div>
  );
}
