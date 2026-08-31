import { z } from 'zod'
import { SortDirectionSchema } from '@/schemas/common'

export const DeviceBrandSortField = z.enum(['name', 'devicesCount'])
export const DeviceBrandCategory = z.enum(['cpu', 'gpu'])

export const GetDeviceBrandsSchema = z
  .object({
    search: z.string().optional(),
    category: DeviceBrandCategory.optional(),
    limit: z.number().default(50),
    sortField: DeviceBrandSortField.optional(),
    sortDirection: SortDirectionSchema.optional(),
  })
  .optional()

export const GetDeviceBrandByIdSchema = z.object({
  id: z.string().uuid(),
})

export const CreateDeviceBrandSchema = z.object({ name: z.string().min(1) })

export const UpdateDeviceBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
})

export const DeleteDeviceBrandSchema = z.object({ id: z.string().uuid() })

export type GetDeviceBrandsInput = z.input<typeof GetDeviceBrandsSchema>
export type CreateDeviceBrandInput = z.infer<typeof CreateDeviceBrandSchema>
export type UpdateDeviceBrandInput = z.infer<typeof UpdateDeviceBrandSchema>
