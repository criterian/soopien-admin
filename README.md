# Soopien Admin

Platform management dashboard for [Soopien](https://soopien.com) — the social book
& film tracking app. Standalone Next.js 15 app, deployed separately from the
mobile app / API monorepo (mirrors how the marketing site is split out).

## Architecture

- **Framework:** Next.js 15 (App Router, React 19, server components + server actions).
- **Data access:** the admin talks to **Supabase directly using the `service_role`
  key, server-side only** (`app/lib/supabase/admin.ts`, guarded by `server-only`).
  This bypasses RLS — appropriate for an admin tool, and the key never reaches the
  browser. Nearly everything (reads + writes, incl. the billing-rail switch and
  push broadcasts) is direct. **Only the Payouts actions** (generate run,
  mark-paid) call the Hono API (`apps/api`) — that grouping/threshold logic lives
  there and isn't duplicated. See [API dependency](#api-dependency) below.
- **Auth:** Supabase Auth (email + password). Access is gated on
  `profiles.is_admin = true`; `requireAdmin()` enforces it on every page/action, and
  `middleware.ts` bounces anonymous requests to `/login`.
- **Design:** brand tokens vendored from `@soopien/shared` into
  `app/lib/design/tokens.ts` (terracotta accent, Newsreader serif). Keep in sync
  with the monorepo if the palette changes.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3003
```

Required env (see `.env.example`):

| Var | Where it's used |
|-----|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | login + data client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | login (user session) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** data access |
| `API_URL` | Hono API base — **only** needed for the Payouts actions |

> Use `pnpm dev` for local work: it reads `.env.local` live. `pnpm build` inlines
> `NEXT_PUBLIC_*` at build time, so a production build must be built with the real
> values (see Deploy) — editing `.env.local` afterward won't change them.

### Granting admin access

There is no self-serve promotion. Grant it once with a service-role update:

```sql
update public.profiles set is_admin = true where username = '<you>';
```

## Modules

All shipped — Dashboard · Users · Contact · Moderation · Clips · Reviews · Books ·
Films · Authors · Publishers · Clubs · Subscriptions · Payouts · Music ·
Gamification · Push · Limits & config. See [ROADMAP.md](./ROADMAP.md).

## Deploy (Coolify)

Uses `output: 'standalone'`. The container listens on **port `3003`** (`Dockerfile`
sets `EXPOSE 3003` + `PORT=3003`).

1. **Application → Dockerfile** build pack; base directory `/`.
2. **Port:** set *Ports Exposes* to `3003`. Coolify's proxy serves it on your
   domain over 443 — no need to publish 3003 on the host.
3. **Build args** (inlined into the bundle at build time — set as *Build Variables*):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Runtime env** (never baked into the image):
   - `SUPABASE_SERVICE_ROLE_KEY` — required.
   - `API_URL` — only if you'll run payouts from the panel; point it at the
     deployed API (e.g. `https://api.soopien.com`), **not** `localhost`.

> ⚠️ The `NEXT_PUBLIC_*` values **must** be set as build args. If they're missing
> or wrong at build time, the deployed app authenticates against the wrong
> Supabase and every login fails with "invalid email or password".

## API dependency

The panel is self-sufficient except for **Payouts → Generate run / Mark paid**,
which call the Hono API (`POST /admin/*`) with the admin's forwarded JWT. Those
need the API running and reachable at `API_URL`. Everything else — all reads,
user/catalog/club/content management, the billing-rail switch, and push
broadcasts — is direct service-role and needs no API.
