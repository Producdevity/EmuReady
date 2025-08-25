import { ActivityQuerySchema, DashboardQuerySchema } from '@/schemas/activity'
import { createTRPCRouter, moderatorProcedure, protectedProcedure } from '@/server/api/trpc'
import { ActivityService } from '@/server/services/activity.service'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'

export const activityRouter = createTRPCRouter({
  /**
   * Get recent users (MODERATOR+)
   */
  recentUsers: moderatorProcedure.input(ActivityQuerySchema).query(async ({ ctx, input }) => {
    const service = new ActivityService(ctx.prisma)
    return service.getRecentUsers(input.timeRange, input.limit, ctx.session.user.role)
  }),

  /**
   * Get recent listings - accessible to all logged in users, filtered by role
   */
  recentListings: protectedProcedure.input(ActivityQuerySchema).query(async ({ ctx, input }) => {
    const service = new ActivityService(ctx.prisma)
    return service.getRecentListings(
      input.timeRange,
      input.limit,
      ctx.session.user.role,
      ctx.session.user.id,
    )
  }),

  /**
   * Get recent comments - accessible to all logged in users, filtered by role
   */
  recentComments: protectedProcedure.input(ActivityQuerySchema).query(async ({ ctx, input }) => {
    const service = new ActivityService(ctx.prisma)
    return service.getRecentComments(
      input.timeRange,
      input.limit,
      ctx.session.user.role,
      ctx.session.user.id,
    )
  }),

  /**
   * Get recent reports (MODERATOR+)
   */
  recentReports: moderatorProcedure.input(ActivityQuerySchema).query(async ({ ctx, input }) => {
    const service = new ActivityService(ctx.prisma)
    return service.getRecentReports(input.timeRange, input.limit, ctx.session.user.role)
  }),

  /**
   * Get recent bans (MODERATOR+)
   */
  recentBans: moderatorProcedure.input(ActivityQuerySchema).query(async ({ ctx, input }) => {
    const service = new ActivityService(ctx.prisma)
    return service.getRecentBans(input.timeRange, input.limit, ctx.session.user.role)
  }),

  /**
   * Get critical actions - accessible to all logged in users, filtered by role
   */
  criticalActions: protectedProcedure.query(async ({ ctx }) => {
    const service = new ActivityService(ctx.prisma)
    return service.getCriticalActions(ctx.session.user.role, ctx.session.user.id)
  }),

  /**
   * Get platform statistics - accessible to all logged in users
   */
  platformStats: protectedProcedure
    .input(ActivityQuerySchema.pick({ timeRange: true }))
    .query(async ({ ctx, input }) => {
      const service = new ActivityService(ctx.prisma)
      return service.getPlatformStats(input.timeRange)
    }),

  /**
   * Get all activity data for dashboard - accessible to all logged in users, data filtered by role
   */
  dashboard: protectedProcedure.input(DashboardQuerySchema).query(async ({ ctx, input }) => {
    const service = new ActivityService(ctx.prisma)
    const { user } = ctx.session

    // Check what the user can see based on role
    const canSeeUsers = roleIncludesRole(user.role, Role.MODERATOR)
    const canSeeReports = roleIncludesRole(user.role, Role.MODERATOR)
    const canSeeBans = roleIncludesRole(user.role, Role.MODERATOR)

    // Fetch all data in parallel
    const [
      criticalActions,
      recentUsers,
      recentListings,
      recentComments,
      recentReports,
      recentBans,
      platformStats,
    ] = await Promise.all([
      service.getCriticalActions(user.role, user.id),
      canSeeUsers
        ? service.getRecentUsers(input.usersTimeRange, 5, user.role)
        : Promise.resolve([]),
      service.getRecentListings(input.listingsTimeRange, 5, user.role, user.id),
      service.getRecentComments(input.commentsTimeRange, 5, user.role, user.id),
      canSeeReports
        ? service.getRecentReports(input.reportsTimeRange, 5, user.role)
        : Promise.resolve([]),
      canSeeBans ? service.getRecentBans(input.bansTimeRange, 5, user.role) : Promise.resolve([]),
      service.getPlatformStats(input.statsTimeRange),
    ])

    return {
      criticalActions,
      recentUsers,
      recentListings,
      recentComments,
      recentReports,
      recentBans,
      platformStats,
      permissions: {
        canSeeUsers,
        canSeeReports,
        canSeeBans,
      },
    }
  }),
})
