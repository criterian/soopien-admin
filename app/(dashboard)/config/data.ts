import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Freemium caps (PRD §5.1). Defaults mirror @soopien/shared FREEMIUM_LIMITS; an
 * app_config row `freemium_<name>` overrides one. The API reads the same rows
 * (getFreemiumLimits) with a ~30s cache, so saved edits take effect platform-wide.
 */
export const LIMIT_DEFS = [
  { name: 'currentlyReadingBooks', label: 'Currently-reading books', def: 3, help: 'Max books in "Currently Reading" for free users.' },
  { name: 'films', label: 'Films on shelf', def: 50, help: 'Max films a free user can shelve.' },
  { name: 'clipsPerMonth', label: 'Clips per month', def: 20, help: 'Free clips created per calendar month.' },
  { name: 'collections', label: 'Collections', def: 1, help: 'Max collections for free users.' },
  { name: 'clubs', label: 'Club memberships', def: 2, help: 'Max clubs a free user can belong to.' },
] as const;

export type LimitName = (typeof LIMIT_DEFS)[number]['name'];

export type LimitValue = { name: LimitName; label: string; help: string; def: number; value: number; overridden: boolean };

export async function getFreemiumConfig(): Promise<LimitValue[]> {
  const { data } = await supabaseAdmin
    .from('app_config')
    .select('key, value')
    .like('key', 'freemium_%');
  const overrides = new Map<string, number>();
  for (const row of (data ?? []) as { key: string; value: unknown }[]) {
    const n = typeof row.value === 'number' ? row.value : Number.parseInt(String(row.value), 10);
    if (Number.isFinite(n)) overrides.set(row.key.slice('freemium_'.length), n);
  }
  return LIMIT_DEFS.map((d) => ({
    name: d.name,
    label: d.label,
    help: d.help,
    def: d.def,
    value: overrides.has(d.name) ? overrides.get(d.name)! : d.def,
    overridden: overrides.has(d.name),
  }));
}

/**
 * Feature flag: may free (non-Premium) users export/share clips & collections as
 * images? Stored in app_config.free_export_enabled; defaults to ON (open to all)
 * when unset. Mirrors the API's isFreeExportEnabled() fail-open behaviour.
 */
export async function getFreeExportEnabled(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'free_export_enabled')
    .maybeSingle();
  const v = (data as { value?: unknown } | null)?.value;
  if (v == null) return true; // default: open to everyone
  return v !== false && v !== 'false' && v !== 0;
}
