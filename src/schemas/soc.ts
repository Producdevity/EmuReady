import { z } from 'zod'

export const SoCBasicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  manufacturer: z.string(),
  architecture: z.string().nullable(),
  processNode: z.string().nullable(),
  cpuCores: z.number().int().nullable(),
  gpuModel: z.string().nullable(),
  createdAt: z.date(),
})

export const SoCSortField = z.enum(['name', 'manufacturer', 'devicesCount'])
export const SortDirection = z.enum(['asc', 'desc'])

export const GetSoCsSchema = z
  .object({
    search: z.string().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: SoCSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetSoCByIdSchema = z.object({
  id: z.string().uuid(),
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
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  manufacturer: z.string().min(1).max(255),
  architecture: z.string().max(50).optional(),
  processNode: z.string().max(20).optional(),
  cpuCores: z.number().int().positive().max(64).optional(),
  gpuModel: z.string().max(255).optional(),
})

export const DeleteSoCSchema = z.object({
  id: z.string().uuid(),
})

export const GetSoCsByIdsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })

// Type exports for repository use
export type GetSoCsInput = z.input<typeof GetSoCsSchema>
export type CreateSoCInput = z.infer<typeof CreateSoCSchema>
export type UpdateSoCInput = z.infer<typeof UpdateSoCSchema>
