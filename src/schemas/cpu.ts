import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const CpuSortField = z.enum(['brand', 'modelName'])

export const GetCpusSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: CpuSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetCpuByIdSchema = z.object({ id: z.string().uuid() })

export const CreateCpuSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
})

export const UpdateCpuSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
})

export const DeleteCpuSchema = z.object({ id: z.string().uuid() })
