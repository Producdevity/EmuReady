import { z } from 'zod'

export const TimeRangeSchema = z.enum(['24h', '48h', '7d'])
export type TimeRange = z.infer<typeof TimeRangeSchema>

export const ActivityQuerySchema = z.object({
  timeRange: TimeRangeSchema,
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of items to return'),
})
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>

export const DashboardQuerySchema = z.object({
  usersTimeRange: TimeRangeSchema.optional().default('24h').describe('Time range for recent users'),
  listingsTimeRange: TimeRangeSchema.optional()
    .default('24h')
    .describe('Time range for recent listings'),
  commentsTimeRange: TimeRangeSchema.optional()
    .default('24h')
    .describe('Time range for recent comments'),
  reportsTimeRange: TimeRangeSchema.optional()
    .default('24h')
    .describe('Time range for recent reports'),
  bansTimeRange: TimeRangeSchema.optional().default('24h').describe('Time range for recent bans'),
  statsTimeRange: TimeRangeSchema.optional()
    .default('24h')
    .describe('Time range for platform stats'),
})
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>
