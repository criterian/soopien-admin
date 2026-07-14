'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Recompute the denormalized member_count from active memberships. */
async function syncMemberCount(clubId: string) {
  const { count } = await supabaseAdmin
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .eq('status', 'active');
  await supabaseAdmin.from('book_clubs').update({ member_count: count ?? 0 }).eq('id', clubId);
}

/** Remove a member from a club (soft — status='removed'), then fix the count. */
export async function removeMember(clubId: string, userId: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('club_members')
    .update({ status: 'removed' })
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) return { error: error.message };
  await syncMemberCount(clubId);
  revalidatePath(`/clubs/${clubId}`);
  return { ok: true };
}

/** Approve a pending join request. */
export async function approveMember(clubId: string, userId: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('club_members')
    .update({ status: 'active' })
    .eq('club_id', clubId)
    .eq('user_id', userId);
  if (error) return { error: error.message };
  await syncMemberCount(clubId);
  revalidatePath(`/clubs/${clubId}`);
  return { ok: true };
}

/** Change a club's discoverability. */
export async function setVisibility(clubId: string, visibility: 'public' | 'private' | 'secret') {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('book_clubs')
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq('id', clubId);
  if (error) return { error: error.message };
  revalidatePath(`/clubs/${clubId}`);
  return { ok: true };
}

/** Disband a club. Members, weeks, posts, tiers, subscriptions cascade via FK. */
export async function deleteClub(clubId: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('book_clubs').delete().eq('id', clubId);
  if (error) return { error: error.message };
  revalidatePath('/clubs');
  redirect('/clubs');
}
