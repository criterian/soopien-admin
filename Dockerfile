# ── Soopien Admin (Next.js standalone) — Coolify deploy ──
# Standalone repo. Build context = repo root.
FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are inlined at build time; the service-role key is runtime-only.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
# Provided at runtime (never baked into the image):
#   SUPABASE_SERVICE_ROLE_KEY, API_URL
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3003
ENV PORT=3003
# Docker sets HOSTNAME to the container id; Next's standalone server would bind to
# that instead of all interfaces, so the proxy couldn't reach it (502). Force it.
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
