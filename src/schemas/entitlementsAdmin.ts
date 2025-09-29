import { z } from 'zod'
import { EntitlementSource, EntitlementStatus } from '@orm'

export const ListEntitlementsByUserSchema = z.object({
  userId: z.string().uuid(),
})

export type ListEntitlementsByUserInput = z.infer<typeof ListEntitlementsByUserSchema>

export const EntitlementSourceEnum = z.nativeEnum(EntitlementSource)
export const EntitlementStatusEnum = z.nativeEnum(EntitlementStatus)

export const ListEntitlementsSchema = z.object({
  search: z.string().trim().max(200).optional(), // matches user email/name or referenceId
  source: EntitlementSourceEnum.optional(),
  status: EntitlementStatusEnum.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortField: z
    .enum(['grantedAt', 'revokedAt', 'source', 'status', 'userEmail', 'userName'])
    .optional()
    .default('grantedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type ListEntitlementsInput = z.infer<typeof ListEntitlementsSchema>

export const EntitlementsStatsSchema = z.object({})
export type EntitlementsStatsInput = z.infer<typeof EntitlementsStatsSchema>
