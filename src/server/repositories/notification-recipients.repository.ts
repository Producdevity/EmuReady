import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import type { ListingType } from '@/schemas/common'
import type { Prisma } from '@orm'

const REPORT_AUTHOR_SELECT = {
  authorId: true,
} satisfies Prisma.ListingSelect & Prisma.PcListingSelect

export class NotificationRecipientsRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  async findReportAuthor(reportType: ListingType, reportId: string): Promise<string | null> {
    const report =
      reportType === 'pc'
        ? await this.prisma.pcListing.findUnique({
            where: { id: reportId },
            select: REPORT_AUTHOR_SELECT,
          })
        : await this.prisma.listing.findUnique({
            where: { id: reportId },
            select: REPORT_AUTHOR_SELECT,
          })
    return report?.authorId ?? null
  }
}
