'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { callAdminApi } from '@/lib/adminApi';
import type { EmailCategory, EmailSegment, EmailSendReport } from './types';

export interface SendEmailInput {
  /** Exactly one of segment / userId. */
  segment?: EmailSegment;
  userId?: string;
  category: EmailCategory;
  subject: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
}

/**
 * Send a branded announcement via the API (which owns the templates, Resend, and
 * consent/suppression enforcement). Marketing (`product_news`) only reaches
 * opted-in users; `transactional` reaches everyone but suppressed addresses.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<{ error: string } | { report: EmailSendReport }> {
  await requireAdmin();

  const subject = input.subject.trim();
  const heading = input.heading.trim();
  const body = input.body.trim();
  if (!subject || !heading || !body) return { error: 'Subject, heading and message are required.' };
  if (!input.segment && !input.userId) return { error: 'Pick a segment or a user.' };

  const target = input.userId ? { userId: input.userId } : { segment: input.segment };
  const cta =
    input.cta && input.cta.label.trim() && input.cta.url.trim()
      ? { label: input.cta.label.trim(), url: input.cta.url.trim() }
      : undefined;

  const res = await callAdminApi<{ report: EmailSendReport }>('/admin/emails/send', {
    method: 'POST',
    body: { target, category: input.category, subject, heading, body, cta },
  });
  if (!res.ok) return { error: res.error };

  revalidatePath('/emails');
  if (input.userId) revalidatePath(`/users/${input.userId}`);
  return res.data;
}
