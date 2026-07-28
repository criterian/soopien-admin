/** Shared shapes for the Emails module, mirroring the API's admin email routes. */

export type EmailCategory = 'product_news' | 'transactional';
export type EmailSegment = 'all' | 'premium' | 'freemium';

export interface EmailOverview {
  totalUsers: number;
  productNewsSubscribers: number;
  weeklyDigestSubscribers: number;
  suppressed: number;
  sentLast30d: number;
}

export interface EmailSendReport {
  recipients: number;
  sent: number;
  failed: number;
  skippedNoEmail: number;
  skippedSuppressed: number;
  skippedNotOptedIn: number;
  errors: { userId: string; message: string }[];
}

export interface UserEmailActivity {
  email: string | null;
  suppressed: { reason: string; detail: string | null; created_at: string } | null;
  preferences: { product_news: boolean; weekly_digest: boolean; onboarding: boolean };
  consents: { kind: string; action: string; locale: string | null; created_at: string }[];
  sends: { category: string; subject: string; status: string; error: string | null; created_at: string }[];
}
