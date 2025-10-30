import { PrismaClient } from '@orm'

/**
 * Global instance of PrismaClient to prevent multiple instances in development
 *
 * NOTE: We do NOT override datasources here to allow Prisma to use both:
 * - DATABASE_URL (for regular queries via pgBouncer)
 * - DATABASE_DIRECT_URL (for transactions and migrations via direct connection)
 *
 * Add connection_limit=1 directly to DATABASE_URL in production env vars.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // In production, create a new client
  prisma = new PrismaClient({
    log: ['error'],
    transactionOptions: {
      timeout: 10000, // 10 seconds instead of 5
    },
  })
} else {
  // In development, reuse the client across hot reloads with minimal logging
  globalForPrisma.prisma ??= new PrismaClient({
    // Only log errors in development to improve performance
    // Set PRISMA_DEBUG=true to enable query logging for debugging
    log: process.env.PRISMA_DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error'],
  })
  prisma = globalForPrisma.prisma
}

export { prisma }
