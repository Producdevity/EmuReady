FROM node:22.17-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable pnpm && corepack prepare pnpm@11.1.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma/ ./prisma/

# Install production dependencies for runtime layers.
RUN pnpm install --prod --frozen-lockfile --prefer-offline --ignore-scripts

# Development stage
FROM base AS dev

# Install all dependencies including devDependencies for development
RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

COPY . .

# Ensure Prisma client is generated for the current environment
RUN pnpm exec prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]

# Build stage for production
FROM base AS builder

# Install all dependencies for building
RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client for building
RUN pnpm exec prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM base AS production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma/generated ./prisma/generated

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start production server
CMD ["pnpm", "start"]
