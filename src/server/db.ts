import { normalizeString } from '@/utils/text'
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

const basePrisma =
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

/**
 * Extended Prisma Client with auto-population middleware
 * Automatically normalizes game titles for accent-insensitive search
 */
const extendedClient = basePrisma.$extends({
  query: {
    game: {
      async create({ args, query }) {
        if (args.data.title) {
          args.data.normalizedTitle = normalizeString(args.data.title)
        }
        return query(args)
      },
      async update({ args, query }) {
        if (args.data.title) {
          args.data.normalizedTitle = normalizeString(args.data.title as string)
        }
        return query(args)
      },
      async createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            normalizedTitle: item.title ? normalizeString(item.title) : item.normalizedTitle,
          }))
        } else if (args.data.title) {
          args.data.normalizedTitle = normalizeString(args.data.title)
        }
        return query(args)
      },
      async updateMany({ args, query }) {
        if (args.data.title) {
          args.data.normalizedTitle = normalizeString(args.data.title as string)
        }
        return query(args)
      },
    },
  },
})

export const prisma = extendedClient as unknown as PrismaClient
export type ExtendedPrismaClient = typeof extendedClient

// Store in global only in development for hot-reload support
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma
}
