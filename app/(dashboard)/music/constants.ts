// Vendored from @soopien/shared MUSIC_CATEGORIES (PRD §4.4.1). Mood + tier are
// derived from the category, matching the seed convention.
export const MUSIC_CATEGORIES = [
  { key: 'lofi_focus', label: 'Lo-fi Focus', mood: 'focus', tier: 'freemium' },
  { key: 'classical_focus', label: 'Classical Focus', mood: 'focus', tier: 'freemium' },
  { key: 'ambient_nature', label: 'Ambient Nature', mood: 'relax', tier: 'freemium' },
  { key: 'jazz_reading', label: 'Jazz Reading', mood: 'relax', tier: 'freemium' },
  { key: 'epic_focus', label: 'Epic / Deep Focus', mood: 'focus', tier: 'premium' },
  { key: 'binaural_alpha', label: 'Binaural Beats — Alpha', mood: 'focus', tier: 'premium' },
  { key: 'binaural_theta', label: 'Binaural Beats — Theta', mood: 'focus', tier: 'premium' },
  { key: 'sleep_reading', label: 'Sleep Reading', mood: 'night', tier: 'premium' },
  { key: 'white_noise', label: 'White / Brown Noise', mood: 'focus', tier: 'premium' },
] as const;

export type MusicCategoryKey = (typeof MUSIC_CATEGORIES)[number]['key'];

export const CATEGORY_BY_KEY = new Map(MUSIC_CATEGORIES.map((c) => [c.key, c]));
