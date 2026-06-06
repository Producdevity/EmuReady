import { AppError, ResourceError } from '@/lib/errors'
import { CreateListingReportSchema, GetUserReportStatsSchema } from '@/schemas/listingReport'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { emitReportCreatedNotification } from '@/server/notifications/reportEvents'
import { getAuthorReportCounts } from '@/server/services/report-stats.service'
import { sanitizeInput } from '@/server/utils/security-validation'

export const mobileListingReportsRouter = createMobileTRPCRouter({
  create: mobileProtectedProcedure
    .input(CreateListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, reason, description } = input
      const userId = ctx.session.user.id
      const sanitizedDescription = description ? sanitizeInput(description) : description

      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
        include: { author: true },
      })

      if (!listing) return ResourceError.listing.notFound()

      if (listing.authorId === userId) {
        return AppError.badRequest('You cannot report your own listing')
      }

      const existingReport = await ctx.prisma.listingReport.findUnique({
        where: { listingId_reportedById: { listingId, reportedById: userId } },
      })

      if (existingReport) {
        return AppError.badRequest('You have already reported this listing')
      }

      const report = await ctx.prisma.listingReport.create({
        data: { listingId, reportedById: userId, reason, description: sanitizedDescription },
        include: {
          listing: {
            include: {
              game: { select: { title: true } },
              author: { select: { name: true } },
            },
          },
        },
      })

      emitReportCreatedNotification({
        type: 'listing',
        reportId: report.id,
        listingId,
        reportedById: userId,
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
      const { totalReports, hasReports } = await getAuthorReportCounts(ctx.prisma, input.userId)

      return {
        hasReports,
        reportCount: totalReports,
      }
    }),
})
