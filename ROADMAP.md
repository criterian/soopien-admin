# Soopien Admin — Roadmap

Module plan derived from the mobile app data model (40 tables) and the PRD.
Each module manages one slice of the platform. Data access is direct Supabase
service-role (server-side); a handful of actions call the Hono API.

## Modules & backing tables

| Module | Tables | Key actions |
|--------|--------|-------------|
| **Dashboard** | (aggregates) | Live KPIs, "needs attention" queue |
| **Users & Profiles** | `profiles`, `point_events`, `user_achievements` | Search, inspect, tier override, grant/revoke admin, GDPR delete |
| **Moderation** | ⚠️ needs `reports` table | Review reported clips/comments/reviews, flag mature, remove |
| **Clips** | `clips`, `clip_likes`, `clip_comments` | View, moderate, flag, delete |
| **Reviews** | `book_reviews`, `film_reviews` | Moderate, remove, spoiler flags |
| **Books catalog** | `books`, `authors`, `book_authors`, `publishers` | Edit metadata, ISBN de-dupe/merge, verify authors/publishers |
| **Films catalog** | `films`, `film_people` | Edit metadata, merge |
| **Collections** | `collections`, `collection_clips` | Inspect, remove |
| **Clubs** | `book_clubs`, `club_members`, `club_weeks`, `club_posts`, `club_films`, … | Inspect, moderate, member management, disband |
| **Subscriptions** | `premium_subscriptions`, `club_subscriptions`, `club_tiers`, `club_earnings` | View subs, provider oversight |
| **Payouts** | `club_payouts`, `founder_payout_accounts` | Generate monthly run, mark paid (via API) |
| **Music library** | `music_tracks` | CRUD categories/tracks, freemium vs premium, CDN URLs |
| **Gamification** | `point_events`, `user_achievements` | Leaderboards, point-value config |
| **Limits & config** | `app_config` | Freemium caps, billing provider, feature flags |
| **Push / announcements** | `push_tokens`, `notifications` | Broadcast, targeted push |
| **Contact inbox** | `contact_messages` | Triage marketing-site submissions |

## Phases

- **Phase 0 — Foundation** ✅ Next.js scaffold, Supabase service-role data layer,
  Supabase Auth login gated on `is_admin`, app shell + sidebar, Docker/Coolify.
- **Phase 1 — Core** ✅ Dashboard · Users & Profiles · Contact inbox.
- **Phase 2 — Content & moderation** — `reports` migration + API, then Moderation
  queue · Clips · Reviews.
- **Phase 3 — Catalog** — Books · Films · Authors/Publishers · Collections.
- **Phase 4 — Community** — Clubs (book + film), member management.
- **Phase 5 — Money** — Subscriptions · Paid-club tiers/earnings · Payouts (wire
  to existing `/admin/payouts` API).
- **Phase 6 — Config & growth** — Freemium limits (`app_config`) · Music library ·
  Gamification · Push/announcements.

## Known gaps (require monorepo changes)

1. **No `reports` table.** The PRD (§4.3, §9) requires a moderation queue, but
   reporting has no schema. Needs a migration + report-write endpoints in the API
   before the Moderation module can be built.
2. **Freemium limits aren't config-backed.** The PRD says every limit is
   "admin-configurable"; they should move into `app_config` so the Limits module
   can edit them.
