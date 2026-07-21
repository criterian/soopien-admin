import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type ReportStatus = 'open' | 'actioned' | 'dismissed';
export type ReportTargetType = 'clip' | 'comment' | 'profile';

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  note: string | null;
  status: string;
  created_at: string;
  reporter: { username: string; display_name: string | null } | null;
};

/** A preview of the reported item, resolved from the appropriate table. */
export type TargetPreview =
  | { kind: 'clip'; id: string; title: string | null; body: string | null; type: string; ownerId: string | null; ownerName: string | null; isPrivate: boolean; spoiler: boolean; mature: boolean; source: string | null; thumb: string | null; media: 'image' | 'video' | 'audio' | null; deleted?: false }
  | { kind: 'comment'; id: string; body: string; ownerId: string | null; clipId: string; deleted?: false }
  | { kind: 'profile'; id: string; username: string; displayName: string | null; deleted?: false }
  | { kind: ReportTargetType; id: string; deleted: true };

/**
 * A representative image for a clip, pulled from whichever metadata shape its
 * type uses. Capture clips (book_page/film_scene/capture_*) carry no text at
 * all, so without this the queue shows "(no text)" and the moderator can't see
 * what was actually reported.
 */
function clipThumb(metadata: unknown): { thumb: string | null; media: 'image' | 'video' | 'audio' | null } {
  const m = (metadata ?? {}) as Record<string, any>;
  const cap = m.capture;
  if (cap?.url) {
    if (cap.media === 'image') return { thumb: cap.url, media: 'image' };
    return { thumb: cap.thumbnail ?? null, media: cap.media ?? null }; // video/audio
  }
  const first =
    m.place?.photoUrl ??
    m.place?.photoUrls?.[0] ??
    m.video?.thumbnail ??
    m.music?.thumbnail ??
    m.film?.poster ??
    m.wikipedia?.thumbnail ??
    m.web_page?.image ??
    m.ai?.image ??
    null;
  return { thumb: typeof first === 'string' ? first : null, media: null };
}

/** One reported item, with all reports filed against it. */
export type ModerationGroup = {
  key: string;
  targetType: ReportTargetType;
  targetId: string;
  count: number;
  reasons: string[];
  latest: string;
  reports: { id: string; reason: string; note: string | null; reporter: string; created_at: string }[];
  preview: TargetPreview;
};

/**
 * The moderation queue: reports of a given status, grouped by the item they
 * target (so five reports on one clip is one card), each enriched with a preview
 * of the target content.
 */
export async function getModerationQueue(status: ReportStatus): Promise<ModerationGroup[]> {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, note, status, created_at, reporter:profiles!reports_reporter_id_fkey(username, display_name)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ReportRow[];

  // Group by target.
  const groups = new Map<string, ModerationGroup>();
  for (const r of rows) {
    const key = `${r.target_type}:${r.target_id}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        targetType: r.target_type,
        targetId: r.target_id,
        count: 0,
        reasons: [],
        latest: r.created_at,
        reports: [],
        preview: { kind: r.target_type, id: r.target_id, deleted: true },
      };
      groups.set(key, g);
    }
    g.count += 1;
    if (!g.reasons.includes(r.reason)) g.reasons.push(r.reason);
    g.reports.push({
      id: r.id,
      reason: r.reason,
      note: r.note,
      reporter: r.reporter?.username ?? '—',
      created_at: r.created_at,
    });
  }

  // Batch-resolve target previews per type.
  const byType = { clip: [] as string[], comment: [] as string[], profile: [] as string[] };
  for (const g of groups.values()) byType[g.targetType].push(g.targetId);

  await Promise.all([
    hydrateClips(byType.clip, groups),
    hydrateComments(byType.comment, groups),
    hydrateProfiles(byType.profile, groups),
  ]);

  return [...groups.values()].sort((a, b) => (a.latest < b.latest ? 1 : -1));
}

async function hydrateClips(ids: string[], groups: Map<string, ModerationGroup>) {
  if (!ids.length) return;
  const { data } = await supabaseAdmin
    .from('clips')
    .select('id, type, primary_text, secondary_text, note, metadata, user_id, is_private, contains_spoilers, mature_content, book:books(title), film:films(title), profile:profiles(username)')
    .in('id', ids);
  for (const c of (data ?? []) as any[]) {
    const g = groups.get(`clip:${c.id}`);
    const { thumb, media } = clipThumb(c.metadata);
    if (g) g.preview = {
      kind: 'clip',
      id: c.id,
      title: c.primary_text ?? c.secondary_text ?? null,
      body: c.note ?? null,
      type: c.type,
      ownerId: c.user_id ?? null,
      ownerName: c.profile?.username ?? null,
      isPrivate: !!c.is_private,
      spoiler: !!c.contains_spoilers,
      mature: !!c.mature_content,
      source: c.book?.title ?? c.film?.title ?? null,
      thumb,
      media,
    };
  }
}

async function hydrateComments(ids: string[], groups: Map<string, ModerationGroup>) {
  if (!ids.length) return;
  const { data } = await supabaseAdmin
    .from('clip_comments')
    .select('id, body, user_id, clip_id')
    .in('id', ids);
  for (const c of (data ?? []) as any[]) {
    const g = groups.get(`comment:${c.id}`);
    if (g) g.preview = { kind: 'comment', id: c.id, body: c.body, ownerId: c.user_id ?? null, clipId: c.clip_id };
  }
}

async function hydrateProfiles(ids: string[], groups: Map<string, ModerationGroup>) {
  if (!ids.length) return;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name')
    .in('id', ids);
  for (const p of (data ?? []) as any[]) {
    const g = groups.get(`profile:${p.id}`);
    if (g) g.preview = { kind: 'profile', id: p.id, username: p.username, displayName: p.display_name };
  }
}

/** Count of open reports — used for the sidebar badge and dashboard. */
export async function getOpenReportCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');
  return count ?? 0;
}
