import 'server-only';
import { callAdminApi } from '@/lib/adminApi';
import type { AffiliateConfig } from '../constants';

/** Current affiliate config from the API (DB-backed, env-seeded on first run). */
export async function getAffiliateConfig(): Promise<AffiliateConfig> {
  const res = await callAdminApi<{ config: AffiliateConfig }>('/admin/affiliate/config');
  if (!res.ok) throw new Error(res.error);
  return res.data.config;
}
