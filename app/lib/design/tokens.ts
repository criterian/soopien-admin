/**
 * Soopien design tokens — vendored from `@soopien/shared` (packages/shared).
 * The admin is a standalone repo, so it can't use the workspace package; keep
 * these in sync with the source of truth if the brand palette changes.
 * Warm parchment base + single terracotta accent (#B4431F) + Newsreader serif.
 */

export const palette = {
  terracotta: '#B4431F',
  terracottaDeep: '#7A2E2E',
  gold: '#E8B84B',
  goldDeep: '#C28A2C',
  green: '#294C3E',
  greenBright: '#2E7D52',
  navy: '#25324F',
  blue: '#2B5C8A',
  clay: '#9C5A3C',
  plum: '#4A2E45',
  rose: '#C0504A',
} as const;

/** Light-theme semantic tokens (admin runs light-only for now). */
export const colors = {
  background: '#F4F3EF',
  backgroundElevated: '#F7F6F2',
  surface: '#FFFFFF',
  fill: '#F1EFE9',
  track: '#EFEDE6',
  textPrimary: '#1A1916',
  textSecondary: '#5C594F',
  textTertiary: '#78756E',
  muted: '#A8A49B',
  faint: '#C8C4BA',
  border: '#E8E6DF',
  divider: '#F0EEE8',
  chip: '#EAE7DF',
  ink: '#1A1916',
  primary: palette.terracotta,
  accent: palette.gold,
  success: palette.greenBright,
  destructive: palette.rose,
} as const;
