import { getEmailOverview } from './data';
import { ComposeForm } from './ComposeForm';
import { fmtNumber } from '@/lib/format';

export const metadata = { title: 'Emails · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function EmailsPage() {
  const overview = await getEmailOverview().catch(() => null);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Emails</h1>
          <div className="sub">Broadcast announcements and check subscriber reach</div>
        </div>
      </div>

      {overview ? (
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Total users</div>
            <div className="value small">{fmtNumber(overview.totalUsers)}</div>
          </div>
          <div className="stat">
            <div className="label">Product-news opt-ins</div>
            <div className="value small">{fmtNumber(overview.productNewsSubscribers)}</div>
          </div>
          <div className="stat">
            <div className="label">Weekly-digest opt-ins</div>
            <div className="value small">{fmtNumber(overview.weeklyDigestSubscribers)}</div>
          </div>
          <div className="stat">
            <div className="label">Suppressed</div>
            <div className="value small">{fmtNumber(overview.suppressed)}</div>
          </div>
          <div className="stat">
            <div className="label">Sent · 30 days</div>
            <div className="value small">{fmtNumber(overview.sentLast30d)}</div>
          </div>
        </div>
      ) : (
        <div className="error-banner">Couldn’t load email stats — is the API reachable?</div>
      )}

      <ComposeForm />
    </div>
  );
}
