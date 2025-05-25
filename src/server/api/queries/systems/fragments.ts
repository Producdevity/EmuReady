import type { Prisma } from '@orm'

// System with games and counts
export const systemWithGamesInclude = {
  games: {
    orderBy: {
      title: 'asc' as const,
    },
  },
  _count: {
    select: {
      games: true,
    },
  },
} satisfies Prisma.SystemInclude

// System with counts only
export const systemWithCountsInclude = {
  _count: {
    select: {
      games: true,
    },
  },
} satisfies Prisma.SystemInclude
