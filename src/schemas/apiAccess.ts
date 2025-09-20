import { z } from 'zod'
import { ApiUsagePeriod } from '@orm'

const quotaValueSchema = z.number().int().positive().max(1_000_000_000)
const quotaSchema = quotaValueSchema.or(z.literal(0)).or(z.null())

export const ApiKeySortFieldSchema = z.enum(['name', 'createdAt', 'lastUsedAt', 'monthlyQuota'])
export const SortDirectionSchema = z.enum(['asc', 'desc'])

export const CreateApiKeySchema = z.object({
  name: z.string({ description: 'Friendly label for the key' }).trim().min(1).max(100).optional(),
  monthlyQuota: quotaSchema.optional(),
  weeklyQuota: quotaSchema.optional(),
  burstQuota: quotaSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  isSystemKey: z.boolean().optional(),
})

export const DeveloperCreateApiKeySchema = CreateApiKeySchema.omit({
  userId: true,
  isSystemKey: true,
})

export const AdminCreateApiKeySchema = CreateApiKeySchema.extend({
  userId: z.string().uuid(),
})

export const RotateApiKeySchema = z.object({
  id: z.string().uuid(),
})

export const RevokeApiKeySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(200).optional(),
})

export const UpdateApiKeyQuotaSchema = z.object({
  id: z.string().uuid(),
  monthlyQuota: quotaSchema.optional(),
  weeklyQuota: quotaSchema.optional(),
  burstQuota: quotaSchema.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

export const ListApiKeysSchema = z.object({
  search: z.string().trim().max(200).optional(),
  userId: z.string().uuid().optional(),
  includeRevoked: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional(),
  page: z.number().int().positive().optional(),
  sortField: ApiKeySortFieldSchema.optional(),
  sortDirection: SortDirectionSchema.optional(),
})

export const DeveloperListApiKeysSchema = ListApiKeysSchema.omit({ userId: true })

export const GetApiKeyUsageSchema = z.object({
  id: z.string().uuid(),
  period: z.nativeEnum(ApiUsagePeriod),
  limit: z.number().int().positive().max(90).default(30),
})

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>
export type DeveloperCreateApiKeyInput = z.infer<typeof DeveloperCreateApiKeySchema>
export type AdminCreateApiKeyInput = z.infer<typeof AdminCreateApiKeySchema>
export type RotateApiKeyInput = z.infer<typeof RotateApiKeySchema>
export type RevokeApiKeyInput = z.infer<typeof RevokeApiKeySchema>
export type UpdateApiKeyQuotaInput = z.infer<typeof UpdateApiKeyQuotaSchema>
export type ListApiKeysInput = z.infer<typeof ListApiKeysSchema>
export type DeveloperListApiKeysInput = z.infer<typeof DeveloperListApiKeysSchema>
export type GetApiKeyUsageInput = z.infer<typeof GetApiKeyUsageSchema>
export type ApiKeySortField = z.infer<typeof ApiKeySortFieldSchema>
