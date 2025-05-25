import type { Prisma } from '@orm'

// Basic performance scale selection
export const performanceBasicSelect = {
  id: true,
  label: true,
  rank: true,
  description: true,
} satisfies Prisma.PerformanceScaleSelect
