# Soopien Admin

Platform management dashboard for [Soopien](https://soopien.com) — the social book
& film tracking app. Standalone Next.js 15 app, deployed separately from the
mobile app / API monorepo (mirrors how the marketing site is split out).

## Architecture

- **Framework:** Next.js 15 (App Router, React 19, server components + server actions).
- **Data access:** the admin talks to **Supabase directly using the `service_role`
  key, server-side only** (`app/lib/supabase/admin.ts`, guarded by `server-only`).
  This bypasses RLS — appropriate for an admin tool, and the key never reaches the
  browser. Actions with existing business logic (payout runs, billing-provider
  switch) call the Hono API (`apps/api`) instead.
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
| `API_URL` | Hono API for payout/billing actions |

### Granting admin access

There is no self-serve promotion. Grant it once with a service-role update:

```sql
update public.profiles set is_admin = true where username = '<you>';
```

## Modules

Shipped (Phase 1): **Dashboard**, **Users**, **Contact inbox**.
Everything else is stubbed as "soon" in the sidebar — see [ROADMAP.md](./ROADMAP.md).

## Deploy

Coolify, `output: 'standalone'`. Build with the `NEXT_PUBLIC_*` build args; supply
`SUPABASE_SERVICE_ROLE_KEY` and `API_URL` as runtime env. Listens on `:3003`.
