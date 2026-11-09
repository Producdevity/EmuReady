import { createPrismaClient } from '@/server/prisma-client'
import { normalizeString } from '@/utils/text'
import type { PrismaClient } from '@orm/client'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

const basePrisma =
  globalForPrisma.prisma ??
  createPrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : process.env.PRISMA_DEBUG === 'true'
          ? ['query', 'error', 'warn']
          : ['error'],
    transactionOptions: {
      timeout: 10000,
    },
  })

// Production server bundles can evaluate this module independently in the same process.
globalForPrisma.prisma = basePrisma

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
