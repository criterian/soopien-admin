'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type ContactStatus = 'new' | 'read' | 'archived';

/** Move a contact message between new / read / archived. */
export async function setContactStatus(id: string, status: ContactStatus) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('contact_messages')
    .update({ status })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/contact');
  return { ok: true };
}
