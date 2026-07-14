'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function updateAuthor(id: string, patch: { name: string; bio: string | null; photo_url: string | null }) {
  await requireAdmin();
  if (!patch.name.trim()) return { error: 'Name is required.' };
  const { error } = await supabaseAdmin
    .from('authors')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/authors/${id}`);
  revalidatePath('/authors');
  return { ok: true };
}

/** Toggle the verified badge (PRD: authors are claimable/verifiable entities). */
export async function setAuthorVerified(id: string, verified: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('authors').update({ verified }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/authors/${id}`);
  revalidatePath('/authors');
  return { ok: true };
}

/** Delete an author entity. book_authors links cascade; books keep their text author. */
export async function deleteAuthor(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from('authors').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/authors');
  redirect('/authors');
}
