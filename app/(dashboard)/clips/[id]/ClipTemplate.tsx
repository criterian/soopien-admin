/* eslint-disable @next/next/no-img-element */
import type { ClipDetail } from '../data';

// Local mirrors of @soopien/shared clip metadata shapes (the admin repo can't
// import the workspace package). Kept loose — real data is validated app-side.
type VideoRef = { videoId: string; title?: string; channel?: string | null; thumbnail?: string | null; duration?: string | null };
type FilmRef = { tmdbId?: number; mediaType?: string; title?: string; year?: number | null; poster?: string | null; overview?: string | null };
type WikiRef = { title?: string; lang?: string; description?: string | null; extract?: string | null; thumbnail?: string | null; url?: string };
type PlaceRef = { name?: string; address?: string | null; lat?: number | null; lng?: number | null; placeId?: string; photoUrl?: string | null };
type WordRef = { word?: string; partOfSpeech?: string | null; translation?: string | null; definition?: string | null; synonyms?: string[]; antonyms?: string[]; etymology?: string | null; example?: string | null };
type AiFact = { label: string; value: string };
type AiRef = { kind?: string; term?: string; title?: string; subtitle?: string | null; summary?: string; facts?: AiFact[]; bullets?: string[] | null; image?: string | null };
type AiAnswer = { question?: string; answer?: string };
type CaptureRef = { url: string; media: 'image' | 'video' | 'audio'; seconds?: number | null; width?: number | null; height?: number | null; thumbnail?: string | null };
type EpisodeRef = { season: number; episode: number; name?: string | null };

type Meta = {
  word?: WordRef;
  episode?: EpisodeRef;
  place?: PlaceRef;
  video?: VideoRef;
  music?: VideoRef;
  film?: FilmRef;
  wikipedia?: WikiRef;
  ai?: AiRef;
  ai_answer?: AiAnswer;
  capture?: CaptureRef;
};

const ICON: Record<string, string> = {
  quote: '“', word: 'A', place: '⚑', date: '⌗', video: '▶', music: '♪', film: '▦',
  wikipedia: 'W', google_search: '⌕', person: '☺', recipe: '🍽', artwork: '🖼',
  book_page: '▤', film_scene: '▦',
};

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>{children}</div>;
}

function Quote({ text }: { text: string }) {
  return (
    <blockquote style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 21, lineHeight: 1.5, color: 'var(--text)', borderLeft: '3px solid var(--terracotta)', paddingLeft: 16 }}>
      {text}
    </blockquote>
  );
}

function MediaFrame({ children }: { children: React.ReactNode }) {
  return <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-elev)' }}>{children}</div>;
}

