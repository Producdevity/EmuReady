import type { Prisma } from '@orm'

// Basic game selection
export const gameBasicSelect = {
  id: true,
  title: true,
  imageUrl: true,
} satisfies Prisma.GameSelect

// Game with system information
export const gameWithSystemSelect = {
  ...gameBasicSelect,
  system: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.GameSelect

// Game with listings count
export const gameWithCountsSelect = {
  ...gameWithSystemSelect,
  _count: {
    select: {
      listings: true,
    },
  },
} satisfies Prisma.GameSelect
