import { z } from 'zod'
import { SortDirection } from '@/schemas/soc'
import { ReportReason, ReportStatus } from '@orm'

export const ReportReasonSchema = z.nativeEnum(ReportReason)
export const ReportStatusSchema = z.nativeEnum(ReportStatus)

export const ListingReportSortField = z.enum(['createdAt', 'updatedAt', 'status', 'reason'])

export const CreateListingReportSchema = z.object({
  listingId: z.string().uuid(),
  reason: ReportReasonSchema,
  description: z.string().optional(),
})

export const UpdateReportStatusSchema = z.object({
  id: z.string().uuid(),
  status: ReportStatusSchema,
  reviewNotes: z.string().optional(),
})

export const GetListingReportsSchema = z
  .object({
    search: z.string().optional(),
    status: ReportStatusSchema.optional(),
    reason: ReportReasonSchema.optional(),
    sortField: ListingReportSortField.optional(),
    sortDirection: SortDirection.optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional()

export const GetReportByIdSchema = z.object({
  id: z.string().uuid(),
})

export const DeleteReportSchema = z.object({
  id: z.string().uuid(),
})

export const GetUserReportStatsSchema = z.object({
  userId: z.string().uuid(),
})

export type ReportReasonType = ReportReason
export type ReportStatusType = ReportStatus
