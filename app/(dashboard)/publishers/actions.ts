'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type PublisherPatch = {
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  country: string | null;
  founded_year: number | null;
};

export async function updatePublisher(id: string, patch: PublisherPatch) {
  await requireAdmin();
  if (!patch.name.trim()) return { error: 'Name is required.' };
  const { error } = await supabaseAdmin
    .from('publishers')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/publishers/${id}`);
  revalidatePath('/publishers');
  return { ok: true };
}

export async function setPublisherVerified(id: string, verified: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('publishers').update({ verified }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/publishers/${id}`);
  revalidatePath('/publishers');
  return { ok: true };
}

/** Delete a publisher. Books' publisher_id is set null (FK on delete set null). */
export async function deletePublisher(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('publishers').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/publishers');
  redirect('/publishers');
}
