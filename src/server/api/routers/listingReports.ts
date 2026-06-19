import { ResourceError } from '@/lib/errors'
import {
  CreateListingReportSchema,
  DeleteReportSchema,
  GetListingReportsSchema,
  GetReportByIdSchema,
  GetUserReportsSchema,
  GetUserReportStatsSchema,
  UpdateReportStatusSchema,
} from '@/schemas/listingReport'
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { ReportModerationService } from '@/server/services/report-moderation.service'
import { getAuthorReportCounts } from '@/server/services/report-stats.service'
import { ReportSubmissionService } from '@/server/services/report-submission.service'
import { paginate } from '@/server/utils/pagination'
import { PERMISSIONS } from '@/utils/permission-system'
import { type Prisma, type ReportReason, ReportStatus } from '@orm/client'

export const listingReportsRouter = createTRPCRouter({
  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const [pending, underReview, resolved, dismissed] = await Promise.all([
      ctx.prisma.listingReport.count({ where: { status: ReportStatus.PENDING } }),
      ctx.prisma.listingReport.count({ where: { status: ReportStatus.UNDER_REVIEW } }),
      ctx.prisma.listingReport.count({ where: { status: ReportStatus.RESOLVED } }),
      ctx.prisma.listingReport.count({ where: { status: ReportStatus.DISMISSED } }),
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
    .input(GetListingReportsSchema)
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

      // Build where clause
      const where: Prisma.ListingReportWhereInput = {}

      if (normalizedSearch) {
        where.OR = [
          { listing: { game: { title: { contains: normalizedSearch, mode: 'insensitive' } } } },
          { reportedBy: { name: { contains: normalizedSearch, mode: 'insensitive' } } },
          { description: { contains: normalizedSearch, mode: 'insensitive' } },
        ]
      }

      if (status) where.status = status

      if (reason) where.reason = reason

      const orderBy: Prisma.ListingReportOrderByWithRelationInput = {}
      if (sortField && sortDirection) orderBy[sortField] = sortDirection

      const [reports, total] = await Promise.all([
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
        pagination: paginate({ total: total, page, limit: limit }),
      }
    }),

  byId: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
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

    const reportSubmissionService = new ReportSubmissionService(ctx.prisma)

    return await reportSubmissionService.createListingReport({
      listingId,
      reportedById: userId,
      reason,
      description,
    })
  }),

  updateStatus: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(UpdateReportStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return new ReportModerationService(ctx.prisma).updateListingReportStatus({
        id: input.id,
        status: input.status,
        reviewNotes: input.reviewNotes,
        reviewerId: ctx.session.user.id,
      })
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(DeleteReportSchema)
    .mutation(async ({ ctx, input }) => {
      return new ReportModerationService(ctx.prisma).deleteListingReport(input.id)
    }),

  getUserReportStats: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetUserReportStatsSchema)
    .query(async ({ ctx, input }) => {
      return getAuthorReportCounts(ctx.prisma, input.userId)
    }),

  getUserReports: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetUserReportsSchema)
    .query(async ({ ctx, input }) => {
      const { userId, status, page, limit } = input

      const handheldWhere: Prisma.ListingReportWhereInput = {
        listing: { authorId: userId },
        ...(status ? { status } : {}),
      }

      const pcWhere: Prisma.PcListingReportWhereInput = {
        pcListing: { authorId: userId },
        ...(status ? { status } : {}),
      }

      const [handheldReports, pcReports, handheldCount, pcCount] = await Promise.all([
        ctx.prisma.listingReport.findMany({
          where: handheldWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            listing: {
              include: {
                game: { select: { id: true, title: true } },
              },
            },
            reportedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.pcListingReport.findMany({
          where: pcWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            pcListing: {
              include: {
                game: { select: { id: true, title: true } },
              },
            },
            reportedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.listingReport.count({ where: handheldWhere }),
        ctx.prisma.pcListingReport.count({ where: pcWhere }),
      ])

      type UnifiedReport = {
        id: string
        listingType: 'handheld' | 'pc'
        listingId: string
        gameTitle: string
        reason: ReportReason
        description: string | null
        status: ReportStatus
        reportedBy: { id: string; name: string | null }
        reviewedBy: { id: string; name: string | null } | null
        reviewNotes: string | null
        reviewedAt: Date | null
        createdAt: Date
      }

      const unified: UnifiedReport[] = [
        ...handheldReports.map((r) => ({
          id: r.id,
          listingType: 'handheld' as const,
          listingId: r.listingId,
          gameTitle: r.listing.game.title,
          reason: r.reason,
          description: r.description,
          status: r.status,
          reportedBy: r.reportedBy,
          reviewedBy: r.reviewedBy,
          reviewNotes: r.reviewNotes,
          reviewedAt: r.reviewedAt,
          createdAt: r.createdAt,
        })),
        ...pcReports.map((r) => ({
          id: r.id,
          listingType: 'pc' as const,
          listingId: r.pcListingId,
          gameTitle: r.pcListing.game.title,
          reason: r.reason,
          description: r.description,
          status: r.status,
          reportedBy: r.reportedBy,
          reviewedBy: r.reviewedBy,
          reviewNotes: r.reviewNotes,
          reviewedAt: r.reviewedAt,
          createdAt: r.createdAt,
        })),
      ]

      unified.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      const total = handheldCount + pcCount
      const offset = (page - 1) * limit
      const paginatedItems = unified.slice(offset, offset + limit)

      return {
        reports: paginatedItems,
        pagination: paginate({ total, page, limit }),
      }
    }),

  checkUserHasReports: publicProcedure
    .input(GetUserReportStatsSchema)
    .query(async ({ ctx, input }) => {
      const { totalReports, hasReports } = await getAuthorReportCounts(ctx.prisma, input.userId)

      return {
        hasReports,
        reportCount: totalReports,
      }
    }),
})
