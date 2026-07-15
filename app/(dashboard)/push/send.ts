import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Mirrors apps/api/src/lib/push.ts sendExpoPush — done directly so broadcasting
// doesn't depend on the Hono API being reachable. Expo's push endpoint is public
// (no secret needed); the same chunking + token shape as the app's own sender.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const isExpoToken = (t: string) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');
const CHUNK = 500;

export type Segment = 'all' | 'premium' | 'freemium';

/** Everyone in the segment — inbox rows go to all of them, device or not. */
async function userIdsForSegment(segment: Segment): Promise<string[]> {
  let query = supabaseAdmin.from('profiles').select('id');
  if (segment === 'premium' || segment === 'freemium') query = query.eq('subscription_tier', segment);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: string }[]).map((p) => p.id);
}

/** Persist the announcement in each recipient's in-app inbox (PRD §7). */
async function saveToInboxes(userIds: string[], payload: { title: string; body: string }): Promise<void> {
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const rows = userIds.slice(i, i + CHUNK).map((id) => ({
      user_id: id,
      type: 'announcement',
      data: { title: payload.title, body: payload.body },
    }));
    const { error } = await supabaseAdmin.from('notifications').insert(rows);
    if (error) {
      if (/notifications_type_check|check constraint/i.test(error.message)) {
        throw new Error(
          "The 'announcement' notification type isn't in the database yet — run migration 00000000000052_announcement_notifications.sql in Supabase Studio.",
        );
      }
      throw new Error(error.message);
    }
  }
}

async function tokensForUsers(userIds: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const { data } = await supabaseAdmin.from('push_tokens').select('token').in('user_id', userIds.slice(i, i + CHUNK));
    out.push(...((data ?? []) as { token: string }[]).map((r) => r.token));
  }
  return out.filter(isExpoToken);
}

/**
 * Announce to a segment: save an inbox notification for every user, then push to
 * the subset with a registered device.
 */
export async function sendBroadcast(
  segment: Segment,
  payload: { title: string; body: string },
): Promise<{ recipients: number; pushed: number }> {
  const userIds = await userIdsForSegment(segment);
  if (!userIds.length) return { recipients: 0, pushed: 0 };

  await saveToInboxes(userIds, payload);

  const tokens = await tokensForUsers(userIds);
  if (!tokens.length) return { recipients: userIds.length, pushed: 0 };

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    // `type` matches the app's NotifData shape → routes to the inbox on tap.
    data: { type: 'announcement' },
    sound: 'default' as const,
    channelId: 'default' as const,
    priority: 'high' as const,
  }));

  // Expo caps each request at 100 messages.
  for (let i = 0; i < messages.length; i += 100) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    } catch {
      // Best-effort — a failed chunk shouldn't abort the rest.
    }
  }
  return { recipients: userIds.length, pushed: tokens.length };
}
