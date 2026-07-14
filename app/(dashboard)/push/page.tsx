import { getPushReach } from './data';
import { BroadcastForm } from './BroadcastForm';
import { fmtNumber } from '@/lib/format';

export const metadata = { title: 'Push · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function PushPage() {
  const reach = await getPushReach().catch(() => null);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Push &amp; announcements</h1>
          <div className="sub">Broadcast a push notification to a segment</div>
        </div>
      </div>

      {reach ? (
        <div className="stat-grid">
          <div className="stat">
            <div className="label">Reachable users</div>
            <div className="value small">{fmtNumber(reach.users)}</div>
          </div>
          <div className="stat">
            <div className="label">Devices</div>
            <div className="value small">{fmtNumber(reach.devices)}</div>
          </div>
          <div className="stat">
            <div className="label">iOS</div>
            <div className="value small">{fmtNumber(reach.ios)}</div>
          </div>
          <div className="stat">
            <div className="label">Android</div>
            <div className="value small">{fmtNumber(reach.android)}</div>
          </div>
        </div>
      ) : null}

      <BroadcastForm />
    </div>
  );
}
