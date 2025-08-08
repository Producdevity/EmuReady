FROM node:22.17-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies and generate Prisma client for Alpine Linux
RUN npm ci --omit=dev --prefer-offline --no-audit --ignore-scripts && \
    npx prisma generate && \
    npm cache clean --force

# Development stage
FROM base AS dev

# Install all dependencies including devDependencies for development
RUN npm ci --prefer-offline --no-audit --ignore-scripts

COPY . .

# Ensure Prisma client is generated for the current environment
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Build stage for production
FROM base AS builder

# Install all dependencies for building
RUN npm ci --prefer-offline --no-audit --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client for building
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Sometimes things are just slow, you know?
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma/ ./prisma/

# Install only production dependencies and generate Prisma client
RUN npm ci --omit=dev --prefer-offline --no-audit --ignore-scripts && \
    npx prisma generate && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
