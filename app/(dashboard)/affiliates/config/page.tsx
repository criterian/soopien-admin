import Link from 'next/link';
import { getAffiliateConfig } from './data';
import { AffiliateForm } from './AffiliateForm';
import { DEFAULT } from './defaults';

export const metadata = { title: 'Affiliate config · Soopien Admin' };
export const dynamic = 'force-dynamic';

export default async function AffiliateConfigPage() {
  let config = DEFAULT;
  let error: string | null = null;
  try {
    config = await getAffiliateConfig();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load affiliate config';
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Affiliate config</h1>
          <div className="sub">Buy-link tags &amp; ids per marketplace — book price comparison</div>
        </div>
        <Link href="/affiliates" className="btn sm">
          ← Analytics
        </Link>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <AffiliateForm initial={config} />
    </div>
  );
}
