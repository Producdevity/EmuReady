import { ResourceError } from '@/lib/errors'
import { DeleteReportSchema, GetReportByIdSchema } from '@/schemas/listingReport'
import {
  CreatePcListingReportSchema,
  GetPcListingReportsSchema,
  UpdatePcListingReportSchema,
} from '@/schemas/pcListing'
import { createTRPCRouter, permissionProcedure, protectedProcedure } from '@/server/api/trpc'
import { ReportModerationService } from '@/server/services/report-moderation.service'
import { ReportSubmissionService } from '@/server/services/report-submission.service'
import { paginate } from '@/server/utils/pagination'
import { PERMISSIONS } from '@/utils/permission-system'
import { ReportStatus } from '@orm'
import { type Prisma } from '@orm/client'

export const pcListingReportsRouter = createTRPCRouter({
  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const [pending, underReview, resolved, dismissed] = await Promise.all([
      ctx.prisma.pcListingReport.count({ where: { status: ReportStatus.PENDING } }),
      ctx.prisma.pcListingReport.count({ where: { status: ReportStatus.UNDER_REVIEW } }),
      ctx.prisma.pcListingReport.count({ where: { status: ReportStatus.RESOLVED } }),
      ctx.prisma.pcListingReport.count({ where: { status: ReportStatus.DISMISSED } }),
    ])

    return {
      total: pending + underReview + resolved + dismissed,
      pending,
      underReview,
      resolved,
      dismissed,
    }
  }),

  get: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetPcListingReportsSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        status,
        reason,
        sortField = 'createdAt',
        sortDirection = 'desc',
      } = input ?? {}

      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      const normalizedSearch = search?.trim() || undefined
      const offset = (page - 1) * limit

      const where: Prisma.PcListingReportWhereInput = {}

      if (normalizedSearch) {
        where.OR = [
          { pcListing: { game: { title: { contains: normalizedSearch, mode: 'insensitive' } } } },
          { reportedBy: { name: { contains: normalizedSearch, mode: 'insensitive' } } },
          { description: { contains: normalizedSearch, mode: 'insensitive' } },
        ]
      }

      if (status) where.status = status
      if (reason) where.reason = reason

      const orderBy: Prisma.PcListingReportOrderByWithRelationInput = {}
      if (sortField && sortDirection) orderBy[sortField] = sortDirection

      const [reports, total] = await Promise.all([
        ctx.prisma.pcListingReport.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            pcListing: {
              include: {
                game: { select: { id: true, title: true } },
                author: { select: { id: true, name: true } },
                cpu: true,
                gpu: true,
                emulator: { select: { id: true, name: true } },
              },
            },
            reportedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.pcListingReport.count({ where }),
      ])

      return {
        reports,
        pagination: paginate({ total: total, page, limit: limit }),
      }
    }),

  byId: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetReportByIdSchema)
    .query(async ({ ctx, input }) => {
      const report = await ctx.prisma.pcListingReport.findUnique({
        where: { id: input.id },
        include: {
          pcListing: {
            include: {
              game: true,
              author: { select: { id: true, name: true, email: true } },
              cpu: true,
              gpu: true,
              emulator: true,
              performance: true,
            },
          },
          reportedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
      })

      return report || ResourceError.pcListingReport.notFound()
    }),

  create: protectedProcedure.input(CreatePcListingReportSchema).mutation(async ({ ctx, input }) => {
    const { pcListingId, reason, description } = input
    const userId = ctx.session.user.id

    const reportSubmissionService = new ReportSubmissionService(ctx.prisma)

    return await reportSubmissionService.createPcListingReport({
      pcListingId,
      reportedById: userId,
      reason,
      description,
    })
  }),

  updateStatus: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(UpdatePcListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      return new ReportModerationService(ctx.prisma).updatePcListingReportStatus({
        reportId: input.id,
        status: input.status,
        reviewNotes: input.reviewNotes,
        reviewerId: ctx.session.user.id,
      })
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(DeleteReportSchema)
    .mutation(async ({ ctx, input }) => {
      return new ReportModerationService(ctx.prisma).deletePcListingReport(input.id)
    }),
})
