/**
 * Affiliate constants + types — VENDORED from packages/shared (types/offers.ts)
 * in the app monorepo. Keep in sync when the shared contract changes. The admin
 * repo is standalone (no @soopien/shared dep), so we copy rather than import.
 */

export const OFFER_COUNTRY = ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'TR'] as const;
export type OfferCountry = (typeof OFFER_COUNTRY)[number];

export const OFFER_PROVIDER = [
  'amazon',
  'bookshop',
  'waterstones',
  'blackwells',
  'fnac',
  'cultura',
  'thalia',
  'hugendubel',
  'ibs',
  'feltrinelli',
  'casadellibro',
  'kitapyurdu',
  'dr',
  'idefix',
] as const;
export type OfferProvider = (typeof OFFER_PROVIDER)[number];

export const OFFER_PROVIDER_META: Record<OfferProvider, { label: string; color: string }> = {
  amazon: { label: 'Amazon', color: '#FF9900' },
  bookshop: { label: 'Bookshop.org', color: '#3B7A57' },
  waterstones: { label: 'Waterstones', color: '#0B3D2E' },
  blackwells: { label: "Blackwell's", color: '#0F5C3E' },
  fnac: { label: 'Fnac', color: '#E8A33D' },
  cultura: { label: 'Cultura', color: '#00A9A5' },
  thalia: { label: 'Thalia', color: '#00A5A0' },
  hugendubel: { label: 'Hugendubel', color: '#E2001A' },
  ibs: { label: 'IBS.it', color: '#0066B3' },
  feltrinelli: { label: 'laFeltrinelli', color: '#C8102E' },
  casadellibro: { label: 'Casa del Libro', color: '#E63329' },
  kitapyurdu: { label: 'Kitapyurdu', color: '#00843D' },
  dr: { label: 'D&R', color: '#E4032E' },
  idefix: { label: 'İdefix', color: '#F36F21' },
};

export const OFFER_PROVIDERS_BY_COUNTRY: Record<OfferCountry, OfferProvider[]> = {
  US: ['amazon', 'bookshop'],
  GB: ['amazon', 'bookshop', 'waterstones', 'blackwells'],
  FR: ['amazon', 'fnac', 'cultura'],
  DE: ['amazon', 'thalia', 'hugendubel'],
  IT: ['amazon', 'ibs', 'feltrinelli'],
  ES: ['amazon', 'casadellibro', 'bookshop'],
  TR: ['amazon', 'kitapyurdu', 'dr', 'idefix'],
};

export const AWIN_PROVIDERS: OfferProvider[] = [
  'waterstones',
  'blackwells',
  'fnac',
  'cultura',
  'thalia',
  'hugendubel',
  'ibs',
  'feltrinelli',
  'casadellibro',
];

export const COUNTRY_LABEL: Record<OfferCountry, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  IT: 'Italy',
  ES: 'Spain',
  TR: 'Türkiye',
};

export interface AffiliateConfig {
  amazonTags: Partial<Record<OfferCountry, string>>;
  bookshopId: string | null;
  awinPublisherId: string | null;
  awinAdvertisers: Partial<Record<OfferProvider, string>>;
  turkish: { kitapyurdu: string | null; dr: string | null; idefix: string | null };
  disabledProviders: OfferProvider[];
}

export interface AffiliateAnalytics {
  days: number;
  totalClicks: number;
  byProvider: { provider: OfferProvider; label: string; clicks: number }[];
  byCountry: { country: OfferCountry; clicks: number }[];
  timeseries: { date: string; clicks: number }[];
  topBooks: { bookId: string; title: string; author: string | null; clicks: number }[];
  capped: boolean;
}
