import { ResourceError } from '@/lib/errors'
import { applyTrustAction, TrustService } from '@/lib/trust/service'
import {
  ApprovePcListingSchema,
  BulkApprovePcListingsSchema,
  BulkRejectPcListingsSchema,
  GetAllPcListingsAdminSchema,
  GetPcListingForAdminEditSchema,
  GetPcListingReportsSchema,
  GetPendingPcListingsSchema,
  RejectPcListingSchema,
  ResetPcListingToPendingSchema,
  UpdatePcListingAdminSchema,
  UpdatePcListingReportSchema,
} from '@/schemas/pcListing'
import {
  createTRPCRouter,
  moderatorProcedure,
  permissionProcedure,
  protectedProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import {
  buildPcListingOrderBy,
  buildPcListingWhere,
  pcListingAdminInclude,
  pcListingDetailInclude,
} from '@/server/api/utils/pcListingHelpers'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { decorateListingsWithRiskProfiles } from '@/server/services/author-risk.service'
import { applyBulkTrustActions } from '@/server/utils/bulk-trust-actions'
import { listingStatsCache } from '@/server/utils/cache'
import { paginate } from '@/server/utils/pagination'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Prisma, ReportStatus, Role, TrustAction } from '@orm'

export const adminRouter = createTRPCRouter({
  pending: protectedProcedure.input(GetPendingPcListingsSchema).query(async ({ ctx, input }) => {
    const isMod = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isMod && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToView()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const { search, page = 1, limit = 20, sortField, sortDirection = 'asc' } = input ?? {}

    let emulatorIds: string[] | undefined
    if (!isMod && isDeveloper) {
      emulatorIds = await repository.getVerifiedEmulatorIds(ctx.session.user.id)

      if (emulatorIds.length === 0) {
        return {
          pcListings: [],
          pagination: paginate({ total: 0, page, limit }),
        }
      }
    }

    const result = await repository.getPendingListings({
      emulatorIds,
      search,
      page,
      limit,
      sortField,
      sortDirection: sortDirection ?? 'asc',
      canSeeBannedUsers: true,
    })

    const pcListings = await decorateListingsWithRiskProfiles(ctx.prisma, result.pcListings)

    return {
      pcListings,
      pagination: result.pagination,
    }
  }),

  approve: protectedProcedure.input(ApprovePcListingSchema).mutation(async ({ ctx, input }) => {
    const isMod = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isMod && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToApprove()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getById(input.pcListingId)

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.status !== ApprovalStatus.PENDING) {
      return ResourceError.pcListing.notPending()
    }

    if (!isMod && isDeveloper) {
      const isVerified = await repository.isDeveloperVerifiedForEmulator(
        ctx.session.user.id,
        pcListing.emulatorId,
      )

      if (!isVerified) {
        return ResourceError.pcListing.mustBeVerifiedToApprove()
      }
    }

    const approvedListing = await repository.approve(input.pcListingId, ctx.session.user.id)

    if (pcListing.authorId) {
      await applyTrustAction({
        userId: pcListing.authorId,
        action: TrustAction.LISTING_APPROVED,
        context: {
          pcListingId: input.pcListingId,
          adminUserId: ctx.session.user.id,
          reason: 'listing_approved',
        },
      })
    }

    listingStatsCache.delete('pc-listing-stats')

    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
      entityType: 'pcListing',
      entityId: input.pcListingId,
      triggeredBy: ctx.session.user.id,
      payload: {
        pcListingId: input.pcListingId,
        gameId: pcListing.gameId,
      },
    })

    return approvedListing
  }),

  reject: protectedProcedure.input(RejectPcListingSchema).mutation(async ({ ctx, input }) => {
    const isMod = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isMod && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToReject()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getById(input.pcListingId)

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.status !== ApprovalStatus.PENDING) {
      return ResourceError.pcListing.notPending()
    }

    if (!isMod && isDeveloper) {
      const isVerified = await repository.isDeveloperVerifiedForEmulator(
        ctx.session.user.id,
        pcListing.emulatorId,
      )

      if (!isVerified) {
        return ResourceError.pcListing.mustBeVerifiedToReject()
      }
    }

    const rejectedListing = await repository.reject(
      input.pcListingId,
      ctx.session.user.id,
      input.notes,
    )

    if (pcListing.authorId) {
      await applyTrustAction({
        userId: pcListing.authorId,
        action: TrustAction.LISTING_REJECTED,
        context: {
          pcListingId: input.pcListingId,
          adminUserId: ctx.session.user.id,
          reason: input.notes || 'listing_rejected',
        },
      })
    }

    listingStatsCache.delete('pc-listing-stats')

    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
      entityType: 'pcListing',
      entityId: input.pcListingId,
      triggeredBy: ctx.session.user.id,
      payload: {
        pcListingId: input.pcListingId,
        rejectedBy: ctx.session.user.id,
        rejectedAt: rejectedListing.processedAt,
        rejectionReason: input.notes,
      },
    })

    return rejectedListing
  }),

  resetToPending: moderatorProcedure
    .input(ResetPcListingToPendingSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PcListingsRepository(ctx.prisma)
      const pcListing = await repository.getById(input.pcListingId)

      if (!pcListing) return ResourceError.pcListing.notFound()

      if (pcListing.status === ApprovalStatus.PENDING) {
        return ResourceError.pcListing.alreadyPending()
      }

      const updatedListing = await ctx.prisma.pcListing.update({
        where: { id: input.pcListingId },
        data: {
          status: ApprovalStatus.PENDING,
          processedByUserId: null,
          processedAt: null,
          processedNotes: null,
        },
      })

      listingStatsCache.delete('pc-listing-stats')

      return updatedListing
    }),

  bulkApprove: protectedProcedure
    .input(BulkApprovePcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const isMod = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
      const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

      if (!isMod && !isDeveloper) {
        return ResourceError.pcListing.requiresDeveloperToApprove()
      }

      const pendingListings = await ctx.prisma.pcListing.findMany({
        where: { id: { in: input.pcListingIds }, status: ApprovalStatus.PENDING },
        select: { id: true, gameId: true, authorId: true },
      })

      const result = await ctx.prisma.pcListing.updateMany({
        where: { id: { in: pendingListings.map((l) => l.id) } },
        data: {
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
        },
      })

      await applyBulkTrustActions({
        listings: pendingListings,
        action: TrustAction.LISTING_APPROVED,
        buildContext: (listing) => ({
          pcListingId: listing.id,
          adminUserId: ctx.session.user.id,
          reason: 'bulk_listing_approved',
        }),
      })

      listingStatsCache.delete('pc-listing-stats')

      for (const listing of pendingListings) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
          entityType: 'pcListing',
          entityId: listing.id,
          triggeredBy: ctx.session.user.id,
          payload: { pcListingId: listing.id, gameId: listing.gameId },
        })
      }

      return { count: result.count }
    }),

  bulkReject: protectedProcedure
    .input(BulkRejectPcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const isMod = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
      const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

      if (!isMod && !isDeveloper) {
        return ResourceError.pcListing.requiresDeveloperToReject()
      }

      const pendingListings = await ctx.prisma.pcListing.findMany({
        where: { id: { in: input.pcListingIds }, status: ApprovalStatus.PENDING },
        select: { id: true, authorId: true },
      })

      const result = await ctx.prisma.pcListing.updateMany({
        where: { id: { in: pendingListings.map((l) => l.id) } },
        data: {
          status: ApprovalStatus.REJECTED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
          processedNotes: input.notes,
        },
      })

      await applyBulkTrustActions({
        listings: pendingListings,
        action: TrustAction.LISTING_REJECTED,
        buildContext: (listing) => ({
          pcListingId: listing.id,
          adminUserId: ctx.session.user.id,
          reason: input.notes || 'bulk_listing_rejected',
        }),
      })

      listingStatsCache.delete('pc-listing-stats')

      for (const listing of pendingListings) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
          entityType: 'pcListing',
          entityId: listing.id,
          triggeredBy: ctx.session.user.id,
          payload: {
            pcListingId: listing.id,
            rejectedBy: ctx.session.user.id,
            rejectedAt: new Date(),
            rejectionReason: input.notes,
          },
        })
      }

      return { count: result.count }
    }),

  getAll: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(GetAllPcListingsAdminSchema)
    .query(async ({ ctx, input }) => {
      const {
        page = 1,
        limit = 20,
        sortField,
        sortDirection,
        search,
        statusFilter,
        systemFilter,
        emulatorFilter,
        osFilter,
      } = input

      const offset = (page - 1) * limit

      const baseWhere: Prisma.PcListingWhereInput = {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(systemFilter ? { game: { systemId: systemFilter } } : {}),
        ...(emulatorFilter ? { emulatorId: emulatorFilter } : {}),
        ...(osFilter ? { os: osFilter } : {}),
        ...(search
          ? {
              OR: [
                { game: { title: { contains: search, mode: 'insensitive' } } },
                { cpu: { modelName: { contains: search, mode: 'insensitive' } } },
                { gpu: { modelName: { contains: search, mode: 'insensitive' } } },
                { emulator: { name: { contains: search, mode: 'insensitive' } } },
                { author: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      }

      const where = buildPcListingWhere(baseWhere, true)
      const orderBy = buildPcListingOrderBy(sortField, sortDirection ?? undefined)

      const [pcListings, total] = await Promise.all([
        ctx.prisma.pcListing.findMany({
          where,
          include: pcListingAdminInclude,
          orderBy,
          skip: offset,
          take: limit,
        }),
        ctx.prisma.pcListing.count({ where }),
      ])

      return {
        pcListings,
        pagination: paginate({ total, page, limit }),
      }
    }),

  getForEdit: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(GetPcListingForAdminEditSchema)
    .query(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
        include: pcListingDetailInclude,
      })

      return pcListing ?? ResourceError.pcListing.notFound()
    }),

  updateAdmin: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(UpdatePcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...data } = input

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id },
        include: { customFieldValues: true },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      const pcRepository = new PcListingsRepository(ctx.prisma)
      await pcRepository.validatePlatformForUpdate({
        platformId: data.platformId,
        pcListingId: id,
        emulatorId: data.emulatorId,
        os: data.os,
      })

      const updatedPcListing = await ctx.prisma.pcListing.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
        include: pcListingDetailInclude,
      })

      if (customFieldValues) {
        await ctx.prisma.pcListingCustomFieldValue.deleteMany({ where: { pcListingId: id } })

        if (customFieldValues.length > 0) {
          await ctx.prisma.pcListingCustomFieldValue.createMany({
            data: customFieldValues.map((cfv) => ({
              pcListingId: id,
              customFieldDefinitionId: cfv.customFieldDefinitionId,
              value: (cfv.value ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            })),
          })
        }
      }

      return updatedPcListing
    }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const STATS_CACHE_KEY = 'pc-listing-stats'
    const cached = listingStatsCache.get(STATS_CACHE_KEY)
    if (cached) return cached

    const repository = new PcListingsRepository(ctx.prisma)
    const stats = await repository.stats()

    listingStatsCache.set(STATS_CACHE_KEY, stats)
    return stats
  }),

  getReports: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetPcListingReportsSchema)
    .query(async ({ ctx, input }) => {
      const { status, page = 1, limit = 20 } = input
      const offset = (page - 1) * limit

      const where: Prisma.PcListingReportWhereInput = {}
      if (status) where.status = status

      const [reports, total] = await Promise.all([
        ctx.prisma.pcListingReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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
        pagination: paginate({ total, page, limit }),
      }
    }),

  updateReport: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(UpdatePcListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { reportId, status, reviewNotes } = input
      const reviewerId = ctx.session.user.id

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

      return await ctx.prisma.pcListingReport.update({
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
})
