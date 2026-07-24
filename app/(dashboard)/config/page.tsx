import Link from 'next/link';
import { getFreeExportEnabled, getFreemiumConfig } from './data';
import { FreeExportToggle } from './FreeExportToggle';
import { LimitRow } from './LimitRow';

export const metadata = { title: 'Limits & config · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  let limits: Awaited<ReturnType<typeof getFreemiumConfig>> = [];
  let freeExport = true;
  let error: string | null = null;
  try {
    [limits, freeExport] = await Promise.all([getFreemiumConfig(), getFreeExportEnabled()]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load config';
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Limits &amp; config</h1>
          <div className="sub">Admin-configurable freemium caps (PRD §5.1)</div>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <FreeExportToggle enabled={freeExport} />
          <div className="card" style={{ padding: '4px 20px 16px' }}>
            {limits.map((l) => (
              <LimitRow key={l.name} limit={l} />
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 8 }}>How this works</h2>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            Each cap defaults to the value shipped in the app. Saving an override writes it to
            <code> app_config</code>; the API reads these live (≈30s cache) and enforces them across
            book/film/clip/collection/club limits. “Reset” removes the override and reverts to the default.
          </p>
          <div style={{ marginTop: 12, fontSize: 12.5 }}>
            <Link href="/subscriptions" style={{ color: 'var(--terracotta)' }}>
              Billing rail →
            </Link>
            <span className="muted"> is configured on the Subscriptions page.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
