import { z } from 'zod'
import { PaginationResultSchema } from '@/schemas/pagination'
import { ApprovalStatus } from '@orm'

export const ReportHistoryKindSchema = z.enum(['handheld', 'pc'])

export const GetReportHistorySchema = z.object({
  kind: ReportHistoryKindSchema.default('handheld'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).default(''),
  status: z.nativeEnum(ApprovalStatus).optional(),
})

export const ReportHistoryOutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      systemName: z.string(),
      emulatorName: z.string(),
      hardwareLabel: z.string(),
      status: z.nativeEnum(ApprovalStatus),
      createdAt: z.date(),
    }),
  ),
  pagination: PaginationResultSchema,
})
