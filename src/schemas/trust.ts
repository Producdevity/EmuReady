import { z } from 'zod'
import { TrustAction } from '@orm'

export const GetTrustLogsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortField: z.enum(['createdAt', 'action', 'weight']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  search: z.string().min(1).optional(),
  action: z.nativeEnum(TrustAction).optional(),
})

export const GetTrustStatsSchema = z.object({})

export const RunMonthlyActiveBonusSchema = z.object({})

export type GetTrustLogsInput = z.infer<typeof GetTrustLogsSchema>
export type GetTrustStatsInput = z.infer<typeof GetTrustStatsSchema>
export type RunMonthlyActiveBonusInput = z.infer<
  typeof RunMonthlyActiveBonusSchema
>
