import { CreateListingReportSchema, GetUserReportStatsSchema } from '@/schemas/listingReport'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { getAuthorReportCounts } from '@/server/services/report-stats.service'
import { ReportSubmissionService } from '@/server/services/report-submission.service'

export const mobileListingReportsRouter = createMobileTRPCRouter({
  create: mobileProtectedProcedure
    .input(CreateListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, reason, description } = input
      const userId = ctx.session.user.id

      const reportSubmissionService = new ReportSubmissionService(ctx.prisma)
      const report = await reportSubmissionService.createListingReport({
        listingId,
        reportedById: userId,
        reason,
        description,
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
