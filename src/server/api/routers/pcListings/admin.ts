import { ResourceError } from '@/lib/errors'
import { applyTrustAction } from '@/lib/trust/service'
import {
  ApprovePcListingSchema,
  BulkApprovePcListingsSchema,
  BulkRejectPcListingsSchema,
  GetAllPcListingsAdminSchema,
  RejectPcListingSchema,
  GetPcListingForAdminEditSchema,
  GetPendingPcListingsSchema,
  GetProcessedPcSchema,
  OverridePcApprovalStatusSchema,
  ResetPcListingToPendingSchema,
  UpdatePcListingAdminSchema,
} from '@/schemas/pcListing'
import {
  adminProcedure,
  createTRPCRouter,
  moderatorProcedure,
  permissionProcedure,
  protectedProcedure,
  superAdminProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import {
  buildPcListingOrderBy,
  buildPcListingWhere,
  buildProcessedPcListingOrderBy,
  pcListingAdminInclude,
  pcListingDetailInclude,
} from '@/server/api/utils/pcListingHelpers'
import { getProcessedStatusTrustAction } from '@/server/api/utils/processedStatusTrust'
import {
  invalidatePcListingSeo,
  invalidatePcListingSeoForUpdate,
  invalidatePcListingsSeo,
} from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { PcListingBulkModerationService } from '@/server/services/pc-listing-bulk-moderation.service'
import { autoRejectRiskyPcReports } from '@/server/services/review-risk-auto-reject.service'
import {
  attachReviewRiskProfiles,
  computeReviewRiskProfiles,
  getAutoRejectableReviewRiskPreviewForCandidates,
  getRiskOnlyReviewPage,
} from '@/server/services/review-risk.service'
import { listingStatsCache } from '@/server/utils/cache'
import { paginate } from '@/server/utils/pagination'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Role, TrustAction } from '@orm'
import { type Prisma } from '@orm/client'
import {
  invalidatePcListingStatsCache,
  PC_LISTING_STATS_CACHE_KEY,
  toPrismaCustomFieldValue,
} from './utils'

