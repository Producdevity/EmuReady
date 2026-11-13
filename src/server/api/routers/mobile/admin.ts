import { ReportApprovalRepository } from '@/features/reports/approval/server/report-approval.repository'
import { ReportApprovalService } from '@/features/reports/approval/server/report-approval.service'
import { ReportApprovalResultSchema } from '@/features/reports/approval/shared/report-approval.schemas'
import { ResourceError, AppError } from '@/lib/errors'
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
import { logAudit } from '@/server/services/audit.service'
import { paginate } from '@/server/utils/pagination'
import { buildSearchFilter } from '@/server/utils/query-builders'
import { canBanUser } from '@/utils/permission-system'
import { ApprovalStatus, Prisma, ReportStatus, AuditAction, AuditEntityType } from '@orm/client'

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
        ctx.prisma.listing.count({ where: { status: ApprovalStatus.PENDING } }),
        ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
        ctx.prisma.listing.count({ where: { status: ApprovalStatus.REJECTED } }),
        ctx.prisma.game.count({ where: { status: ApprovalStatus.PENDING } }),
        ctx.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
        ctx.prisma.game.count({ where: { status: ApprovalStatus.REJECTED } }),
        ctx.prisma.listingReport.count({ where: { status: ReportStatus.PENDING } }),
        ctx.prisma.listingReport.count({ where: { status: ReportStatus.RESOLVED } }),
        ctx.prisma.user.count(),
        ctx.prisma.userBan.count({ where: { isActive: true } }),
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
      const skip = (page - 1) * limit

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
          author: { select: { id: true, name: true, email: true } },
          performance: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })

      const totalListings = await ctx.prisma.listing.count({ where })

      return {
        listings,
        pagination: paginate({ total: totalListings, page, limit: limit }),
      }
    }),

  /**
   * Approve a listing
   */
  approveListing: mobileApproveListingsProcedure
    .input(MobileAdminApproveListingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.listingId,
        reportType: 'handheld',
        newStatus: ApprovalStatus.APPROVED,
        intent: 'permission-review',
        actor: ctx.session.user,
      }),
    ),

  /**
   * Reject a listing
   */
  rejectListing: mobileApproveListingsProcedure
    .input(MobileAdminRejectListingSchema)
    .output(ReportApprovalResultSchema)
    .mutation(({ ctx, input }) =>
      new ReportApprovalService(new ReportApprovalRepository(ctx.prisma)).changeStatus({
        reportId: input.listingId,
        reportType: 'handheld',
        newStatus: ApprovalStatus.REJECTED,
        intent: 'permission-review',
        actor: ctx.session.user,
        notes: input.notes,
      }),
    ),

  /**
   * Get pending games for approval
   */
  getPendingGames: mobileApproveGamesProcedure
    .input(MobileAdminGetPendingGamesSchema)
    .query(async ({ ctx, input }) => {
      const { search, page = 1, limit = 20 } = input ?? {}
      const skip = (page - 1) * limit

      const where: Prisma.GameWhereInput = { status: ApprovalStatus.PENDING }

      const searchConditions = buildSearchFilter(search, ['title', 'system.name'])
      if (searchConditions) where.OR = searchConditions

      const [total, games] = await Promise.all([
        ctx.prisma.game.count({ where }),
        ctx.prisma.game.findMany({
          where,
          select: {
            id: true,
            title: true,
            imageUrl: true,
            isErotic: true,
            status: true,
            submittedAt: true,
            system: { select: { id: true, name: true } },
            submitter: { select: { id: true, name: true, email: true } },
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      return {
        games,
        pagination: paginate({ total, page, limit }),
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

      if (game.status !== ApprovalStatus.PENDING) return ResourceError.game.alreadyProcessed()

      return await ctx.prisma.game.update({
        where: { id: gameId },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedBy: adminUserId,
          approvedAt: new Date(),
        },
        include: {
          system: true,
          submitter: { select: { id: true, name: true, email: true } },
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

      if (game.status !== ApprovalStatus.PENDING) return ResourceError.game.alreadyProcessed()

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
          submitter: { select: { id: true, name: true, email: true } },
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
      const skip = (page - 1) * limit

      const where: Prisma.ListingReportWhereInput = { ...(status && { status }) }

      const [total, reports] = await Promise.all([
        ctx.prisma.listingReport.count({ where }),
        ctx.prisma.listingReport.findMany({
          where,
          include: {
            listing: {
              include: {
                game: { select: { title: true } },
                device: { include: { brand: { select: { name: true } } } },
                emulator: { select: { name: true } },
                author: { select: { id: true, name: true } },
              },
            },
            reportedBy: { select: { id: true, name: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      return {
        reports,
        pagination: paginate({ total, page, limit }),
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
          reportedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
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
      const skip = (page - 1) * limit

      const where: Prisma.UserBanWhereInput = {
        ...(isActive !== undefined && { isActive }),
      }

      const [total, bans] = await Promise.all([
        ctx.prisma.userBan.count({ where }),
        ctx.prisma.userBan.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            bannedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      return {
        bans,
        pagination: paginate({ total: total, page, limit: limit }),
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
        select: { id: true },
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

      // Role hierarchy check
      const target = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (!target) return ResourceError.user.notFound()
      if (!canBanUser(ctx.session.user.role, target.role)) {
        return ResourceError.userBan.cannotBanHigherRole()
      }

      // expiresAt must be in the future if present
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        return AppError.badRequest('Expiration date must be in the future')
      }

      const created = await ctx.prisma.userBan.create({
        data: {
          userId,
          reason,
          bannedById: adminUserId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          bannedBy: { select: { id: true, name: true } },
        },
      })
      void logAudit(ctx.prisma, {
        actorId: adminUserId,
        action: AuditAction.BAN,
        entityType: AuditEntityType.USER_BAN,
        entityId: created.id,
        targetUserId: userId,
        metadata: { reason, expiresAt },
        headers: ctx.headers,
      })
      return created
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
        include: { user: { select: { role: true } } },
      })

      if (!ban) return ResourceError.userBan.notFound()

      // Hierarchy check
      if (!canBanUser(ctx.session.user.role, ban.user.role)) {
        return ResourceError.userBan.insufficientPermissions()
      }

      // Disallow status change via update
      if (typeof isActive !== 'undefined') {
        return AppError.operationNotAllowed('Use lift endpoint to change ban status')
      }

      if (expiresAt && new Date(expiresAt) <= new Date()) {
        return AppError.badRequest('Expiration date must be in the future')
      }

      const updated = await ctx.prisma.userBan.update({
        where: { id: banId },
        data: {
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          bannedBy: { select: { id: true, name: true } },
        },
      })
      void logAudit(ctx.prisma, {
        actorId: ctx.session.user.id,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.USER_BAN,
        entityId: banId,
        targetUserId: updated.user.id,
        metadata: { fieldsUpdated: ['expiresAt'] },
        headers: ctx.headers,
      })
      return updated
    }),
})
