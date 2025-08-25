import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'

export const EmulatorSortField = z.enum(['name', 'systemCount', 'listingCount'])

export const GetEmulatorsSchema = z
  .object({
    search: z.string().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: EmulatorSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetEmulatorByIdSchema = z.object({ id: z.string().uuid() })

export const GetVerifiedDevelopersForEmulatorSchema = z.object({
  emulatorId: z.string().uuid(),
})

export const CreateEmulatorSchema = z.object({
  name: z.string().min(1),
  logo: z.string().optional(),
  description: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
  officialUrl: z.string().url().optional(),
})

export const UpdateEmulatorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  logo: z.string().optional(),
  description: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
  officialUrl: z.string().url().optional(),
})

export const DeleteEmulatorSchema = z.object({ id: z.string().uuid() })

export const UpdateSupportedSystemsSchema = z.object({
  emulatorId: z.string().uuid(),
  systemIds: z.array(z.string().uuid()),
})

// Type exports for repository use
export type GetEmulatorsInput = z.input<typeof GetEmulatorsSchema>
export type CreateEmulatorInput = z.infer<typeof CreateEmulatorSchema>
export type UpdateEmulatorInput = z.infer<typeof UpdateEmulatorSchema>
export type UpdateSupportedSystemsInput = z.infer<typeof UpdateSupportedSystemsSchema>
