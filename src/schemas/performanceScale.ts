import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const PerformanceScaleSortField = z.enum(['label', 'rank'])

export const GetPerformanceScalesSchema = z
  .object({
    search: z.string().optional(),
    sortField: PerformanceScaleSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetPerformanceScaleByIdSchema = z.object({ id: z.number() })

export const CreatePerformanceScaleSchema = z.object({
  label: z.string().min(1),
  rank: z.number(),
  description: z.string().optional(),
})

export const UpdatePerformanceScaleSchema = z.object({
  id: z.number(),
  label: z.string().min(1),
  rank: z.number(),
  description: z.string().optional(),
})

export const DeletePerformanceScaleSchema = z.object({ id: z.number() })

// Type exports for repository use
export type GetPerformanceScalesInput = z.input<typeof GetPerformanceScalesSchema>
export type CreatePerformanceScaleInput = z.infer<typeof CreatePerformanceScaleSchema>
export type UpdatePerformanceScaleInput = z.infer<typeof UpdatePerformanceScaleSchema>
