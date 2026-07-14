'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BILLING_PROVIDERS, type BillingProvider } from './constants';

/**
 * Switch the active personal-Premium billing rail. This is a plain app_config
 * write (the API's activePremiumProvider() reads the same key), so it doesn't
 * depend on the Hono API being reachable — done directly with the service role.
 */
export async function setBillingProvider(provider: BillingProvider) {
  await requireAdmin();
  if (!BILLING_PROVIDERS.includes(provider)) return { error: 'Invalid provider.' };
  const { error } = await supabaseAdmin
    .from('app_config')
    .upsert({ key: 'premium_billing_provider', value: provider, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return { error: error.message };
  revalidatePath('/subscriptions');
  return { ok: true };
}
