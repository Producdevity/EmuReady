import type { Prisma } from '@orm'

// Basic device selection with brand info
export const deviceBasicSelect = {
  id: true,
  modelName: true,
  brand: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.DeviceSelect

// Device include with brand
export const deviceWithBrandInclude = {
  brand: true,
} satisfies Prisma.DeviceInclude
