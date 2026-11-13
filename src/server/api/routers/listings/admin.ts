import { ReportAdminEditService } from '@/features/reports/approval/server/report-admin-edit.service'
import { ReportApprovalRepository } from '@/features/reports/approval/server/report-approval.repository'
import { ReportApprovalService } from '@/features/reports/approval/server/report-approval.service'
import {
  ReportApprovalResultSchema,
  HandheldBulkApprovalResultSchema,
  HandheldBulkRejectionResultSchema,
} from '@/features/reports/approval/shared/report-approval.schemas'
import { ResourceError, AppError } from '@/lib/errors'
import { ListingType } from '@/schemas/common'
import {
  ApproveListingSchema,
  RejectListingSchema,
  GetProcessedSchema,
  GetPendingListingsSchema,
  GetListingModeratorInfoSchema,
  OverrideApprovalStatusSchema,
  DeleteListingSchema,
  BulkApproveListingsSchema,
  BulkRejectListingsSchema,
  GetListingForEditSchema,
  UpdateListingAdminSchema,
  GetAllListingsAdminSchema,
  GetListingByIdSchema,
  ResetListingToPendingSchema,
} from '@/schemas/listing'
import {
  createTRPCRouter,
  deleteAnyListingProcedure,
  moderatorProcedure,
  superAdminProcedure,
  adminProcedure,
  developerProcedure,
  viewStatisticsProcedure,
  protectedProcedure,
} from '@/server/api/trpc'
import { buildProcessedOrderBy } from '@/server/api/utils/listingHelpers'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { autoRejectRiskyHandheldReports } from '@/server/services/review-risk-auto-reject.service'
import {
  attachReviewRiskProfiles,
  computeReviewRiskProfiles,
  getAutoRejectableReviewRiskPreviewForCandidates,
  getRiskOnlyReviewPage,
} from '@/server/services/review-risk.service'
import { listingStatsCache } from '@/server/utils/cache/instances'
import { generateEmulatorConfig } from '@/server/utils/emulator-config/emulator-detector'
import { paginate } from '@/server/utils/pagination'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
import { Prisma } from '@orm/client'

const LISTING_STATS_CACHE_KEY = 'listing-stats'

const mode = Prisma.QueryMode.insensitive

