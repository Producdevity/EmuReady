import { ResourceError } from '@/lib/errors'
import { TrustService } from '@/lib/trust/service'
import { DeleteReportSchema, GetReportByIdSchema } from '@/schemas/listingReport'
import {
  CreatePcListingReportSchema,
  GetPcListingReportsSchema,
  UpdatePcListingReportSchema,
} from '@/schemas/pcListing'
import { createTRPCRouter, permissionProcedure, protectedProcedure } from '@/server/api/trpc'
import { ReportSubmissionService } from '@/server/services/report-submission.service'
import { paginate } from '@/server/utils/pagination'
import { validateEnum, sanitizeInput, validatePagination } from '@/server/utils/security-validation'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, ReportReason, ReportStatus, TrustAction } from '@orm'
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

      const { page, limit } = validatePagination(input?.page, input?.limit, 50)
      const sanitizedSearch = search ? sanitizeInput(search) : undefined
      const offset = (page - 1) * limit

      const where: Prisma.PcListingReportWhereInput = {}

      if (sanitizedSearch) {
        where.OR = [
          { pcListing: { game: { title: { contains: sanitizedSearch, mode: 'insensitive' } } } },
          { reportedBy: { name: { contains: sanitizedSearch, mode: 'insensitive' } } },
          { description: { contains: sanitizedSearch, mode: 'insensitive' } },
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

      return report || ResourceError.listingReport.notFound()
    }),

  create: protectedProcedure.input(CreatePcListingReportSchema).mutation(async ({ ctx, input }) => {
    const { pcListingId, reason, description } = input
    const userId = ctx.session.user.id

    validateEnum(reason, Object.values(ReportReason), 'reason')

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
      const { reportId, status, reviewNotes } = input
      const reviewerId = ctx.session.user.id

      validateEnum(status, Object.values(ReportStatus), 'status')

      const report = await ctx.prisma.pcListingReport.findUnique({
        where: { id: reportId },
        include: { pcListing: true },
      })

      if (!report) {
        return ResourceError.listingReport.notFound()
      }

      if (
        status === ReportStatus.RESOLVED &&
        report.pcListing?.status === ApprovalStatus.APPROVED
      ) {
        await ctx.prisma.pcListing.update({
          where: { id: report.pcListingId },
          data: {
            status: ApprovalStatus.REJECTED,
            processedAt: new Date(),
            processedByUserId: reviewerId,
            processedNotes: `Rejected due to report: ${reviewNotes || 'No additional notes'}`,
          },
        })
      }

      const trustService = new TrustService(ctx.prisma)

      if (status === ReportStatus.RESOLVED) {
        await trustService.logAction({
          userId: report.reportedById,
          action: TrustAction.REPORT_CONFIRMED,
          metadata: {
            reportId,
            pcListingId: report.pcListingId,
            reviewedBy: reviewerId,
            reason: report.reason,
          },
        })
      } else if (status === ReportStatus.DISMISSED) {
        await trustService.logAction({
          userId: report.reportedById,
          action: TrustAction.FALSE_REPORT,
          metadata: {
            reportId,
            pcListingId: report.pcListingId,
            reviewedBy: reviewerId,
            reason: report.reason,
            reviewNotes,
          },
        })
      }

      return ctx.prisma.pcListingReport.update({
        where: { id: reportId },
        data: {
          status,
          reviewNotes,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          pcListing: {
            include: {
              game: { select: { title: true } },
              author: { select: { name: true } },
            },
          },
          reportedBy: { select: { name: true } },
          reviewedBy: { select: { name: true } },
        },
      })
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(DeleteReportSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.prisma.pcListingReport.findUnique({
        where: { id: input.id },
      })

      if (!report) return ResourceError.listingReport.notFound()

      return ctx.prisma.pcListingReport.delete({
        where: { id: input.id },
      })
    }),
})
