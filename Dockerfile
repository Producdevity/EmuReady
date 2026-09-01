# syntax=docker/dockerfile:1

# glibc base — the repo pins linux-x64-gnu native binaries (sharp, rollup,
# tailwindcss/oxide, lightningcss) that do not resolve on Alpine/musl.
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Pin pnpm to match package.json#packageManager (pnpm@11.5.2).
RUN corepack prepare pnpm@11.5.2 --activate

# Development: retained for docker-compose.yml and scripts/docker-dev.sh.
FROM base AS dev
ARG DATABASE_URL=postgresql://docker-build.invalid/emuready
ARG DATABASE_DIRECT_URL
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN DATABASE_URL="${DATABASE_URL}" DATABASE_DIRECT_URL="${DATABASE_DIRECT_URL:-${DATABASE_URL}}" \
    pnpm exec prisma generate
EXPOSE 3000
CMD ["pnpm", "dev"]

# The build database must be migrated and disposable. Prisma TypedSQL inspects it.
FROM base AS builder
ARG DATABASE_URL
ARG DATABASE_DIRECT_URL
ARG NEXT_IMAGE_UNOPTIMIZED
ARG NEXT_PUBLIC_ALLOWED_ORIGINS
ARG NEXT_PUBLIC_ANDROID_LATEST_APK_URL
ARG NEXT_PUBLIC_ANDROID_LATEST_JSON_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_DISABLE_COOKIE_BANNER
ARG NEXT_PUBLIC_DISCORD_LINK
ARG NEXT_PUBLIC_EMUREADY_BETA_URL
ARG NEXT_PUBLIC_EMUREADY_EMAIL
ARG NEXT_PUBLIC_EMUREADY_LITE_GITHUB_URL
ARG NEXT_PUBLIC_ENABLE_ANALYTICS
ARG NEXT_PUBLIC_ENABLE_ANDROID_DOWNLOADS
ARG NEXT_PUBLIC_ENABLE_KOFI_WIDGET
ARG NEXT_PUBLIC_ENABLE_PATREON_VERIFICATION
ARG NEXT_PUBLIC_ENABLE_SENTRY
ARG NEXT_PUBLIC_ENABLE_SW
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_GITHUB_URL
ARG NEXT_PUBLIC_IGDB_CLIENT_ID
ARG NEXT_PUBLIC_KOFI_LINK
ARG NEXT_PUBLIC_LOCAL_STORAGE_PREFIX
ARG NEXT_PUBLIC_PATREON_LINK
ARG NEXT_PUBLIC_R2_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_R2_UPLOADS_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_TWITTER_URL
ARG NEXT_BUILD_ID
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm version:sync
RUN DATABASE_URL="${DATABASE_URL}" DATABASE_DIRECT_URL="${DATABASE_DIRECT_URL:-${DATABASE_URL}}" \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \
    NEXT_PUBLIC_R2_PUBLIC_BASE_URL="${NEXT_PUBLIC_R2_PUBLIC_BASE_URL}" \
    NEXT_PUBLIC_R2_UPLOADS_PUBLIC_BASE_URL="${NEXT_PUBLIC_R2_UPLOADS_PUBLIC_BASE_URL}" \
    NEXT_IMAGE_UNOPTIMIZED="${NEXT_IMAGE_UNOPTIMIZED}" \
    NEXT_BUILD_ID="${NEXT_BUILD_ID}" \
    pnpm build

# One-shot migration image. DATABASE_DIRECT_URL is supplied at runtime.
FROM base AS migrator
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY prisma.config.ts ./
COPY prisma ./prisma
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# Standalone Next.js runtime.
FROM ${NODE_IMAGE} AS app
ARG NEXT_BUILD_ID
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    APP_VERSION=${NEXT_BUILD_ID} \
    NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid 1001 --create-home nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/docs/MOBILE_API.md ./docs/MOBILE_API.md
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
