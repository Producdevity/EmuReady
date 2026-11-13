import { ReportAdminEditService } from '@/features/reports/approval/server/report-admin-edit.service'
import { ReportApprovalRepository } from '@/features/reports/approval/server/report-approval.repository'
import { ReportApprovalService } from '@/features/reports/approval/server/report-approval.service'
import {
  ReportApprovalResultSchema,
  PcBulkApprovalResultSchema,
} from '@/features/reports/approval/shared/report-approval.schemas'
import { ResourceError } from '@/lib/errors'
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
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
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
import { ApprovalStatus, Role } from '@orm'
import { type Prisma } from '@orm/client'
import { PC_LISTING_STATS_CACHE_KEY } from './utils'

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

  approve: protectedProcedure
    .input(ApprovePcListingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.pcListingId,
        reportType: 'pc',
        newStatus: ApprovalStatus.APPROVED,
        intent: 'review',
        actor: ctx.session.user,
      }),
    ),

  reject: protectedProcedure
    .input(RejectPcListingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.pcListingId,
        reportType: 'pc',
        newStatus: ApprovalStatus.REJECTED,
        intent: 'review',
        actor: ctx.session.user,
        notes: input.notes,
      }),
    ),

  resetToPending: moderatorProcedure
    .input(ResetPcListingToPendingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.pcListingId,
        reportType: 'pc',
        newStatus: ApprovalStatus.PENDING,
        intent: 'reset',
        actor: ctx.session.user,
      }),
    ),

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
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.pcListingId,
        reportType: 'pc',
        newStatus: input.newStatus,
        intent: 'override',
        actor: ctx.session.user,
        notes: input.overrideNotes,
      }),
    ),

  bulkApprove: protectedProcedure
    .input(BulkApprovePcListingsSchema)
    .output(PcBulkApprovalResultSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await new ReportApprovalService(
        new ReportApprovalRepository(ctx.prisma),
      ).reviewPending({
        reportIds: input.pcListingIds,
        reportType: 'pc',
        newStatus: ApprovalStatus.APPROVED,
        actor: ctx.session.user,
      })
      return { count: result.approvedCount }
    }),

  bulkReject: protectedProcedure
    .input(BulkRejectPcListingsSchema)
    .output(PcBulkApprovalResultSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await new ReportApprovalService(
        new ReportApprovalRepository(ctx.prisma),
      ).reviewPending({
        reportIds: input.pcListingIds,
        reportType: 'pc',
        newStatus: ApprovalStatus.REJECTED,
        actor: ctx.session.user,
        notes: input.notes,
      })
      return { count: result.rejectedCount }
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
      actor: ctx.session.user,
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
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportAdminEditService(new ReportApprovalRepository(ctx.prisma)).updatePc(
        input,
        ctx.session.user,
      ),
    ),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const cached = listingStatsCache.get(PC_LISTING_STATS_CACHE_KEY)
    if (cached) return cached

    const repository = new PcListingsRepository(ctx.prisma)
    const stats = await repository.stats()

    listingStatsCache.set(PC_LISTING_STATS_CACHE_KEY, stats)
    return stats
  }),
})
