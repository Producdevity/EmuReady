import { z } from 'zod'

export const SystemSortField = z.enum(['name', 'key', 'gamesCount'])
export const SortDirection = z.enum(['asc', 'desc'])

export const GetSystemsSchema = z
  .object({
    search: z.string().nullable().optional(),
    sortField: SystemSortField.nullable().optional(),
    sortDirection: SortDirection.nullable().optional(),
  })
  .optional()

export const GetSystemByIdSchema = z.object({ id: z.string().uuid() })

export const CreateSystemSchema = z.object({
  name: z.string().min(1),
  key: z.string().nullable().optional(),
})

export const UpdateSystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  key: z.string().nullable().optional(),
})

export const DeleteSystemSchema = z.object({ id: z.string().uuid() })

// Type exports for repository use
export type GetSystemsInput = z.input<typeof GetSystemsSchema>
export type CreateSystemInput = z.infer<typeof CreateSystemSchema>
export type UpdateSystemInput = z.infer<typeof UpdateSystemSchema>
