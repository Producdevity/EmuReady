import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const GpuSortField = z.enum(['brand', 'modelName'])

export const GetGpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GpuSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetGpuByIdSchema = z.object({ id: z.string().uuid() })

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
