// Plain constants (no server-only) so both the server data layer and the client
// BillingProviderCard can import them.
export const BILLING_PROVIDERS = ['revenuecat', 'lemonsqueezy'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
