import { getOptimizedDatabaseUrl } from '@/server/utils/query-performance'
import { PrismaClient } from '@orm'

/**
 * Global instance of PrismaClient to prevent multiple instances in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // In production, create a new client with optimized connection pool settings
  prisma = new PrismaClient({
    log: ['error'],
    datasources: { db: { url: getOptimizedDatabaseUrl() } },
  })
} else {
  // In development, reuse the client across hot reloads with minimal logging
  globalForPrisma.prisma ??= new PrismaClient({
    // Only log errors in development to improve performance
    // Set PRISMA_DEBUG=true to enable query logging for debugging
    log: process.env.PRISMA_DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error'],
    datasources: { db: { url: getOptimizedDatabaseUrl() } },
  })
  prisma = globalForPrisma.prisma
}

export { prisma }
