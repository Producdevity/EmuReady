import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { ApprovalStatus, type Prisma, type ReportStatus } from '@orm/client'

const LISTING_REPORT_MODERATION_SELECT = {
  id: true,
  listingId: true,
  reportedById: true,
  reason: true,
  status: true,
  listing: { select: { status: true } },
} satisfies Prisma.ListingReportSelect

const PC_LISTING_REPORT_MODERATION_SELECT = {
  id: true,
  pcListingId: true,
  reportedById: true,
  reason: true,
  status: true,
  pcListing: { select: { status: true } },
} satisfies Prisma.PcListingReportSelect

const LISTING_REPORT_STATUS_RESULT_INCLUDE = {
  listing: {
    include: {
      game: { select: { title: true } },
      author: { select: { name: true } },
    },
  },
  reportedBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
} satisfies Prisma.ListingReportInclude

const PC_LISTING_REPORT_STATUS_RESULT_INCLUDE = {
  pcListing: {
    include: {
      game: { select: { title: true } },
      author: { select: { name: true } },
    },
  },
  reportedBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
} satisfies Prisma.PcListingReportInclude

export type ListingReportModerationRecord = Prisma.ListingReportGetPayload<{
  select: typeof LISTING_REPORT_MODERATION_SELECT
}>

export type PcListingReportModerationRecord = Prisma.PcListingReportGetPayload<{
  select: typeof PC_LISTING_REPORT_MODERATION_SELECT
}>

export class ReportModerationRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  findListingReportForModeration(id: string): Promise<ListingReportModerationRecord | null> {
    return this.prisma.listingReport.findUnique({
      where: { id },
      select: LISTING_REPORT_MODERATION_SELECT,
    })
  }

  findPcListingReportForModeration(id: string): Promise<PcListingReportModerationRecord | null> {
    return this.prisma.pcListingReport.findUnique({
      where: { id },
      select: PC_LISTING_REPORT_MODERATION_SELECT,
    })
  }

  rejectListingFromReport(params: {
    listingId: string
    reviewerId: string
    reviewNotes?: string
    processedAt: Date
  }) {
    return this.prisma.listing.update({
      where: { id: params.listingId },
      data: {
        status: ApprovalStatus.REJECTED,
        processedAt: params.processedAt,
        processedByUserId: params.reviewerId,
        processedNotes: `Rejected due to report: ${params.reviewNotes || 'No additional notes'}`,
      },
    })
  }

  rejectPcListingFromReport(params: {
    pcListingId: string
    reviewerId: string
    reviewNotes?: string
    processedAt: Date
  }) {
    return this.prisma.pcListing.update({
      where: { id: params.pcListingId },
      data: {
        status: ApprovalStatus.REJECTED,
        processedAt: params.processedAt,
        processedByUserId: params.reviewerId,
        processedNotes: `Rejected due to report: ${params.reviewNotes || 'No additional notes'}`,
      },
    })
  }

  updateListingReportStatus(params: {
    id: string
    status: ReportStatus
    reviewNotes?: string
    reviewerId: string
    reviewedAt: Date
  }) {
    return this.prisma.listingReport.update({
      where: { id: params.id },
      data: {
        status: params.status,
        reviewNotes: params.reviewNotes,
        reviewedById: params.reviewerId,
        reviewedAt: params.reviewedAt,
      },
      include: LISTING_REPORT_STATUS_RESULT_INCLUDE,
    })
  }

  updatePcListingReportStatus(params: {
    id: string
    status: ReportStatus
    reviewNotes?: string
    reviewerId: string
    reviewedAt: Date
  }) {
    return this.prisma.pcListingReport.update({
      where: { id: params.id },
      data: {
        status: params.status,
        reviewNotes: params.reviewNotes,
        reviewedById: params.reviewerId,
        reviewedAt: params.reviewedAt,
      },
      include: PC_LISTING_REPORT_STATUS_RESULT_INCLUDE,
    })
  }

  deleteListingReport(id: string) {
    return this.prisma.listingReport.delete({ where: { id } })
  }

  deletePcListingReport(id: string) {
    return this.prisma.pcListingReport.delete({ where: { id } })
  }
}
