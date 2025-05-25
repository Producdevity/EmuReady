import type { Prisma } from '@orm'
import { userPublicSelect } from '../users/fragments'
import { deviceBasicSelect } from '../devices/fragments'
import { gameBasicSelect } from '../games/fragments'
import { emulatorBasicSelect } from '../emulators/fragments'
import { performanceBasicSelect } from '../performance/fragments'

// Basic listing include for most queries
export const listingBasicInclude = {
  game: {
    include: {
      system: true,
    },
  },
  device: {
    include: {
      brand: true,
    },
  },
  emulator: true,
  performance: true,
  author: {
    select: userPublicSelect,
  },
  _count: {
    select: {
      votes: true,
      comments: true,
    },
  },
} satisfies Prisma.ListingInclude

// Detailed listing include with comments
export const listingDetailedInclude = {
  ...listingBasicInclude,
  comments: {
    where: {
      parentId: null,
      deletedAt: null,
    },
    include: {
      user: {
        select: userPublicSelect,
      },
      replies: {
        where: {
          deletedAt: null,
        },
        include: {
          user: {
            select: userPublicSelect,
          },
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} satisfies Prisma.ListingInclude

// User listings fragment (for profile pages)
export const userListingsSelect = {
  id: true,
  createdAt: true,
  status: true,
  device: {
    select: deviceBasicSelect,
  },
  game: {
    select: gameBasicSelect,
  },
  emulator: {
    select: emulatorBasicSelect,
  },
  performance: {
    select: performanceBasicSelect,
  },
} satisfies Prisma.ListingSelect
