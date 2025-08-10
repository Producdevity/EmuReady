import { AppError, ResourceError } from '@/lib/errors'
import { applyTrustAction } from '@/lib/trust/service'
import {
  MobileAdminApproveGameSchema,
  MobileAdminApproveListingSchema,
  MobileAdminCreateUserBanSchema,
  MobileAdminGetPendingGamesSchema,
  MobileAdminGetPendingListingsSchema,
  MobileAdminGetReportsSchema,
  MobileAdminGetStatsSchema,
  MobileAdminGetUserBansSchema,
  MobileAdminRejectGameSchema,
  MobileAdminRejectListingSchema,
  MobileAdminUpdateReportStatusSchema,
  MobileAdminUpdateUserBanSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileAdminProcedure,
  mobileApproveGamesProcedure,
  mobileApproveListingsProcedure,
  mobileManageUsersProcedure,
  mobileViewStatisticsProcedure,
} from '@/server/api/mobileContext'
import { listingStatsCache } from '@/server/utils/cache/instances'
import { calculateOffset, createPaginationResult } from '@/server/utils/pagination'
import { buildSearchFilter } from '@/server/utils/query-builders'
import { createCountQuery } from '@/server/utils/query-performance'
import {
  userSelect,
  userIdNameSelect,
  systemBasicSelect,
  gameTitleSelect,
  emulatorBasicSelect,
  brandBasicSelect,
} from '@/server/utils/selects'
import { ApprovalStatus, Prisma, ReportStatus, TrustAction } from '@orm'

const LISTING_STATS_CACHE_KEY = 'listing-stats'
const mode = Prisma.QueryMode.insensitive

