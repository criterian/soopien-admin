import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFilm, listDirectorOptions, listGenreOptions } from '../data';
import { FilmEditForm } from './FilmEditForm';
import { FilmMediaField } from './FilmMediaField';
import { fmtNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value small">{value}</div>
    </div>
  );
}

export default async function FilmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, directors, genreOptions] = await Promise.all([
    getFilm(id),
    listDirectorOptions().catch(() => []),
    listGenreOptions().catch(() => []),
  ]);
  if (!res) notFound();
  const { film, stats } = res;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/films" className="muted" style={{ fontSize: 13 }}>
          ← Films
        </Link>
      </div>

      <div className="page-head">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {film.poster_url ? (
            <img src={film.poster_url} alt="" style={{ width: 56, height: 82, borderRadius: 4, objectFit: 'cover', background: 'var(--fill)' }} />
          ) : null}
          <div>
            <h1 style={{ fontSize: 26, display: 'flex', gap: 8, alignItems: 'center' }}>
              {film.title}
              <span className="chip">{film.media_type === 'tv' ? 'TV' : 'Movie'}</span>
            </h1>
            <div className="sub">{[film.release_year, film.director].filter(Boolean).join(' · ') || 'No details'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <FilmEditForm film={film} directors={directors} genreOptions={genreOptions} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>Media</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FilmMediaField filmId={film.id} kind="poster" url={film.poster_url} title={film.title} aspect="2 / 3" />
              <FilmMediaField filmId={film.id} kind="backdrop" url={film.backdrop_url} title={film.title} aspect="16 / 9" />
            </div>
            <div style={{ marginTop: 12 }}>
              <FilmMediaField filmId={film.id} kind="trailer" url={film.trailer_url} title={film.title} aspect="16 / 9" />
            </div>
          </div>

          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <Metric label="On shelves" value={fmtNumber(stats.watchers)} />
            <Metric label="Clips" value={fmtNumber(stats.clips)} />
            <Metric label="Reviews" value={fmtNumber(stats.reviews)} />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>External</h2>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 10, columnGap: 12, fontSize: 13 }}>
              <dt className="muted">TMDB ID</dt>
              <dd style={{ margin: 0 }}>{film.tmdb_id ?? '—'}</dd>
              <dt className="muted">IMDb</dt>
              <dd style={{ margin: 0 }}>{film.imdb_id ?? '—'}{film.imdb_rating != null ? ` · ${film.imdb_rating}` : ''}</dd>
              <dt className="muted">RT</dt>
              <dd style={{ margin: 0 }}>{film.rotten_tomatoes_score != null ? `${film.rotten_tomatoes_score}%` : '—'}</dd>
              <dt className="muted">Metacritic</dt>
              <dd style={{ margin: 0 }}>{film.metacritic_score ?? '—'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
