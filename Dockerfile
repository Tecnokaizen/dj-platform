# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.23.2

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
ENV DATABASE_URL=postgresql://build-only:build-only@127.0.0.1:5432/build-only
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV DATABASE_URL=postgresql://build-only:build-only@127.0.0.1:5432/build-only
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

FROM deps AS migrator
ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH
COPY . .
RUN test "$(npx supabase --version)" = "2.109.1"
CMD ["sh", "scripts/deploy/migrate-release.sh"]
