import Link from 'next/link';
import { listTracks, type TrackRow } from './data';
import { AddTrackForm, TrackControls } from './MusicControls';
import { MusicPlayerProvider, PlayButton } from './MusicPlayer';
import { isUploadEnabled } from './actions';
import { MUSIC_CATEGORIES, CATEGORY_BY_KEY, type MusicCategoryKey } from './constants';
import { fmtNumber } from '@/lib/format';

export const metadata = { title: 'Music library · Soopien Admin' };
export const dynamic = 'force-dynamic';

function dur(s: number | null): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default async function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat: catParam } = await searchParams;
  const uploadEnabled = await isUploadEnabled();

  let tracks: TrackRow[] = [];
  let error: string | null = null;
  try {
    tracks = await listTracks();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load tracks';
  }

  // Count per category.
  const counts = new Map<string, number>();
  for (const t of tracks) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);

  // Selected tab: the requested category, else the first category that has tracks.
  const known = MUSIC_CATEGORIES.some((c) => c.key === catParam);
  const firstWithTracks = MUSIC_CATEGORIES.find((c) => (counts.get(c.key) ?? 0) > 0)?.key;
  const active = (known ? catParam : firstWithTracks ?? MUSIC_CATEGORIES[0].key) as MusicCategoryKey;

  const meta = CATEGORY_BY_KEY.get(active);
  const list = tracks.filter((t) => t.category === active);

  return (
    <MusicPlayerProvider>
      <div className="page-head">
        <div>
          <h1>Music library</h1>
          <div className="sub">{fmtNumber(tracks.length)} tracks · Reading Music (PRD §4.4.1)</div>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {/* Category tabs */}
      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        {MUSIC_CATEGORIES.map((c) => {
          const n = counts.get(c.key) ?? 0;
          return (
            <Link key={c.key} href={`/music?cat=${c.key}`} className={`btn sm${active === c.key ? ' primary' : ''}`}>
              {c.label}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  opacity: active === c.key ? 0.85 : 0.6,
                  fontWeight: 600,
                }}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>{meta?.label ?? active}</span>
            <span className={`chip ${meta?.tier === 'premium' ? 'premium' : ''}`}>{meta?.tier ?? '—'}</span>
            <span className="chip">{meta?.mood ?? '—'}</span>
            <span className="muted" style={{ marginLeft: 'auto', fontSize: 12.5 }}>{list.length} tracks</span>
          </div>

          {list.length === 0 ? (
            <div className="empty">No tracks in this category yet. Add one on the right.</div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="data">
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} style={{ opacity: t.active ? 1 : 0.5 }}>
                      <td className="primary" style={{ fontSize: 13.5 }}>{t.title}</td>
                      <td className="muted" style={{ fontSize: 12, fontFamily: 'monospace' }}>{t.storage_key}</td>
                      <td className="muted">{dur(t.duration_seconds)}</td>
                      <td>{t.active ? <span className="chip new">active</span> : <span className="chip archived">off</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <PlayButton id={t.id} title={t.title} category={meta?.label} />
                          <TrackControls id={t.id} active={t.active} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AddTrackForm key={active} uploadEnabled={uploadEnabled} defaultCategory={active} />
      </div>
    </MusicPlayerProvider>
  );
}
