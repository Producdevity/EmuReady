import { z } from 'zod'
import { SortDirectionSchema } from '@/schemas/common'

export const GpuSortField = z.enum(['brand', 'modelName', 'pcListings'])

export const GetGpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GpuSortField.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .optional()

export const GetGpuOptionsSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(10000).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .optional()

export const GetGpuByIdSchema = z.object({ id: z.string().uuid() })
export const GetGpusByIdsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })

export const CreateGpuSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
})

export const UpdateGpuSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
})

export const DeleteGpuSchema = z.object({ id: z.string().uuid() })

export type GetGpusInput = z.input<typeof GetGpusSchema>
export type GetGpuOptionsInput = z.input<typeof GetGpuOptionsSchema>
export type CreateGpuInput = z.infer<typeof CreateGpuSchema>
export type UpdateGpuInput = z.infer<typeof UpdateGpuSchema>
export type GetGpusByIdsInput = z.infer<typeof GetGpusByIdsSchema>
