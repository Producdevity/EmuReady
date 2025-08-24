import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const DeviceSortField = z.enum(['brand', 'modelName', 'soc', 'listings'])

export const GetDevicesSchema = z
  .object({
    search: z.string().nullable().optional(),
    brandId: z.string().uuid().nullable().optional(),
    socId: z.string().uuid().nullable().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: DeviceSortField.nullable().optional(),
    sortDirection: SortDirection.nullable().optional(),
  })
  .optional()

export const GetDeviceByIdSchema = z.object({ id: z.string().uuid() })

export const CreateDeviceSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
  socId: z.string().uuid().nullable().optional(),
})

export const UpdateDeviceSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
  socId: z.string().uuid().nullable().optional(),
})

export const DeleteDeviceSchema = z.object({ id: z.string().uuid() })

// Type exports for repository use
export type GetDevicesInput = z.input<typeof GetDevicesSchema>
export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>
