import 'server-only';
import { callAdminApi } from '@/lib/adminApi';
import type { EmailOverview, UserEmailActivity } from './types';

/** Subscriber counts + suppression + recent send volume for the Emails overview. */
export async function getEmailOverview(): Promise<EmailOverview> {
  const res = await callAdminApi<EmailOverview>('/admin/emails/overview');
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

/** One user's email preferences, suppression, consent log and recent sends. */
export async function getUserEmail(userId: string): Promise<UserEmailActivity> {
  const res = await callAdminApi<UserEmailActivity>(`/admin/users/${userId}/email`);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}
