import { z } from 'zod'
import { SignedInt32Schema, SortDirectionSchema } from '@/schemas/common'

export const PerformanceScaleSortField = z.enum(['label', 'rank'])

export const GetPerformanceScalesSchema = z
  .object({
    search: z.string().optional(),
    sortField: PerformanceScaleSortField.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .optional()

export const GetPerformanceScaleByIdSchema = z.object({ id: SignedInt32Schema })

export const CreatePerformanceScaleSchema = z.object({
  label: z.string().min(1),
  rank: SignedInt32Schema,
  description: z.string().optional(),
})

export const UpdatePerformanceScaleSchema = z.object({
  id: SignedInt32Schema,
  label: z.string().min(1),
  rank: SignedInt32Schema,
  description: z.string().optional(),
})

export const DeletePerformanceScaleSchema = z
  .object({
    id: SignedInt32Schema,
    replacementId: SignedInt32Schema.optional(),
  })
  .refine((data) => data.replacementId === undefined || data.replacementId !== data.id, {
    message: 'Replacement performance scale must be different from the deleted scale',
    path: ['replacementId'],
  })

export type GetPerformanceScalesInput = z.input<typeof GetPerformanceScalesSchema>
export type CreatePerformanceScaleInput = z.infer<typeof CreatePerformanceScaleSchema>
export type UpdatePerformanceScaleInput = z.infer<typeof UpdatePerformanceScaleSchema>
