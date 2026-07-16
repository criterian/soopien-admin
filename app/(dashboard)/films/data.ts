import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const PAGE_SIZE = 25;

export type FilmRow = {
  id: string;
  title: string;
  release_year: number | null;
  director: string | null;
  media_type: string;
  language: string | null;
  poster_url: string | null;
  imdb_rating: number | null;
  created_at: string;
};

export async function listFilms(opts: { q?: string; page?: number; filter?: string }): Promise<{ rows: FilmRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('films')
    .select('id, title, release_year, director, media_type, language, poster_url, imdb_rating, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const q = opts.q?.trim();
  if (q) query = query.or(`title.ilike.%${q}%,director.ilike.%${q}%`);
  if (opts.filter === 'movie' || opts.filter === 'tv') query = query.eq('media_type', opts.filter);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as FilmRow[], total: count ?? 0 };
}

/** Distinct director names already in the catalog, for the director picker. */
export async function listDirectorOptions(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('films')
    .select('director')
    .not('director', 'is', null)
    .limit(5000);
  const set = new Set<string>();
  for (const r of (data ?? []) as { director: string | null }[]) if (r.director) set.add(r.director);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Distinct genres present in the catalog (localized as stored), for the picker. */
export async function listGenreOptions(): Promise<string[]> {
  const { data } = await supabaseAdmin.from('films').select('genres').limit(5000);
  const set = new Set<string>();
  for (const r of (data ?? []) as { genres: string[] | null }[]) for (const g of r.genres ?? []) if (g) set.add(g);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export type FilmDetail = FilmRow & {
  tmdb_id: number | null;
  imdb_id: string | null;
  runtime_minutes: number | null;
  synopsis: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  genres: string[];
  rotten_tomatoes_score: number | null;
  metacritic_score: number | null;
  updated_at: string;
};

export async function getFilm(id: string): Promise<{
  film: FilmDetail;
  stats: { watchers: number; clips: number; reviews: number };
} | null> {
  const { data } = await supabaseAdmin
    .from('films')
    .select('id, title, release_year, director, media_type, language, poster_url, backdrop_url, trailer_url, synopsis, runtime_minutes, genres, tmdb_id, imdb_id, imdb_rating, rotten_tomatoes_score, metacritic_score, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const film = data as FilmDetail;

  const [watchers, clips, reviews] = await Promise.all([
    supabaseAdmin.from('user_films').select('*', { count: 'exact', head: true }).eq('film_id', id).then((r) => r.count ?? 0),
    supabaseAdmin.from('clips').select('*', { count: 'exact', head: true }).eq('film_id', id).then((r) => r.count ?? 0),
    supabaseAdmin.from('film_reviews').select('*', { count: 'exact', head: true }).eq('film_id', id).then((r) => r.count ?? 0),
  ]);

  return { film, stats: { watchers, clips, reviews } };
}
