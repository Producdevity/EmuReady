import { AppError, ResourceError } from '@/lib/errors'
import { emitReportCreatedNotification } from '@/server/notifications/reportEvents'
import { sanitizeInput } from '@/server/utils/security-validation'
import { type PrismaClient, type ReportReason } from '@orm/client'

type CreateListingReportInput = {
  listingId: string
  reason: ReportReason
  description?: string
  reportedById: string
}

type CreatePcListingReportInput = {
  pcListingId: string
  reason: ReportReason
  description?: string
  reportedById: string
}

function sanitizeOptionalDescription(description: string | undefined): string | undefined {
  return description ? sanitizeInput(description) : description
}

export class ReportSubmissionService {
  constructor(private readonly prisma: PrismaClient) {}

  async createListingReport(input: CreateListingReportInput) {
    const sanitizedDescription = sanitizeOptionalDescription(input.description)

    const listing = await this.prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { authorId: true },
    })

    if (!listing) return ResourceError.listing.notFound()

    if (listing.authorId === input.reportedById) {
      return ResourceError.listingReport.cannotReportOwnListing()
    }

    const existingReport = await this.prisma.listingReport.findUnique({
      where: {
        listingId_reportedById: {
          listingId: input.listingId,
          reportedById: input.reportedById,
        },
      },
    })

    if (existingReport) return ResourceError.listingReport.alreadyExists()

    const report = await this.prisma.listingReport.create({
      data: {
        listingId: input.listingId,
        reportedById: input.reportedById,
        reason: input.reason,
        description: sanitizedDescription,
      },
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
      listingId: input.listingId,
      reportedById: input.reportedById,
    })

    return report
  }

  async createPcListingReport(input: CreatePcListingReportInput) {
    const sanitizedDescription = sanitizeOptionalDescription(input.description)

    const pcListing = await this.prisma.pcListing.findUnique({
      where: { id: input.pcListingId },
      select: { authorId: true },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.authorId === input.reportedById) {
      return AppError.forbidden('You cannot report your own listing')
    }

    const existingReport = await this.prisma.pcListingReport.findUnique({
      where: {
        pcListingId_reportedById: {
          pcListingId: input.pcListingId,
          reportedById: input.reportedById,
        },
      },
    })

    if (existingReport) return AppError.conflict('You have already reported this listing')

    const report = await this.prisma.pcListingReport.create({
      data: {
        pcListingId: input.pcListingId,
        reportedById: input.reportedById,
        reason: input.reason,
        description: sanitizedDescription,
      },
      include: {
        pcListing: {
          include: {
            game: { select: { title: true } },
            author: { select: { name: true } },
          },
        },
      },
    })

    emitReportCreatedNotification({
      type: 'pcListing',
      reportId: report.id,
      pcListingId: input.pcListingId,
      reportedById: input.reportedById,
    })

    return report
  }
}
