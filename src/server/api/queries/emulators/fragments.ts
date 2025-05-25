import type { Prisma } from '@orm'

// Basic emulator selection
export const emulatorBasicSelect = {
  id: true,
  name: true,
} satisfies Prisma.EmulatorSelect

// Emulator with detailed information
export const emulatorDetailedInclude = {
  systems: true,
  customFieldDefinitions: {
    orderBy: {
      displayOrder: 'asc' as const,
    },
  },
  _count: {
    select: {
      listings: true,
    },
  },
} satisfies Prisma.EmulatorInclude

// Emulator with listings count only
export const emulatorWithCountsInclude = {
  _count: {
    select: {
      listings: true,
    },
  },
} satisfies Prisma.EmulatorInclude
