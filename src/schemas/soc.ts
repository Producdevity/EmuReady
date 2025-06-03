import { z } from 'zod'

export const SoCBasicSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  architecture: z.string().nullable(),
  processNode: z.string().nullable(),
  cpuCores: z.number().int().nullable(),
  gpuModel: z.string().nullable(),
  createdAt: z.date(),
})

export const SoCWithDevicesCountSchema = SoCBasicSchema.extend({
  _count: z.object({
    devices: z.number(),
  }),
})

export const SoCSortField = z.enum(['name', 'manufacturer', 'devicesCount'])
export const SortDirection = z.enum(['asc', 'desc'])

export const GetSoCsSchema = z
  .object({
    search: z.string().optional(),
    manufacturer: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    sortField: SoCSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetSoCByIdSchema = z.object({
  id: z.string(),
})

export const CreateSoCSchema = z.object({
  name: z.string().min(1).max(255),
  manufacturer: z.string().min(1).max(255),
  architecture: z.string().max(50).optional(),
  processNode: z.string().max(20).optional(),
  cpuCores: z.number().int().positive().max(64).optional(),
  gpuModel: z.string().max(255).optional(),
})

export const UpdateSoCSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  manufacturer: z.string().min(1).max(255),
  architecture: z.string().max(50).optional(),
  processNode: z.string().max(20).optional(),
  cpuCores: z.number().int().positive().max(64).optional(),
  gpuModel: z.string().max(255).optional(),
})

export const DeleteSoCSchema = z.object({
  id: z.string(),
})

export type SoCBasic = z.infer<typeof SoCBasicSchema>
export type SoCWithDevicesCount = z.infer<typeof SoCWithDevicesCountSchema>
export type GetSoCs = z.infer<typeof GetSoCsSchema>
export type GetSoCById = z.infer<typeof GetSoCByIdSchema>
export type CreateSoC = z.infer<typeof CreateSoCSchema>
export type UpdateSoC = z.infer<typeof UpdateSoCSchema>
export type DeleteSoC = z.infer<typeof DeleteSoCSchema>
