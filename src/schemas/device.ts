import { z } from 'zod'
import { HOME_PAGE_LIMITS } from '@/data/constants'
import { SortDirectionSchema } from '@/schemas/common'

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
    sortDirection: SortDirectionSchema.nullable().optional(),
  })
  .optional()

export const GetDeviceOptionsSchema = z
  .object({
    search: z.string().nullable().optional(),
    brandId: z.string().uuid().nullable().optional(),
    socId: z.string().uuid().nullable().optional(),
    limit: z.number().int().min(1).max(10000).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .optional()

export const GetDeviceByIdSchema = z.object({ id: z.string().uuid() })
export const GetDevicesByIdsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })

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

export const GetTrendingDevicesSummarySchema = z.object({
  limit: z.number().int().min(1).max(20).default(HOME_PAGE_LIMITS.TRENDING_DEVICES),
})

export type GetDevicesInput = z.input<typeof GetDevicesSchema>
export type GetDeviceOptionsInput = z.input<typeof GetDeviceOptionsSchema>
export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>
export type GetDevicesByIdsInput = z.infer<typeof GetDevicesByIdsSchema>
