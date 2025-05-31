import { z } from 'zod'

export const DeviceBrandSortField = z.enum(['name', 'devicesCount'])
export const SortDirection = z.enum(['asc', 'desc'])

export const GetDeviceBrandsSchema = z
  .object({
    search: z.string().optional(),
    limit: z.number().default(50),
    sortField: DeviceBrandSortField.optional(),
    sortDirection: SortDirection.optional(),
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
