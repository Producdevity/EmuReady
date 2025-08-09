import { AppError, ResourceError } from '@/lib/errors'
import { CreateListingReportSchema, GetUserReportStatsSchema } from '@/schemas/listingReport'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { userIdNameSelect, gameTitleSelect } from '@/server/utils/selects'
import { ReportStatus } from '@orm'

export const mobileListingReportsRouter = createMobileTRPCRouter({
  /**
   * Create a new listing report (user-facing)
   */
  create: mobileProtectedProcedure
    .input(CreateListingReportSchema)
    .mutation(async ({ ctx, input }) => {
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
        return AppError.badRequest('You cannot report your own listing')
      }

      // Check if user already reported this listing
      const existingReport = await ctx.prisma.listingReport.findUnique({
        where: { listingId_reportedById: { listingId, reportedById: userId } },
      })

      if (existingReport) {
        return AppError.badRequest('You have already reported this listing')
      }

      const report = await ctx.prisma.listingReport.create({
        data: { listingId, reportedById: userId, reason, description },
        include: {
          listing: {
            include: {
              game: { select: gameTitleSelect },
              author: { select: userIdNameSelect },
            },
          },
        },
      })

      return {
        id: report.id,
        success: true,
        message: 'Report submitted successfully',
      }
    }),

  /**
   * Check if a user has reports (for showing warnings)
   */
  checkUserHasReports: mobilePublicProcedure
    .input(GetUserReportStatsSchema)
    .query(async ({ ctx, input }) => {
      const reportCount = await ctx.prisma.listingReport.count({
        where: {
          listing: { authorId: input.userId },
          status: { in: [ReportStatus.RESOLVED, ReportStatus.UNDER_REVIEW] },
        },
      })

      return {
        hasReports: reportCount > 0,
        reportCount,
      }
    }),
})
