import { z } from 'zod'
import { ApprovalStatus } from '@orm'

export const ReportApprovalResultSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ApprovalStatus),
  processedAt: z.date().nullable(),
})

export const HandheldBulkApprovalResultSchema = z.object({
  success: z.boolean(),
  approvedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  message: z.string(),
  hasReportedUsers: z.boolean(),
})

export const HandheldBulkRejectionResultSchema = HandheldBulkApprovalResultSchema.omit({
  approvedCount: true,
  hasReportedUsers: true,
})
export const PcBulkApprovalResultSchema = z.object({ count: z.number().int().nonnegative() })
