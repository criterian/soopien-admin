import { listTracks, type TrackRow } from './data';
import { AddTrackForm, TrackControls } from './MusicControls';
import { isUploadEnabled } from './actions';
import { CATEGORY_BY_KEY } from './constants';
import { fmtNumber } from '@/lib/format';

export const metadata = { title: 'Music library · Soopien Admin' };
export const dynamic = 'force-dynamic';

function dur(s: number | null): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default async function MusicPage() {
  const uploadEnabled = await isUploadEnabled();
  let tracks: TrackRow[] = [];
  let error: string | null = null;
  try {
    tracks = await listTracks();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load tracks';
  }

  // Group by category.
  const byCat = new Map<string, TrackRow[]>();
  for (const t of tracks) {
    const arr = byCat.get(t.category) ?? [];
    arr.push(t);
    byCat.set(t.category, arr);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Music library</h1>
          <div className="sub">{fmtNumber(tracks.length)} tracks · Reading Music (PRD §4.4.1)</div>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {byCat.size === 0 ? (
            <div className="card">
              <div className="empty">No tracks yet. Add one on the right.</div>
            </div>
          ) : (
            [...byCat.entries()].map(([cat, list]) => {
              const meta = CATEGORY_BY_KEY.get(cat as never);
              return (
                <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>{meta?.label ?? cat}</span>
                    <span className={`chip ${meta?.tier === 'premium' ? 'premium' : ''}`}>{meta?.tier ?? '—'}</span>
                    <span className="chip">{meta?.mood ?? '—'}</span>
                    <span className="muted" style={{ marginLeft: 'auto', fontSize: 12.5 }}>{list.length} tracks</span>
                  </div>
                  <table className="data">
                    <tbody>
                      {list.map((t) => (
                        <tr key={t.id} style={{ opacity: t.active ? 1 : 0.5 }}>
                          <td className="primary" style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{t.title}</td>
                          <td className="muted" style={{ fontSize: 12, fontFamily: 'monospace' }}>{t.storage_key}</td>
                          <td className="muted">{dur(t.duration_seconds)}</td>
                          <td>{t.active ? <span className="chip new">active</span> : <span className="chip archived">off</span>}</td>
                          <td>
                            <TrackControls id={t.id} active={t.active} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>

        <AddTrackForm uploadEnabled={uploadEnabled} />
      </div>
    </div>
  );
}
