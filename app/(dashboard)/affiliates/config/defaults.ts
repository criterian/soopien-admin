import type { AffiliateConfig } from '../constants';

/** Empty config — the render fallback before the API responds. */
export const DEFAULT: AffiliateConfig = {
  amazonTags: {},
  bookshopId: null,
  awinPublisherId: null,
  awinAdvertisers: {},
  turkish: { kitapyurdu: null, dr: null, idefix: null },
  disabledProviders: [],
};
