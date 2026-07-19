import 'server-only';
import { callAdminApi } from '@/lib/adminApi';
import type { AffiliateAnalytics } from './constants';

/** Buy-link click analytics over the last `days` days. */
export async function getAffiliateAnalytics(days: number): Promise<AffiliateAnalytics> {
  const res = await callAdminApi<AffiliateAnalytics>(`/admin/affiliate/analytics?days=${days}`);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}
