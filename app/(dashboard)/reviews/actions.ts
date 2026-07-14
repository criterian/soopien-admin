'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ReviewKind } from './data';

export async function deleteReview(kind: ReviewKind, id: string) {
  await requireAdmin();
  const table = kind === 'film' ? 'film_reviews' : 'book_reviews';
  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/reviews');
  return { ok: true };
}