export const mobileAdminRouter = createMobileTRPCRouter({
  /**
   * Get overall admin statistics
   */
  getStats: mobileViewStatisticsProcedure
    .input(MobileAdminGetStatsSchema)
    .query(async ({ ctx }) => {
      const [
        pendingListings,
        approvedListings,
        rejectedListings,
        pendingGames,
        approvedGames,
        rejectedGames,
        pendingReports,
        resolvedReports,
        activeUsers,
        bannedUsers,
      ] = await Promise.all([
        createCountQuery(ctx.prisma.listing, {
          status: ApprovalStatus.PENDING,
        }),
        createCountQuery(ctx.prisma.listing, {
          status: ApprovalStatus.APPROVED,
        }),
        createCountQuery(ctx.prisma.listing, {
          status: ApprovalStatus.REJECTED,
        }),
        createCountQuery(ctx.prisma.game, { status: ApprovalStatus.PENDING }),
        createCountQuery(ctx.prisma.game, { status: ApprovalStatus.APPROVED }),
        createCountQuery(ctx.prisma.game, { status: ApprovalStatus.REJECTED }),
        createCountQuery(ctx.prisma.listingReport, {
          status: ReportStatus.PENDING,
        }),
        createCountQuery(ctx.prisma.listingReport, {
          status: ReportStatus.RESOLVED,
        }),
        createCountQuery(ctx.prisma.user, {}),
        createCountQuery(ctx.prisma.userBan, { isActive: true }),
      ])

      return {
        listings: {
          pending: pendingListings,
          approved: approvedListings,
          rejected: rejectedListings,
          total: pendingListings + approvedListings + rejectedListings,
        },
        games: {
          pending: pendingGames,
          approved: approvedGames,
          rejected: rejectedGames,
          total: pendingGames + approvedGames + rejectedGames,
        },
        reports: {
          pending: pendingReports,
          resolved: resolvedReports,
          total: pendingReports + resolvedReports,
        },
        users: {
          active: activeUsers - bannedUsers,
          banned: bannedUsers,
          total: activeUsers,
        },
      }
    }),

  /**
   * Get pending listings for approval
   */
  getPendingListings: mobileApproveListingsProcedure
    .input(MobileAdminGetPendingListingsSchema)
    .query(async ({ ctx, input }) => {
      const { search, page = 1, limit = 20 } = input ?? {}
      const skip = calculateOffset({ page }, limit)

      // Build where clause for search
      let where: Prisma.ListingWhereInput = { status: ApprovalStatus.PENDING }

      if (search && search.trim() !== '') {
        where = {
          ...where,
          OR: [
            { game: { title: { contains: search, mode } } },
            { device: { modelName: { contains: search, mode } } },
            { emulator: { name: { contains: search, mode } } },
            { author: { name: { contains: search, mode } } },
          ],
        }
      }

      const listings = await ctx.prisma.listing.findMany({
        where,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
          emulator: true,
          author: { select: userSelect(['id', 'name', 'email']) },
          performance: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })

      const totalListings = await ctx.prisma.listing.count({ where })

      return {
        listings,
        pagination: createPaginationResult(totalListings, { page }, limit, skip),
      }
    }),

  /**
   * Approve a listing
   */
  approveListing: mobileApproveListingsProcedure
    .input(MobileAdminApproveListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId } = input
      const adminUserId = ctx.session.user.id

      const listingToApprove = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          author: {
            select: {
              id: true,
              userBans: {
                where: {
                  isActive: true,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                select: { reason: true },
              },
            },
          },
        },
      })

      if (!listingToApprove || listingToApprove.status !== ApprovalStatus.PENDING) {
        return ResourceError.listing.notPending()
      }

      // Auto-reject if user is banned
      if (listingToApprove.author.userBans.length > 0) {
        const banReason = listingToApprove.author.userBans[0].reason
        await ctx.prisma.listing.update({
          where: { id: listingId },
          data: {
            status: ApprovalStatus.REJECTED,
            processedByUserId: adminUserId,
            processedAt: new Date(),
            processedNotes: `Automatically rejected: User is currently banned (${banReason})`,
          },
        })

        AppError.badRequest(`Cannot approve listing: Author is currently banned (${banReason})`)
      }

      const updatedListing = await ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ApprovalStatus.APPROVED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: null,
        },
      })

      // Apply trust action for listing approval to the author
      if (listingToApprove.authorId) {
        await applyTrustAction({
          userId: listingToApprove.authorId,
          action: TrustAction.LISTING_APPROVED,
          context: {
            listingId,
            adminUserId,
            reason: 'listing_approved',
          },
        })
      }

      // Invalidate listing stats cache
      listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

      return updatedListing
    }),

  /**
   * Reject a listing
   */
  rejectListing: mobileApproveListingsProcedure
    .input(MobileAdminRejectListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, notes } = input
      const adminUserId = ctx.session.user.id

      const listingToReject = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
        include: { author: { select: userSelect(['id']) } },
      })

      if (!listingToReject || listingToReject.status !== ApprovalStatus.PENDING) {
        return ResourceError.listing.notPending()
      }

      const updatedListing = await ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ApprovalStatus.REJECTED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: notes,
        },
      })

      // Apply trust action for listing rejection to the author
      if (listingToReject.authorId) {
        await applyTrustAction({
          userId: listingToReject.authorId,
          action: TrustAction.LISTING_REJECTED,
          context: {
            listingId,
            adminUserId,
            reason: notes || 'listing_rejected',
          },
        })
      }

      // Invalidate listing stats cache
      listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

      return updatedListing
    }),

  /**
   * Get pending games for approval
   */
  getPendingGames: mobileApproveGamesProcedure
    .input(MobileAdminGetPendingGamesSchema)
    .query(async ({ ctx, input }) => {
      const { search, page = 1, limit = 20 } = input ?? {}
      const skip = calculateOffset({ page }, limit)

      const where: Prisma.GameWhereInput = {
        status: ApprovalStatus.PENDING,
      }

      const searchConditions = buildSearchFilter(search, ['title', 'system.name'])
      if (searchConditions) {
        where.OR = searchConditions
      }

      const [total, games] = await Promise.all([
        createCountQuery(ctx.prisma.game, where),
        ctx.prisma.game.findMany({
          where,
          select: {
            id: true,
            title: true,
            imageUrl: true,
            isErotic: true,
            status: true,
            submittedAt: true,
            system: { select: systemBasicSelect },
            submitter: { select: userSelect(['id', 'name', 'email']) },
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      return {
        games,
        pagination: createPaginationResult(total, { page }, limit, skip),
      }
    }),

  /**
   * Approve a game
   */
  approveGame: mobileApproveGamesProcedure
    .input(MobileAdminApproveGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameId } = input
      const adminUserId = ctx.session.user.id

      const game = await ctx.prisma.game.findUnique({ where: { id: gameId } })

      if (!game) return ResourceError.game.notFound()

      if (game.status !== ApprovalStatus.PENDING) {
        return ResourceError.game.alreadyProcessed()
      }

      return await ctx.prisma.game.update({
        where: { id: gameId },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedBy: adminUserId,
          approvedAt: new Date(),
        },
        include: {
          system: true,
          submitter: { select: userSelect(['id', 'name', 'email']) },
        },
      })
    }),

  /**
   * Reject a game
   */
  rejectGame: mobileApproveGamesProcedure
    .input(MobileAdminRejectGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameId } = input
      const adminUserId = ctx.session.user.id

      const game = await ctx.prisma.game.findUnique({ where: { id: gameId } })

      if (!game) return ResourceError.game.notFound()

      if (game.status !== ApprovalStatus.PENDING) {
        return ResourceError.game.alreadyProcessed()
      }

      return await ctx.prisma.game.update({
        where: { id: gameId },
        data: {
          status: ApprovalStatus.REJECTED,
          approvedBy: adminUserId,
          approvedAt: new Date(),
          // TODO: Add rejectionNotes field to schema
        },
        include: {
          system: true,
          submitter: { select: userSelect(['id', 'name', 'email']) },
        },
      })
    }),

  /**
   * Get user reports
   */
  getReports: mobileAdminProcedure
    .input(MobileAdminGetReportsSchema)
    .query(async ({ ctx, input }) => {
      const { status, page = 1, limit = 20 } = input ?? {}
      const skip = calculateOffset({ page }, limit)

      const where: Prisma.ListingReportWhereInput = {
        ...(status && { status }),
      }

      const [total, reports] = await Promise.all([
        createCountQuery(ctx.prisma.listingReport, where),
        ctx.prisma.listingReport.findMany({
          where,
          include: {
            listing: {
              include: {
                game: { select: gameTitleSelect },
                device: { include: { brand: { select: brandBasicSelect } } },
                emulator: { select: emulatorBasicSelect },
                author: { select: userIdNameSelect },
              },
            },
            reportedBy: { select: userIdNameSelect },
            reviewedBy: { select: userIdNameSelect },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      return {
        reports,
        pagination: createPaginationResult(total, { page }, limit, skip),
      }
    }),

  /**
   * Update report status
   */
  updateReportStatus: mobileAdminProcedure
    .input(MobileAdminUpdateReportStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { reportId, status, notes } = input
      const adminUserId = ctx.session.user.id

      const report = await ctx.prisma.listingReport.findUnique({
        where: { id: reportId },
      })

      if (!report) return ResourceError.listingReport.notFound()

      return await ctx.prisma.listingReport.update({
        where: { id: reportId },
        data: {
          status,
          reviewedById: adminUserId,
          reviewNotes: notes,
          reviewedAt: new Date(),
        },
        include: {
          listing: { select: { id: true } },
          reportedBy: { select: userIdNameSelect },
          reviewedBy: { select: userIdNameSelect },
        },
      })
    }),

  /**
   * Get user bans
   */
  getUserBans: mobileManageUsersProcedure
    .input(MobileAdminGetUserBansSchema)
    .query(async ({ ctx, input }) => {
      const { isActive, page = 1, limit = 20 } = input ?? {}
      const skip = calculateOffset({ page }, limit)

      const where: Prisma.UserBanWhereInput = {
        ...(isActive !== undefined && { isActive }),
      }

      const [total, bans] = await Promise.all([
        createCountQuery(ctx.prisma.userBan, where),
        ctx.prisma.userBan.findMany({
          where,
          include: {
            user: { select: userSelect(['id', 'name', 'email']) },
            bannedBy: { select: userIdNameSelect },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      return {
        bans,
        pagination: createPaginationResult(total, { page }, limit, skip),
      }
    }),

  /**
   * Create a user ban
   */
  createUserBan: mobileManageUsersProcedure
    .input(MobileAdminCreateUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, reason, expiresAt } = input
      const adminUserId = ctx.session.user.id

      // Check if user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: userSelect(['id']),
      })

      if (!user) return ResourceError.user.notFound()

      // Check for existing active ban
      const existingBan = await ctx.prisma.userBan.findFirst({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })

      if (existingBan) return ResourceError.userBan.alreadyBanned()

      return await ctx.prisma.userBan.create({
        data: {
          userId,
          reason,
          bannedById: adminUserId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
        include: {
          user: { select: userSelect(['id', 'name', 'email']) },
          bannedBy: { select: userIdNameSelect },
        },
      })
    }),

  /**
   * Update a user ban
   */
  updateUserBan: mobileManageUsersProcedure
    .input(MobileAdminUpdateUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      const { banId, isActive, expiresAt } = input

      const ban = await ctx.prisma.userBan.findUnique({
        where: { id: banId },
      })

      if (!ban) return ResourceError.userBan.notFound()

      return await ctx.prisma.userBan.update({
        where: { id: banId },
        data: {
          isActive,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
        include: {
          user: { select: userSelect(['id', 'name', 'email']) },
          bannedBy: { select: userIdNameSelect },
        },
      })
    }),
})
