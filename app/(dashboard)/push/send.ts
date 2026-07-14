import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Mirrors apps/api/src/lib/push.ts sendExpoPush — done directly so broadcasting
// doesn't depend on the Hono API being reachable. Expo's push endpoint is public
// (no secret needed); the same chunking + token shape as the app's own sender.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const isExpoToken = (t: string) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');

export type Segment = 'all' | 'premium' | 'freemium';

async function tokensForSegment(segment: Segment): Promise<string[]> {
  if (segment === 'premium' || segment === 'freemium') {
    const { data: profs } = await supabaseAdmin.from('profiles').select('id').eq('subscription_tier', segment);
    const ids = ((profs ?? []) as { id: string }[]).map((p) => p.id);
    if (!ids.length) return [];
    const { data } = await supabaseAdmin.from('push_tokens').select('token').in('user_id', ids);
    return ((data ?? []) as { token: string }[]).map((r) => r.token);
  }
  // 'all' — every registered device.
  const { data } = await supabaseAdmin.from('push_tokens').select('token');
  return ((data ?? []) as { token: string }[]).map((r) => r.token);
}

/** Send an announcement push to a segment. Returns how many devices were targeted. */
export async function sendBroadcast(
  segment: Segment,
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<{ sent: number }> {
  const tokens = (await tokensForSegment(segment)).filter(isExpoToken);
  if (!tokens.length) return { sent: 0 };

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default' as const,
    channelId: 'default' as const,
    priority: 'high' as const,
  }));

  // Expo caps each request at 100 messages.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });
    } catch {
      // Best-effort — a failed chunk shouldn't abort the rest.
    }
  }
  return { sent: tokens.length };
}