export const adminRouter = createTRPCRouter({
  getPending: protectedProcedure.input(GetPendingPcListingsSchema).query(async ({ ctx, input }) => {
    const isModerator = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToView()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const {
      search,
      page = 1,
      limit = 20,
      sortField,
      sortDirection = 'asc',
      riskFilter = 'all',
    } = input ?? {}
    const filterRiskyListings = riskFilter === 'risky'

    let emulatorIds: string[] | undefined
    if (!isModerator && isDeveloper) {
      emulatorIds = await repository.getVerifiedEmulatorIds(ctx.session.user.id)

      if (emulatorIds.length === 0) {
        return {
          pcListings: [],
          pagination: paginate({ total: 0, page, limit }),
        }
      }
    }

    if (filterRiskyListings) {
      const riskPage = await getRiskOnlyReviewPage({
        prisma: ctx.prisma,
        page,
        limit,
        loadCandidates: () =>
          repository.getPendingListingRiskCandidates({
            emulatorIds,
            search,
            sortField,
            sortDirection: sortDirection ?? 'asc',
          }),
        loadItemsByIds: (pcListingIds) =>
          repository.getPendingListingsByIds(pcListingIds, {
            emulatorIds,
            search,
          }),
      })

      return {
        pcListings: riskPage.items,
        pagination: paginate({ total: riskPage.total, page, limit }),
      }
    }

    const result = await repository.getPendingListings({
      emulatorIds,
      search,
      page,
      limit,
      sortField,
      sortDirection: sortDirection ?? 'asc',
    })

    const riskProfiles = await computeReviewRiskProfiles(ctx.prisma, result.pcListings)
    const paginatedPcListings = attachReviewRiskProfiles(result.pcListings, riskProfiles)

    return {
      pcListings: paginatedPcListings,
      pagination: result.pagination,
    }
  }),

  approve: protectedProcedure.input(ApprovePcListingSchema).mutation(async ({ ctx, input }) => {
    const isModerator = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToApprove()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getById(input.pcListingId)

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.status !== ApprovalStatus.PENDING) {
      return ResourceError.pcListing.notPending()
    }

    if (!isModerator && isDeveloper) {
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

    invalidatePcListingStatsCache()

    await invalidatePcListingSeo({
      id: input.pcListingId,
      gameId: pcListing.gameId,
      cpuId: pcListing.cpuId,
      gpuId: pcListing.gpuId,
    })

    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
      entityType: 'pcListing',
      entityId: input.pcListingId,
      triggeredBy: ctx.session.user.id,
      payload: {
        pcListingId: input.pcListingId,
        gameId: pcListing.gameId,
        approvedBy: ctx.session.user.id,
        approvedAt: approvedListing.processedAt,
      },
    })

    return approvedListing
  }),

  reject: protectedProcedure.input(RejectPcListingSchema).mutation(async ({ ctx, input }) => {
    const isModerator = hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToReject()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getById(input.pcListingId)

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.status !== ApprovalStatus.PENDING) {
      return ResourceError.pcListing.notPending()
    }

    if (!isModerator && isDeveloper) {
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

    invalidatePcListingStatsCache()

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

      invalidatePcListingStatsCache()

      if (pcListing.status === ApprovalStatus.APPROVED) {
        await invalidatePcListingSeo({
          id: input.pcListingId,
          gameId: pcListing.gameId,
          cpuId: pcListing.cpuId,
          gpuId: pcListing.gpuId,
        })
      }

      return updatedListing
    }),

  getProcessed: superAdminProcedure.input(GetProcessedPcSchema).query(async ({ ctx, input }) => {
    const { page, limit, filterStatus, search, sortField, sortDirection } = input
    const skip = (page - 1) * limit

    const baseWhere: Prisma.PcListingWhereInput = {
      NOT: { status: ApprovalStatus.PENDING },
      ...(filterStatus ? { status: filterStatus } : {}),
    }

    const searchWhere: Prisma.PcListingWhereInput = search
      ? {
          OR: [
            { game: { title: { contains: search, mode: 'insensitive' } } },
            { game: { system: { name: { contains: search, mode: 'insensitive' } } } },
            { cpu: { modelName: { contains: search, mode: 'insensitive' } } },
            { cpu: { brand: { name: { contains: search, mode: 'insensitive' } } } },
            { gpu: { modelName: { contains: search, mode: 'insensitive' } } },
            { gpu: { brand: { name: { contains: search, mode: 'insensitive' } } } },
            { emulator: { name: { contains: search, mode: 'insensitive' } } },
            { author: { name: { contains: search, mode: 'insensitive' } } },
            { processedNotes: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    const where = buildPcListingWhere({ ...baseWhere, ...searchWhere }, true)
    const orderBy = buildProcessedPcListingOrderBy(sortField, sortDirection)

    const [pcListings, total] = await Promise.all([
      ctx.prisma.pcListing.findMany({
        where,
        include: pcListingAdminInclude,
        orderBy,
        skip,
        take: limit,
      }),
      ctx.prisma.pcListing.count({ where }),
    ])

    return {
      pcListings,
      pagination: paginate({ total, page, limit }),
    }
  }),

  overrideStatus: superAdminProcedure
    .input(OverridePcApprovalStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, newStatus, overrideNotes } = input
      const superAdminUserId = ctx.session.user.id

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
        select: {
          id: true,
          status: true,
          gameId: true,
          cpuId: true,
          gpuId: true,
          authorId: true,
          processedNotes: true,
        },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      const updatedPcListing = await ctx.prisma.pcListing.update({
        where: { id: pcListingId },
        data:
          newStatus === ApprovalStatus.PENDING
            ? {
                status: newStatus,
                processedByUserId: null,
                processedAt: null,
                processedNotes: null,
              }
            : {
                status: newStatus,
                processedByUserId: superAdminUserId,
                processedAt: new Date(),
                processedNotes: overrideNotes ?? pcListing.processedNotes,
              },
      })

      invalidatePcListingStatsCache()

      if (pcListing.status === ApprovalStatus.APPROVED || newStatus === ApprovalStatus.APPROVED) {
        await invalidatePcListingSeo({
          id: pcListingId,
          gameId: pcListing.gameId,
          cpuId: pcListing.cpuId,
          gpuId: pcListing.gpuId,
        })
      }

      const trustAction = getProcessedStatusTrustAction({
        previousStatus: pcListing.status,
        newStatus,
        authorId: pcListing.authorId,
      })
      if (trustAction) {
        await applyTrustAction({
          userId: trustAction.userId,
          action: trustAction.action,
          context: {
            pcListingId,
            adminUserId: superAdminUserId,
            reason: overrideNotes || 'pc_listing_status_override',
          },
        })
      }

      if (newStatus === ApprovalStatus.APPROVED || newStatus === ApprovalStatus.REJECTED) {
        notificationEventEmitter.emitNotificationEvent({
          eventType:
            newStatus === ApprovalStatus.APPROVED
              ? NOTIFICATION_EVENTS.PC_LISTING_APPROVED
              : NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
          entityType: 'pcListing',
          entityId: pcListingId,
          triggeredBy: superAdminUserId,
          payload:
            newStatus === ApprovalStatus.APPROVED
              ? {
                  pcListingId,
                  gameId: pcListing.gameId,
                  approvedBy: superAdminUserId,
                  approvedAt: updatedPcListing.processedAt,
                }
              : {
                  pcListingId,
                  rejectedBy: superAdminUserId,
                  rejectedAt: updatedPcListing.processedAt,
                  rejectionReason: overrideNotes,
                },
        })
      }

      return updatedPcListing
    }),

  bulkApprove: protectedProcedure
    .input(BulkApprovePcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const adminUserId = ctx.session.user.id
      const bulkModeration = new PcListingBulkModerationService(ctx.prisma)
      const transactionResult = await bulkModeration.bulkApprove({
        pcListingIds: input.pcListingIds,
        actor: {
          userId: adminUserId,
          role: ctx.session.user.role,
        },
      })

      const listingsWithAuthor = transactionResult.pcListings.filter(
        (l): l is typeof l & { authorId: string } => l.authorId !== null,
      )
      await Promise.all(
        listingsWithAuthor.map((listing) =>
          applyTrustAction({
            userId: listing.authorId,
            action: TrustAction.LISTING_APPROVED,
            context: {
              pcListingId: listing.id,
              adminUserId,
              reason: 'bulk_listing_approved',
            },
          }),
        ),
      )

      invalidatePcListingStatsCache()

      await invalidatePcListingsSeo(transactionResult.pcListings)

      for (const listing of transactionResult.pcListings) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.PC_LISTING_APPROVED,
          entityType: 'pcListing',
          entityId: listing.id,
          triggeredBy: adminUserId,
          payload: {
            pcListingId: listing.id,
            gameId: listing.gameId,
            approvedBy: adminUserId,
            approvedAt: transactionResult.processedAt,
            bulk: true,
          },
        })
      }

      return { count: transactionResult.count }
    }),

  bulkReject: protectedProcedure
    .input(BulkRejectPcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const adminUserId = ctx.session.user.id
      const bulkModeration = new PcListingBulkModerationService(ctx.prisma)
      const transactionResult = await bulkModeration.bulkReject({
        pcListingIds: input.pcListingIds,
        notes: input.notes,
        actor: {
          userId: adminUserId,
          role: ctx.session.user.role,
        },
      })

      const listingsWithAuthor = transactionResult.pcListings.filter(
        (l): l is typeof l & { authorId: string } => l.authorId !== null,
      )
      await Promise.all(
        listingsWithAuthor.map((listing) =>
          applyTrustAction({
            userId: listing.authorId,
            action: TrustAction.LISTING_REJECTED,
            context: {
              pcListingId: listing.id,
              adminUserId,
              reason: input.notes || 'bulk_listing_rejected',
            },
          }),
        ),
      )

      invalidatePcListingStatsCache()

      for (const listing of transactionResult.pcListings) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
          entityType: 'pcListing',
          entityId: listing.id,
          triggeredBy: adminUserId,
          payload: {
            pcListingId: listing.id,
            rejectedBy: adminUserId,
            rejectedAt: transactionResult.processedAt,
            rejectionReason: input.notes,
          },
        })
      }

      return { count: transactionResult.count }
    }),

  autoRejectRiskyPreview: adminProcedure.query(async ({ ctx }) => {
    const repository = new PcListingsRepository(ctx.prisma)

    return getAutoRejectableReviewRiskPreviewForCandidates({
      prisma: ctx.prisma,
      loadCandidates: () => repository.getPendingListingRiskCandidates({}),
    })
  }),

  autoRejectRisky: adminProcedure.mutation(async ({ ctx }) => {
    const adminUserId = ctx.session.user.id

    const adminUserExists = await ctx.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true },
    })
    if (!adminUserExists) return ResourceError.user.notInDatabase(adminUserId)

    return autoRejectRiskyPcReports({
      prisma: ctx.prisma,
      adminUserId,
    })
  }),

  get: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
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
        pagination: paginate({ total: total, page, limit: limit }),
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

  updateListing: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(UpdatePcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...data } = input

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id },
        select: {
          id: true,
          gameId: true,
          cpuId: true,
          gpuId: true,
          status: true,
        },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      const customFieldCreateData = customFieldValues?.map((cfv) => ({
        pcListingId: id,
        customFieldDefinitionId: cfv.customFieldDefinitionId,
        value: toPrismaCustomFieldValue(cfv.value),
      }))

      const updatedPcListing = await ctx.prisma.$transaction(async (tx) => {
        await tx.pcListing.update({
          where: { id },
          data: { ...data, updatedAt: new Date() },
        })

        if (customFieldCreateData !== undefined) {
          await tx.pcListingCustomFieldValue.deleteMany({
            where: { pcListingId: id },
          })

          if (customFieldCreateData.length > 0) {
            await tx.pcListingCustomFieldValue.createMany({
              data: customFieldCreateData,
            })
          }
        }

        const finalPcListing = await tx.pcListing.findUnique({
          where: { id },
          include: pcListingDetailInclude,
        })

        if (!finalPcListing) return ResourceError.pcListing.notFound()
        return finalPcListing
      })

      const previousSeoTarget = {
        id,
        gameId: pcListing.gameId,
        cpuId: pcListing.cpuId,
        gpuId: pcListing.gpuId,
      }
      const nextSeoTarget = {
        id,
        gameId: updatedPcListing.gameId,
        cpuId: updatedPcListing.cpuId,
        gpuId: updatedPcListing.gpuId,
      }
      const wasApproved = pcListing.status === ApprovalStatus.APPROVED
      const isApproved = updatedPcListing.status === ApprovalStatus.APPROVED

      if (wasApproved && isApproved) {
        await invalidatePcListingSeoForUpdate(previousSeoTarget, nextSeoTarget)
      } else if (wasApproved) {
        await invalidatePcListingSeo(previousSeoTarget)
      } else if (isApproved) {
        await invalidatePcListingSeo(nextSeoTarget)
      }

      return updatedPcListing
    }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const cached = listingStatsCache.get(PC_LISTING_STATS_CACHE_KEY)
    if (cached) return cached

    const repository = new PcListingsRepository(ctx.prisma)
    const stats = await repository.stats()

    listingStatsCache.set(PC_LISTING_STATS_CACHE_KEY, stats)
    return stats
  }),
})
