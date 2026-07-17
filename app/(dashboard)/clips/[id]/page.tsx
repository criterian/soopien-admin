import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClip } from '../data';
import { ClipModeration, DeleteComment } from './ClipModeration';
import { fmtDateTime, fmtNumber, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Pull the first http(s) URL out of a value (metadata often nests media URLs). */
function firstUrl(v: unknown): string | null {
  if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
  if (v && typeof v === 'object') {
    for (const val of Object.values(v)) {
      const u = firstUrl(val);
      if (u) return u;
    }
  }
  return null;
}
const isImageUrl = (u: string) => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(u);

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value small">{value}</div>
    </div>
  );
}

export default async function ClipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getClip(id);
  if (!res) notFound();
  const { clip, likes, comments, collections } = res;

  const ownerName = clip.profile?.display_name ?? clip.profile?.username ?? clip.user_id.slice(0, 8);
  const source = clip.book ?? clip.film;
  const sourceKind = clip.book ? 'book' : clip.film ? 'film' : null;
  const sourceImg = clip.book?.cover_front_url ?? clip.film?.poster_url ?? null;
  const metaImg = clip.metadata ? firstUrl(clip.metadata) : null;
  const metaEntries = Object.entries(clip.metadata ?? {}).filter(
    ([, v]) => v != null && (typeof v !== 'object' || Array.isArray(v)),
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/clips" className="muted" style={{ fontSize: 13 }}>
          ← Clips
        </Link>
      </div>

      <div className="page-head">
        <div>
          <h1 style={{ fontSize: 26, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="chip">{clip.type}</span>
            Clip
          </h1>
          <div className="sub">
            by{' '}
            <Link href={`/users/${clip.user_id}`} style={{ color: 'var(--terracotta)' }}>
              @{clip.profile?.username ?? ownerName}
            </Link>{' '}
            · {fmtDateTime(clip.created_at)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* ── Content ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            {clip.primary_text ? (
              <blockquote
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 20,
                  lineHeight: 1.5,
                  color: 'var(--text)',
                  borderLeft: '3px solid var(--terracotta)',
                  paddingLeft: 16,
                }}
              >
                {clip.primary_text}
              </blockquote>
            ) : (
              <span className="muted">(no primary text)</span>
            )}

            {clip.secondary_text ? (
              <div style={{ marginTop: 12, color: 'var(--text2)', fontSize: 14 }}>{clip.secondary_text}</div>
            ) : null}

            {clip.note ? (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-elev)', borderRadius: 8, fontSize: 13.5, color: 'var(--text2)' }}>
                <span className="muted" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Note</span>
                <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{clip.note}</div>
              </div>
            ) : null}

            {metaImg && isImageUrl(metaImg) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={metaImg} alt="" style={{ marginTop: 14, maxWidth: '100%', maxHeight: 360, borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
            ) : null}

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {clip.page != null ? <span className="chip">page {clip.page}</span> : null}
              {clip.external_url ? (
                <a className="btn sm" href={clip.external_url} target="_blank" rel="noreferrer">
                  Open link ↗
                </a>
              ) : null}
            </div>
          </div>

          {/* Metadata */}
          {metaEntries.length > 0 || Object.keys(clip.metadata ?? {}).length > 0 ? (
            <div className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 15, marginBottom: 12 }}>Details</h2>
              {metaEntries.length > 0 ? (
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '130px 1fr', rowGap: 8, columnGap: 12, fontSize: 13 }}>
                  {metaEntries.map(([k, v]) => (
                    <Fragment key={k}>
                      <dt className="muted">{k}</dt>
                      <dd style={{ margin: 0, wordBreak: 'break-word' }}>{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                    </Fragment>
                  ))}
                </dl>
              ) : null}
              <details style={{ marginTop: metaEntries.length ? 12 : 0 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--text3)' }}>Raw metadata</summary>
                <pre style={{ marginTop: 8, overflowX: 'auto', background: 'var(--bg-elev)', padding: 12, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5 }}>
                  {JSON.stringify(clip.metadata, null, 2)}
                </pre>
              </details>
            </div>
          ) : null}

          {/* Comments */}
          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Comments ({comments.length})</h2>
            {comments.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>No comments.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                      {initials(c.author?.display_name ?? c.author?.username)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Link href={`/users/${c.user_id}`} style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>
                          @{c.author?.username ?? c.user_id.slice(0, 8)}
                        </Link>
                        <span className="muted" style={{ fontSize: 11.5 }}>{fmtDateTime(c.created_at)}</span>
                        <span style={{ marginLeft: 'auto' }}>
                          <DeleteComment commentId={c.id} clipId={clip.id} />
                        </span>
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--text2)', marginTop: 2, whiteSpace: 'pre-wrap' }}>{c.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <Metric label="Likes" value={fmtNumber(likes)} />
            <Metric label="Comments" value={fmtNumber(comments.length)} />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Source</h2>
            {source && sourceKind ? (
              <Link href={`/${sourceKind}s/${source.id}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {sourceImg ? (
                  <img src={sourceImg} alt="" style={{ width: 34, height: 50, borderRadius: 4, objectFit: 'cover', background: 'var(--fill)' }} />
                ) : null}
                <span>
                  <div style={{ color: 'var(--text)', fontWeight: 500 }}>{source.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{sourceKind}</div>
                </span>
              </Link>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>—</div>
            )}

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>
              {clip.mature_content ? <span className="chip admin">mature</span> : null}
              {clip.contains_spoilers ? <span className="chip">spoiler</span> : null}
              {clip.is_private ? <span className="chip private">private</span> : <span className="chip new">public</span>}
            </div>

            {collections.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>In collections</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {collections.map((c) => (
                    <span key={c.id} className="chip">{c.name}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <ClipModeration clipId={clip.id} mature={clip.mature_content} spoiler={clip.contains_spoilers} isPrivate={clip.is_private} />
        </div>
      </div>
    </div>
  );
}
