import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const DeviceSortField = z.enum(['brand', 'modelName', 'soc', 'listings'])

export const GetDevicesSchema = z
  .object({
    search: z.string().optional(),
    brandId: z.string().uuid().optional(),
    socId: z.string().uuid().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: DeviceSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetDeviceByIdSchema = z.object({ id: z.string().uuid() })

export const CreateDeviceSchema = z.object({
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
  socId: z.string().uuid().optional(),
})

export const UpdateDeviceSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  modelName: z.string().min(1),
  socId: z.string().uuid().optional(),
})

export const DeleteDeviceSchema = z.object({ id: z.string().uuid() })
