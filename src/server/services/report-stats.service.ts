import { batchQueries } from '@/server/utils/query-performance'
import type { PrismaClient } from '@orm'

interface AuthorReportCounts {
  totalReports: number
  reportedListingsCount: number
  hasReports: boolean
}

/**
 * Counts all reports (any status) against a user's listings,
 * including both handheld and PC listing reports.
 */
export async function getAuthorReportCounts(
  prisma: PrismaClient,
  userId: string,
): Promise<AuthorReportCounts> {
  const [handheldReports, pcReports, handheldListingsReported, pcListingsReported] =
    await batchQueries([
      prisma.listingReport.count({ where: { listing: { authorId: userId } } }),
      prisma.pcListingReport.count({ where: { pcListing: { authorId: userId } } }),
      prisma.listing.count({ where: { authorId: userId, reports: { some: {} } } }),
      prisma.pcListing.count({ where: { authorId: userId, reports: { some: {} } } }),
    ])

  const totalReports = handheldReports + pcReports

  return {
    totalReports,
    reportedListingsCount: handheldListingsReported + pcListingsReported,
    hasReports: totalReports > 0,
  }
}
