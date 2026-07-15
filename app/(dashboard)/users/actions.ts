'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Set a user's subscription tier (manual override / comp).
 *
 * `subscription_tier` is the flag enforcement actually reads; `premium_until`
 * records when the comped period ends (null = no expiry). Downgrading clears it.
 * This only touches the profile — `premium_subscriptions` stays the billing
 * provider's mirror, so a manual grant never masquerades as a real subscription.
 *
 * @param premiumUntil ISO date (YYYY-MM-DD) or null for no expiry.
 */
export async function setTier(userId: string, tier: 'freemium' | 'premium', premiumUntil: string | null = null) {
  await requireAdmin();

  let until: string | null = null;
  if (tier === 'premium' && premiumUntil) {
    const d = new Date(premiumUntil);
    if (Number.isNaN(d.getTime())) return { error: 'Invalid expiry date.' };
    // End of the chosen day, so the last day is fully included.
    d.setUTCHours(23, 59, 59, 999);
    if (d.getTime() < Date.now()) return { error: 'Expiry date is in the past.' };
    until = d.toISOString();
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: tier,
      premium_until: tier === 'premium' ? until : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) return { error: error.message };
  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
  return { ok: true };
}

/** Grant or revoke app-admin access. Guards against self-demotion lockout. */
export async function setAdmin(userId: string, isAdmin: boolean) {
  const me = await requireAdmin();
  if (me.id === userId && !isAdmin) {
    return { error: 'You cannot revoke your own admin access.' };
  }
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) return { error: error.message };
  revalidatePath(`/users/${userId}`);
  return { ok: true };
}

/**
 * Permanently delete a user (GDPR §9.5). Removes the auth account; the profiles
 * row and all owned content cascade via `on delete cascade` FKs.
 */
export async function deleteUser(userId: string) {
  const me = await requireAdmin();
  if (me.id === userId) return { error: 'You cannot delete your own account here.' };

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath('/users');
  redirect('/users');
}