export const adminRouter = createTRPCRouter({
  moderatorInfo: moderatorProcedure
    .input(GetListingModeratorInfoSchema)
    .query(async ({ ctx, input }) => {
      return input.type === ListingType.enum.handheld
        ? new ListingsRepository(ctx.prisma).getModeratorInfo(input.id)
        : new PcListingsRepository(ctx.prisma).getModeratorInfo(input.id)
    }),

  getPending: developerProcedure.input(GetPendingListingsSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    const {
      search,
      page = 1,
      limit = 20,
      sortField,
      sortDirection,
      riskFilter = 'all',
    } = input ?? {}
    const filterRiskyListings = riskFilter === 'risky'
    let emulatorIds: string[] | undefined

    // For developers, only show listings for their verified emulators
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      emulatorIds = await repository.listVerifiedEmulatorIdsByUserId(ctx.session.user.id)

      if (emulatorIds.length === 0) {
        return {
          listings: [],
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
            sortDirection,
          }),
        loadItemsByIds: (listingIds) =>
          repository.getPendingListingsByIds(listingIds, {
            emulatorIds,
            search,
          }),
      })

      return {
        listings: riskPage.items,
        pagination: paginate({ total: riskPage.total, page, limit }),
      }
    }

    const result = await repository.getPendingListings({
      emulatorIds,
      search,
      page,
      limit,
      sortField,
      sortDirection,
    })

    const riskProfiles = await computeReviewRiskProfiles(ctx.prisma, result.listings)
    const paginatedListings = attachReviewRiskProfiles(result.listings, riskProfiles)

    return {
      listings: paginatedListings,
      pagination: result.pagination,
    }
  }),

  approve: protectedProcedure
    .input(ApproveListingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.listingId,
        reportType: 'handheld',
        newStatus: ApprovalStatus.APPROVED,
        intent: 'review',
        actor: ctx.session.user,
      }),
    ),

  reject: protectedProcedure
    .input(RejectListingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.listingId,
        reportType: 'handheld',
        newStatus: ApprovalStatus.REJECTED,
        intent: 'review',
        actor: ctx.session.user,
        notes: input.notes,
      }),
    ),

  resetToPending: moderatorProcedure
    .input(ResetListingToPendingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.listingId,
        reportType: 'handheld',
        newStatus: ApprovalStatus.PENDING,
        intent: 'reset',
        actor: ctx.session.user,
      }),
    ),

  getProcessed: superAdminProcedure.input(GetProcessedSchema).query(async ({ ctx, input }) => {
    const { page, limit, filterStatus, search, sortField, sortDirection } = input
    const skip = (page - 1) * limit

    const baseWhere: Prisma.ListingWhereInput = {
      NOT: { status: ApprovalStatus.PENDING },
      ...(filterStatus && { status: filterStatus }),
    }

    const searchWhere: Prisma.ListingWhereInput = search
      ? {
          OR: [
            { game: { title: { contains: search, mode } } },
            { game: { system: { name: { contains: search, mode } } } },
            { device: { modelName: { contains: search, mode } } },
            { device: { brand: { name: { contains: search, mode } } } },
            { emulator: { name: { contains: search, mode } } },
            { author: { name: { contains: search, mode } } },
            { processedNotes: { contains: search, mode } },
            { notes: { contains: search, mode } },
          ],
        }
      : {}

    const whereClause: Prisma.ListingWhereInput = {
      ...baseWhere,
      ...searchWhere,
    }

    const orderBy = buildProcessedOrderBy(sortField, sortDirection)

    const listings = await ctx.prisma.listing.findMany({
      where: whereClause,
      include: {
        game: { include: { system: true } },
        device: { include: { brand: true } },
        emulator: true,
        author: { select: { id: true, name: true } },
        performance: true,
        processedByUser: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: limit,
    })

    const totalListings = await ctx.prisma.listing.count({
      where: whereClause,
    })

    return {
      listings,
      pagination: paginate({ total: totalListings, page, limit }),
    }
  }),

  overrideStatus: superAdminProcedure
    .input(OverrideApprovalStatusSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.listingId,
        reportType: 'handheld',
        newStatus: input.newStatus,
        intent: 'override',
        actor: ctx.session.user,
        notes: input.overrideNotes,
      }),
    ),

  delete: deleteAnyListingProcedure.input(DeleteListingSchema).mutation(async ({ ctx, input }) => {
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.id },
      select: { id: true, game: { select: { title: true } } },
    })

    if (!listing) return ResourceError.listing.notFound()

    await ctx.prisma.listing.delete({ where: { id: input.id } })

    // Invalidate listing stats cache
    listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

    return { success: true, message: 'Listing deleted successfully' }
  }),

  bulkApprove: protectedProcedure
    .input(BulkApproveListingsSchema)
    .output(HandheldBulkApprovalResultSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await new ReportApprovalService(
        new ReportApprovalRepository(ctx.prisma),
      ).reviewPending({
        reportIds: input.listingIds,
        reportType: 'handheld',
        newStatus: ApprovalStatus.APPROVED,
        actor: ctx.session.user,
      })
      if (result.approvedCount + result.rejectedCount === 0)
        return AppError.badRequest(
          'No valid pending listings found to approve. The listings may have already been processed.',
        )
      return {
        success: true,
        ...result,
        message: `Successfully approved ${result.approvedCount} report(s).${result.rejectedCount > 0 ? ` ${result.rejectedCount} automatically rejected due to banned authors.` : ''}${result.skippedCount > 0 ? ` ${result.skippedCount} skipped because they were already processed.` : ''}`,
        hasReportedUsers: result.rejectedCount > 0,
      }
    }),

  bulkReject: protectedProcedure
    .input(BulkRejectListingsSchema)
    .output(HandheldBulkRejectionResultSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await new ReportApprovalService(
        new ReportApprovalRepository(ctx.prisma),
      ).reviewPending({
        reportIds: input.listingIds,
        reportType: 'handheld',
        newStatus: ApprovalStatus.REJECTED,
        actor: ctx.session.user,
        notes: input.notes,
      })
      if (result.rejectedCount === 0)
        return AppError.badRequest(
          'No valid pending listings found to reject. The listings may have already been processed.',
        )
      return {
        success: true,
        rejectedCount: result.rejectedCount,
        skippedCount: result.skippedCount,
        message: `Successfully rejected ${result.rejectedCount} report(s).${result.skippedCount > 0 ? ` ${result.skippedCount} skipped because they were already processed.` : ''}`,
      }
    }),

  autoRejectRiskyPreview: adminProcedure.query(async ({ ctx }) => {
    const repository = new ListingsRepository(ctx.prisma)

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

    return autoRejectRiskyHandheldReports({
      prisma: ctx.prisma,
      actor: ctx.session.user,
    })
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [pending, approved, rejected] = await Promise.all([
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.PENDING } }),
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.REJECTED } }),
    ])

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    }
  }),

  // Super admin procedures for listing management
  get: superAdminProcedure.input(GetAllListingsAdminSchema).query(async ({ ctx, input }) => {
    const {
      page,
      limit,
      sortField,
      sortDirection,
      search,
      statusFilter,
      systemFilter,
      emulatorFilter,
    } = input
    const skip = (page - 1) * limit

    const baseWhere: Prisma.ListingWhereInput = {
      ...(statusFilter && { status: statusFilter }),
      ...(systemFilter && { game: { systemId: systemFilter } }),
      ...(emulatorFilter && { emulatorId: emulatorFilter }),
    }

    const searchWhere: Prisma.ListingWhereInput = search
      ? {
          OR: [
            { game: { title: { contains: search, mode } } },
            { author: { name: { contains: search, mode } } },
            { notes: { contains: search, mode } },
          ],
        }
      : {}

    const whereClause: Prisma.ListingWhereInput = {
      ...baseWhere,
      ...searchWhere,
    }

    // Handle sorting
    let orderBy: Prisma.ListingOrderByWithRelationInput = {
      createdAt: 'desc',
    }
    if (sortField && sortDirection) {
      switch (sortField) {
        case 'game.title':
          orderBy = { game: { title: sortDirection } }
          break
        case 'game.system.name':
          orderBy = { game: { system: { name: sortDirection } } }
          break
        case 'device':
          orderBy = { device: { modelName: sortDirection } }
          break
        case 'emulator.name':
          orderBy = { emulator: { name: sortDirection } }
          break
        case 'performance.rank':
          orderBy = { performance: { rank: sortDirection } }
          break
        case 'author.name':
          orderBy = { author: { name: sortDirection } }
          break
        case 'status':
          orderBy = { status: sortDirection }
          break
        case 'createdAt':
          orderBy = { createdAt: sortDirection }
          break
      }
    }

    const listings = await ctx.prisma.listing.findMany({
      where: whereClause,
      include: {
        game: { include: { system: true } },
        device: { include: { brand: true, soc: true } },
        emulator: true,
        author: { select: { id: true, name: true } },
        performance: true,
      },
      orderBy,
      skip,
      take: limit,
    })

    const totalListings = await ctx.prisma.listing.count({
      where: whereClause,
    })

    const pagination = paginate({ total: totalListings, page, limit: limit })

    return {
      listings,
      pagination,
    }
  }),

  getForEdit: protectedProcedure.input(GetListingForEditSchema).query(async ({ ctx, input }) => {
    // Allow moderators and above to edit listings
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.listing.requiresModeratorToEdit()
    }
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.id },
      include: {
        game: { include: { system: true } },
        device: { include: { brand: true, soc: true } },
        emulator: {
          include: {
            customFieldDefinitions: {
              orderBy: [{ categoryId: 'asc' }, { categoryOrder: 'asc' }, { displayOrder: 'asc' }],
            },
          },
        },
        author: { select: { id: true, name: true } },
        performance: true,
        customFieldValues: {
          include: { customFieldDefinition: { include: { category: true } } },
        },
      },
    })

    return listing || ResourceError.listing.notFound()
  }),

  updateListing: protectedProcedure
    .input(UpdateListingAdminSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportAdminEditService(new ReportApprovalRepository(ctx.prisma)).updateHandheld(
        input,
        ctx.session.user,
      ),
    ),

  getListingConfig: protectedProcedure.input(GetListingByIdSchema).query(async ({ ctx, input }) => {
    // Check if user has admin permissions or is a verified developer for this emulator
    const isAdmin = hasRolePermission(ctx.session.user.role, Role.ADMIN)
    const isDeveloper = hasRolePermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isAdmin && !isDeveloper) {
      return ResourceError.listing.requiresAdminOrDeveloper()
    }

    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.id },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            system: { select: { id: true, name: true, key: true } },
          },
        },
        emulator: { select: { id: true, name: true } },
        customFieldValues: {
          include: {
            customFieldDefinition: {
              select: {
                id: true,
                name: true,
                label: true,
                type: true,
                options: true,
              },
            },
          },
        },
      },
    })

    if (!listing) {
      return ResourceError.listing.notFound()
    }

    // For developers, verify they can access this emulator's config
    if (isDeveloper && !isAdmin) {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: { userId: ctx.session.user.id, emulatorId: listing.emulatorId },
        },
      })

      if (!verifiedDeveloper) return ResourceError.listing.mustBeVerifiedToViewConfigs()
    }

    try {
      // Generate config using the emulator detector
      const configResult = generateEmulatorConfig({
        listingId: listing.id,
        gameId: listing.game.id,
        emulatorName: listing.emulator.name,
        customFieldValues: listing.customFieldValues.map((cfv) => ({
          customFieldDefinition: cfv.customFieldDefinition,
          value: cfv.value,
        })),
      })

      return {
        type: configResult.type,
        filename: configResult.filename,
        content: configResult.serialized,
        listing: {
          id: listing.id,
          game: listing.game.title,
          system: listing.game.system.name,
          emulator: listing.emulator.name,
        },
      }
    } catch (error) {
      console.error('Error generating config:', error)
      return AppError.internalError(
        `Failed to generate config: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }),
})
