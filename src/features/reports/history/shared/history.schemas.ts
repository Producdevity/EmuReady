import { z } from 'zod'
import { ListingType } from '@/schemas/common'
import { PaginationResultSchema } from '@/schemas/pagination'
import { ApprovalStatus } from '@orm'

export const GetReportHistorySchema = z
  .object({
    kind: ListingType.default('handheld'),
    page: z.number().int().positive().safe().default(1),
    limit: z.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(100).default(''),
    status: z.nativeEnum(ApprovalStatus).optional(),
  })
  .refine((input) => Number.isSafeInteger((input.page - 1) * input.limit), {
    message: 'Pagination offset exceeds the supported range',
    path: ['page'],
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
