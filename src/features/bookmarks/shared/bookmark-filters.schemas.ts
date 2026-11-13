import { z } from 'zod'
import { SignedInt32Schema, SortDirectionSchema } from '@/schemas/common'

const ids = z.array(z.string().uuid()).max(50).default([])
export const BookmarkSortFieldSchema = z.enum(['savedAt', 'title', 'performance', 'successRate'])
export const BookmarkFiltersSchema = z.object({
  systemIds: ids,
  emulatorIds: ids,
  deviceIds: ids,
  socIds: ids,
  cpuIds: ids,
  gpuIds: ids,
  memoryMin: SignedInt32Schema.positive().nullable().default(null),
  memoryMax: SignedInt32Schema.positive().nullable().default(null),
  performanceIds: z.array(SignedInt32Schema.positive()).max(50).default([]),
  sortField: BookmarkSortFieldSchema.default('savedAt'),
  sortDirection: SortDirectionSchema.default('desc'),
})

export function refineBookmarkMemoryRange(
  input: Pick<z.output<typeof BookmarkFiltersSchema>, 'memoryMin' | 'memoryMax'>,
  context: z.RefinementCtx,
) {
  if (input.memoryMin !== null && input.memoryMax !== null && input.memoryMin > input.memoryMax) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['memoryMax'],
      message: 'Maximum memory must be at least minimum memory.',
    })
  }
}
