import { PrismaClient } from '@orm'

/**
 * Global instance of PrismaClient to prevent multiple instances in development
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // In production, create a new client
  prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
} else {
  // In development, reuse the client across hot reloads
  globalForPrisma.prisma ??= new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  prisma = globalForPrisma.prisma
}

export { prisma }
