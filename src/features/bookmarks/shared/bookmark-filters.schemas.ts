import { z } from 'zod'
import { SortDirectionSchema } from '@/schemas/common'

const ids = z.array(z.string().uuid()).max(50).default([])
export const BookmarkSortFieldSchema = z.enum(['savedAt', 'title', 'performance', 'successRate'])
export const BookmarkFiltersSchema = z.object({
  systemIds: ids,
  emulatorIds: ids,
  deviceIds: ids,
  socIds: ids,
  cpuIds: ids,
  gpuIds: ids,
  memoryMin: z.number().int().positive().nullable().default(null),
  memoryMax: z.number().int().positive().nullable().default(null),
  performanceIds: z.array(z.number().int().positive()).max(50).default([]),
  sortField: BookmarkSortFieldSchema.default('savedAt'),
  sortDirection: SortDirectionSchema.default('desc'),
})
