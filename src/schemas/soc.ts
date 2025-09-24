import { z } from 'zod'

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
  architecture: z.enum(['ARM64', 'x86_64']).optional(),
  processNode: z.string().max(10).optional(),
  cpuCores: z.number().int().positive().max(64).optional(),
  gpuModel: z.string().max(255).optional(),
})

export const UpdateSoCSchema = CreateSoCSchema.extend({ id: z.string().uuid() })

export const DeleteSoCSchema = z.object({
  id: z.string().uuid(),
})

export const GetSoCsByIdsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })

// Type exports for repository use
export type GetSoCsInput = z.input<typeof GetSoCsSchema>
export type CreateSoCInput = z.infer<typeof CreateSoCSchema>
export type UpdateSoCInput = z.infer<typeof UpdateSoCSchema>
