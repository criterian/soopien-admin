// Book languages. Catalog data is a mix of ISO 639-1 (`tr`) and the ISO 639-2/B
// codes the enrichment sources return (`eng`, `tur`, `dut`, `slv`…), so each entry
// carries the legacy codes as aliases: existing rows resolve to the right option,
// and saving normalizes to the 2-letter code.
// Plain module (no server-only) — imported by both the form and the data layer.

export type Language = { code: string; name: string; aliases?: readonly string[] };

export const LANGUAGES: readonly Language[] = [
  { code: 'en', name: 'English', aliases: ['eng'] },
  { code: 'tr', name: 'Turkish', aliases: ['tur'] },
  { code: 'fr', name: 'French', aliases: ['fre', 'fra'] },
  { code: 'de', name: 'German', aliases: ['ger', 'deu'] },
  { code: 'es', name: 'Spanish', aliases: ['spa'] },
  { code: 'it', name: 'Italian', aliases: ['ita'] },
  { code: 'pt', name: 'Portuguese', aliases: ['por'] },
  { code: 'ru', name: 'Russian', aliases: ['rus'] },
  { code: 'zh', name: 'Chinese', aliases: ['chi', 'zho'] },
  { code: 'ar', name: 'Arabic', aliases: ['ara'] },
  { code: 'nl', name: 'Dutch', aliases: ['dut', 'nld'] },
  { code: 'pl', name: 'Polish', aliases: ['pol'] },
  { code: 'sv', name: 'Swedish', aliases: ['swe'] },
  { code: 'no', name: 'Norwegian', aliases: ['nor'] },
  { code: 'da', name: 'Danish', aliases: ['dan'] },
  { code: 'fi', name: 'Finnish', aliases: ['fin'] },
  { code: 'el', name: 'Greek', aliases: ['gre', 'ell'] },
  { code: 'he', name: 'Hebrew', aliases: ['heb'] },
  { code: 'hi', name: 'Hindi', aliases: ['hin'] },
  { code: 'ja', name: 'Japanese', aliases: ['jpn'] },
  { code: 'ko', name: 'Korean', aliases: ['kor'] },
  { code: 'fa', name: 'Persian', aliases: ['per', 'fas'] },
  { code: 'cs', name: 'Czech', aliases: ['cze', 'ces'] },
  { code: 'hu', name: 'Hungarian', aliases: ['hun'] },
  { code: 'ro', name: 'Romanian', aliases: ['rum', 'ron'] },
  { code: 'uk', name: 'Ukrainian', aliases: ['ukr'] },
  { code: 'bg', name: 'Bulgarian', aliases: ['bul'] },
  { code: 'sr', name: 'Serbian', aliases: ['srp'] },
  { code: 'hr', name: 'Croatian', aliases: ['hrv'] },
  { code: 'sl', name: 'Slovenian', aliases: ['slv'] },
  { code: 'sk', name: 'Slovak', aliases: ['slo', 'slk'] },
  { code: 'ca', name: 'Catalan', aliases: ['cat'] },
  { code: 'la', name: 'Latin', aliases: ['lat'] },
  { code: 'id', name: 'Indonesian', aliases: ['ind'] },
  { code: 'vi', name: 'Vietnamese', aliases: ['vie'] },
  { code: 'th', name: 'Thai', aliases: ['tha'] },
  { code: 'az', name: 'Azerbaijani', aliases: ['aze'] },
  { code: 'ka', name: 'Georgian', aliases: ['geo', 'kat'] },
  { code: 'hy', name: 'Armenian', aliases: ['arm', 'hye'] },
  { code: 'ku', name: 'Kurdish', aliases: ['kur'] },
] as const;

/** Match a stored value (`tr`, `tur`, `Turkish`…) to a known language. */
export function resolveLanguage(value: string | null | undefined): Language | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  return (
    LANGUAGES.find((l) => l.code === v || l.aliases?.includes(v) || l.name.toLowerCase() === v) ?? null
  );
}

/** Full name for display; falls back to the raw value for unknown codes. */
export function languageLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return resolveLanguage(value)?.name ?? value;
}
