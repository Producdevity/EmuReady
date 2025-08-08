import { z } from 'zod'
import { TrustAction } from '@orm'

export const GetTrustLogsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortField: z
    .enum(['createdAt', 'action', 'weight', 'user.trustScore'])
    .optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  search: z.string().min(1).optional(),
  action: z.nativeEnum(TrustAction).optional(),
})

export const GetTrustStatsSchema = z.object({})

export const RunMonthlyActiveBonusSchema = z.object({})

export const ManualTrustAdjustmentSchema = z.object({
  userId: z.string().uuid(),
  adjustment: z.number().int().min(-1000).max(1000),
  reason: z.string().min(1).max(500),
})

export const GetUserTrustInfoSchema = z.object({
  userId: z.string().uuid(),
})
