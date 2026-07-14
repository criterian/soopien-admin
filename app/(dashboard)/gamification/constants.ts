// Level thresholds + achievement labels (PRD §4.6). Vendored for display.
export const LEVELS = [
  { level: 1, name: 'Page Turner', emoji: '📖', min: 0 },
  { level: 2, name: 'Bookmarked', emoji: '🔖', min: 500 },
  { level: 3, name: 'Night Reader', emoji: '🕯️', min: 1500 },
  { level: 4, name: 'Explorer', emoji: '🗺️', min: 3500 },
  { level: 5, name: 'Scholar', emoji: '🏛️', min: 7000 },
  { level: 6, name: 'Luminary', emoji: '🌌', min: 15000 },
  { level: 7, name: 'Soopien Legend', emoji: '🌟', min: 30000 },
] as const;

export function levelFor(points: number): (typeof LEVELS)[number] {
  let out: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (points >= l.min) out = l;
  return out;
}

export const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_frame: '🎬 First Frame',
  first_chapter: '📚 First Chapter',
  clipster: '✂️ Clipster',
  on_fire: '🔥 On Fire',
  diamond_reader: '💎 Diamond Reader',
  century: '🎯 Century',
  cinephile: '🍿 Cinephile',
  year_of_pages: '🗓️ Year of Pages',
  social_butterfly: '🤝 Social Butterfly',
  curator: '🗂️ Curator',
  club_founder: '🏛️ Club Founder',
  fellow_reader: '📖 Fellow Reader',
  club_master: '🏆 Club Master',
  democratizer: '🗳️ Democratizer',
  discussion_leader: '🎙️ Discussion Leader',
};