/** Renders a clip the way the app card would, chosen by type + metadata. */
export function ClipTemplate({ clip }: { clip: ClipDetail }) {
  const m = (clip.metadata ?? {}) as Meta;
  const video = clip.type === 'music' ? m.music : m.video;
  const ytUrl = video ? `https://www.youtube.com/watch?v=${video.videoId}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* type badge + episode */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--fill)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--terracotta)' }}>
          {ICON[clip.type] ?? '◆'}
        </span>
        <span className="chip">{clip.type.replace('_', ' ')}</span>
        {m.episode ? <span className="chip">S{m.episode.season}·E{m.episode.episode}{m.episode.name ? ` — ${m.episode.name}` : ''}</span> : null}
      </div>

      {/* primary text — quote-styled for quotes, heading otherwise */}
      {clip.primary_text ? (
        clip.type === 'quote' || clip.type === 'date' ? (
          <Quote text={clip.primary_text} />
        ) : (
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)' }}>{clip.primary_text}</div>
        )
      ) : null}
      {clip.secondary_text ? <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: -6 }}>{clip.secondary_text}</div> : null}

      {/* ── type-specific media card ─────────────────────────── */}

      {video ? (
        <MediaFrame>
          <div style={{ display: 'flex', gap: 12 }}>
            {video.thumbnail ? <img src={video.thumbnail} alt="" style={{ width: 140, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{video.title ?? 'Video'}</div>
              {video.channel ? <div className="muted" style={{ fontSize: 12.5 }}>{video.channel}</div> : null}
              {video.duration ? <div className="muted" style={{ fontSize: 12 }}>{video.duration}</div> : null}
              {ytUrl ? <a className="btn sm" href={ytUrl} target="_blank" rel="noreferrer" style={{ marginTop: 8 }}>{clip.type === 'music' ? 'Listen' : 'Watch'} on YouTube ↗</a> : null}
            </div>
          </div>
        </MediaFrame>
      ) : null}

      {m.film ? (
        <MediaFrame>
          <div style={{ display: 'flex', gap: 12 }}>
            {m.film.poster ? <img src={m.film.poster} alt="" style={{ width: 72, aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} /> : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{m.film.title} {m.film.year ? <span className="muted">({m.film.year})</span> : null}</div>
              <div className="muted" style={{ fontSize: 12 }}>{m.film.mediaType === 'tv' ? 'TV' : 'Movie'} · TMDB {m.film.tmdbId}</div>
              {m.film.overview ? <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>{m.film.overview}</div> : null}
            </div>
          </div>
        </MediaFrame>
      ) : null}

      {m.wikipedia ? (
        <MediaFrame>
          <div style={{ display: 'flex', gap: 12 }}>
            {m.wikipedia.thumbnail ? <img src={m.wikipedia.thumbnail} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{m.wikipedia.title} <span className="muted" style={{ fontSize: 11 }}>· Wikipedia {m.wikipedia.lang}</span></div>
              {m.wikipedia.description ? <div className="muted" style={{ fontSize: 12.5 }}>{m.wikipedia.description}</div> : null}
              {m.wikipedia.extract ? <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>{m.wikipedia.extract}</div> : null}
              {m.wikipedia.url ? <a className="btn sm" href={m.wikipedia.url} target="_blank" rel="noreferrer" style={{ marginTop: 8 }}>Read article ↗</a> : null}
            </div>
          </div>
        </MediaFrame>
      ) : null}

      {m.place ? (
        <MediaFrame>
          {m.place.photoUrl ? <img src={m.place.photoUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} /> : null}
          <div style={{ fontWeight: 500, color: 'var(--text)' }}>⚑ {m.place.name}</div>
          {m.place.address ? <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{m.place.address}</div> : null}
          {m.place.lat != null && m.place.lng != null ? (
            <a className="btn sm" href={`https://www.google.com/maps/search/?api=1&query=${m.place.lat},${m.place.lng}`} target="_blank" rel="noreferrer" style={{ marginTop: 8 }}>Open in Maps ↗</a>
          ) : null}
        </MediaFrame>
      ) : null}

      {m.word ? (
        <MediaFrame>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)' }}>{m.word.word}</span>
            {m.word.partOfSpeech ? <span className="muted" style={{ fontStyle: 'italic', fontSize: 13 }}>{m.word.partOfSpeech}</span> : null}
            {m.word.translation ? <span className="chip">{m.word.translation}</span> : null}
          </div>
          {m.word.definition ? <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8 }}>{m.word.definition}</div> : null}
          {m.word.example ? <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', marginTop: 6 }}>“{m.word.example}”</div> : null}
          {m.word.synonyms && m.word.synonyms.length ? <div style={{ fontSize: 12.5, marginTop: 8 }}><span className="muted">Synonyms: </span>{m.word.synonyms.join(', ')}</div> : null}
          {m.word.antonyms && m.word.antonyms.length ? <div style={{ fontSize: 12.5, marginTop: 2 }}><span className="muted">Antonyms: </span>{m.word.antonyms.join(', ')}</div> : null}
          {m.word.etymology ? <div style={{ fontSize: 12.5, marginTop: 8 }}><span className="muted">Etymology: </span>{m.word.etymology}</div> : null}
        </MediaFrame>
      ) : null}

      {m.ai ? (
        <MediaFrame>
          <div style={{ display: 'flex', gap: 12 }}>
            {m.ai.image ? <img src={m.ai.image} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : null}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{m.ai.title}</div>
              {m.ai.subtitle ? <div className="muted" style={{ fontSize: 12.5 }}>{m.ai.subtitle}</div> : null}
            </div>
          </div>
          {m.ai.summary ? <div style={{ fontSize: 13.5, color: 'var(--text2)', marginTop: 10 }}>{m.ai.summary}</div> : null}
          {m.ai.facts && m.ai.facts.length ? (
            <dl style={{ margin: '10px 0 0', display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 5, columnGap: 12, fontSize: 12.5 }}>
              {m.ai.facts.map((f, i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <dt className="muted">{f.label}</dt>
                  <dd style={{ margin: 0 }}>{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {m.ai.bullets && m.ai.bullets.length ? (
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--text2)' }}>
              {m.ai.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : null}
        </MediaFrame>
      ) : null}

      {m.ai_answer ? (
        <MediaFrame>
          <Label>Question</Label>
          <div style={{ fontWeight: 500, color: 'var(--text)' }}>{m.ai_answer.question}</div>
          <Label>Answer</Label>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>{m.ai_answer.answer}</div>
        </MediaFrame>
      ) : null}

      {m.capture ? (
        <MediaFrame>
          {m.capture.media === 'image' ? (
            <img src={m.capture.url} alt="" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, display: 'block' }} />
          ) : m.capture.media === 'video' ? (
            <video controls poster={m.capture.thumbnail ?? undefined} style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }}>
              <source src={m.capture.url} />
            </video>
          ) : (
            <audio controls src={m.capture.url} style={{ width: '100%' }} />
          )}
          {m.capture.seconds ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{m.capture.seconds}s</div> : null}
        </MediaFrame>
      ) : null}

      {/* note + footer chips */}
      {clip.note ? (
        <div style={{ padding: 12, background: 'var(--bg-elev)', borderRadius: 8, fontSize: 13.5, color: 'var(--text2)' }}>
          <Label>Note</Label>
          <div style={{ whiteSpace: 'pre-wrap' }}>{clip.note}</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {clip.page != null ? <span className="chip">{clip.book ? `page ${clip.page}` : `min ${clip.page}`}</span> : null}
        {clip.external_url && !video && !m.wikipedia ? (
          <a className="btn sm" href={clip.external_url} target="_blank" rel="noreferrer">Open link ↗</a>
        ) : null}
      </div>
    </div>
  );
}
