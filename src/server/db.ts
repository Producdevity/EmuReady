import { PrismaClient } from '@orm'

/**
 * Global instance of PrismaClient to prevent multiple instances
 *
 * NOTE: Prisma automatically uses DATABASE_DIRECT_URL (from schema.prisma) for:
 * - Interactive transactions
 * - Migrations
 *
 * Add connection_limit=1 to your DATABASE_URL in production env vars. I didn't do this and it's not fun.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : process.env.PRISMA_DEBUG === 'true'
          ? ['query', 'error', 'warn']
          : ['error'],
    transactionOptions: {
      timeout: 10000, // 10 seconds instead of default 5 seconds
    },
  })

// Store in global only in development for hot-reload support
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
