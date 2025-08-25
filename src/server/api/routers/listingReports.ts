import { ResourceError } from '@/lib/errors'
import { TrustService } from '@/lib/trust/service'
import {
  CreateListingReportSchema,
  DeleteReportSchema,
  GetListingReportsSchema,
  GetReportByIdSchema,
  GetUserReportStatsSchema,
  UpdateReportStatusSchema,
} from '@/schemas/listingReport'
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { calculateOffset, createPaginationResult } from '@/server/utils/pagination'
import { batchQueries } from '@/server/utils/query-performance'
import { PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus, type Prisma, ReportStatus, TrustAction } from '@orm'

export const listingReportsRouter = createTRPCRouter({
  getStats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const [pending, underReview, resolved, dismissed] = await batchQueries([
      ctx.prisma.listingReport.count({
        where: { status: ReportStatus.PENDING },
      }),
      ctx.prisma.listingReport.count({
        where: { status: ReportStatus.UNDER_REVIEW },
      }),
      ctx.prisma.listingReport.count({
        where: { status: ReportStatus.RESOLVED },
      }),
      ctx.prisma.listingReport.count({
        where: { status: ReportStatus.DISMISSED },
      }),
    ])

    return {
      total: pending + underReview + resolved + dismissed,
      pending,
      underReview,
      resolved,
      dismissed,
    }
  }),

  getAll: permissionProcedure(PERMISSIONS.ACCESS_ADMIN_PANEL)
    .input(GetListingReportsSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        status,
        reason,
        sortField = 'createdAt',
        sortDirection = 'desc',
        page = 1,
        limit = 20,
      } = input ?? {}

      const offset = calculateOffset({ page }, limit)

      // Build where clause
      const where: Prisma.ListingReportWhereInput = {}

      if (search) {
        where.OR = [
          {
            listing: {
              game: { title: { contains: search, mode: 'insensitive' } },
            },
          },
          { reportedBy: { name: { contains: search, mode: 'insensitive' } } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (status) where.status = status

      if (reason) where.reason = reason

      const orderBy: Prisma.ListingReportOrderByWithRelationInput = {}
      if (sortField && sortDirection) {
        orderBy[sortField] = sortDirection
      }

      const [reports, total] = await batchQueries([
        ctx.prisma.listingReport.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            listing: {
              include: {
                game: { select: { id: true, title: true } },
                author: { select: { id: true, name: true } },
                device: true,
                emulator: { select: { id: true, name: true } },
              },
            },
            reportedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.listingReport.count({ where }),
      ])

      return {
        reports,
        pagination: createPaginationResult(total, { page }, limit, offset),
      }
    }),

  getById: permissionProcedure(PERMISSIONS.ACCESS_ADMIN_PANEL)
    .input(GetReportByIdSchema)
    .query(async ({ ctx, input }) => {
      const report = await ctx.prisma.listingReport.findUnique({
        where: { id: input.id },
        include: {
          listing: {
            include: {
              game: true,
              author: { select: { id: true, name: true, email: true } },
              device: true,
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

  create: protectedProcedure.input(CreateListingReportSchema).mutation(async ({ ctx, input }) => {
    const { listingId, reason, description } = input
    const userId = ctx.session.user.id

    // Check if listing exists
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: listingId },
      include: { author: true },
    })

    if (!listing) return ResourceError.listing.notFound()

    // Prevent users from reporting their own listings
    if (listing.authorId === userId) {
      return ResourceError.listingReport.cannotReportOwnListing()
    }

    // Check if user already reported this listing
    const existingReport = await ctx.prisma.listingReport.findUnique({
      where: {
        listingId_reportedById: {
          listingId,
          reportedById: userId,
        },
      },
    })

    if (existingReport) return ResourceError.listingReport.alreadyExists()

    // TODO: Send notification to SUPER_ADMIN users

    return await ctx.prisma.listingReport.create({
      data: {
        listingId,
        reportedById: userId,
        reason,
        description,
      },
      include: {
        listing: {
          include: {
            game: { select: { title: true } },
            author: { select: { name: true } },
          },
        },
      },
    })
  }),

  updateStatus: permissionProcedure(PERMISSIONS.ACCESS_ADMIN_PANEL)
    .input(UpdateReportStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, reviewNotes } = input
      const reviewerId = ctx.session.user.id

      const report = await ctx.prisma.listingReport.findUnique({
        where: { id },
        include: {
          listing: true,
        },
      })

      if (!report) {
        throw ResourceError.listingReport.notFound()
      }

      // If resolving the report and marking listing as rejected
      if (status === ReportStatus.RESOLVED && report.listing?.status === ApprovalStatus.APPROVED) {
        // Update the listing status to rejected
        await ctx.prisma.listing.update({
          where: { id: report.listingId },
          data: {
            status: ApprovalStatus.REJECTED,
            processedAt: new Date(),
            processedByUserId: reviewerId,
            processedNotes: `Rejected due to report: ${reviewNotes || 'No additional notes'}`,
          },
        })
      }

      // Award trust points based on report outcome
      const trustService = new TrustService(ctx.prisma)

      if (status === ReportStatus.RESOLVED) {
        // Report was confirmed - reward the reporter
        await trustService.logAction({
          userId: report.reportedById,
          action: TrustAction.REPORT_CONFIRMED,
          metadata: {
            reportId: id,
            listingId: report.listingId,
            reviewedBy: reviewerId,
            reason: report.reason,
          },
        })
      } else if (status === ReportStatus.DISMISSED) {
        // Report was false/malicious - penalize the reporter
        await trustService.logAction({
          userId: report.reportedById,
          action: TrustAction.FALSE_REPORT,
          metadata: {
            reportId: id,
            listingId: report.listingId,
            reviewedBy: reviewerId,
            reason: report.reason,
            reviewNotes,
          },
        })
      }

      return ctx.prisma.listingReport.update({
        where: { id },
        data: {
          status,
          reviewNotes,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          listing: {
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

  delete: permissionProcedure(PERMISSIONS.ACCESS_ADMIN_PANEL)
    .input(DeleteReportSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.prisma.listingReport.findUnique({
        where: { id: input.id },
      })

      if (!report) ResourceError.listingReport.notFound()

      return ctx.prisma.listingReport.delete({
        where: { id: input.id },
      })
    }),

  getUserReportStats: permissionProcedure(PERMISSIONS.ACCESS_ADMIN_PANEL)
    .input(GetUserReportStatsSchema)
    .query(async ({ ctx, input }) => {
      const { userId } = input

      const [reportedListingsCount, totalReports] = await batchQueries([
        ctx.prisma.listingReport.count({
          where: {
            listing: {
              authorId: userId,
            },
          },
        }),
        ctx.prisma.listingReport.count({
          where: {
            listing: {
              authorId: userId,
            },
            status: { in: [ReportStatus.RESOLVED, ReportStatus.UNDER_REVIEW] },
          },
        }),
      ])

      return {
        reportedListingsCount,
        totalReports,
        hasReports: totalReports > 0,
      }
    }),

  checkUserHasReports: publicProcedure
    .input(GetUserReportStatsSchema)
    .query(async ({ ctx, input }) => {
      const reportCount = await ctx.prisma.listingReport.count({
        where: {
          listing: {
            authorId: input.userId,
          },
          status: { in: [ReportStatus.RESOLVED, ReportStatus.UNDER_REVIEW] },
        },
      })

      return {
        hasReports: reportCount > 0,
        reportCount,
      }
    }),
})
