import { applyTrustAction } from '@/lib/trust/service'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import {
  getAutoRejectableReviewRiskItemsForCandidates,
  type AutoRejectReviewRiskItem,
} from '@/server/services/review-risk.service'
import {
  invalidateCatalogCompatibilityCacheForDevices,
  listingStatsCache,
} from '@/server/utils/cache/instances'
import { ApprovalStatus, TrustAction, type PrismaClient } from '@orm/client'

const AUTO_REJECT_FALLBACK_NOTE = 'Automatically rejected by review risk.'
const HANDHELD_STATS_CACHE_KEY = 'listing-stats'
const PC_STATS_CACHE_KEY = 'pc-listing-stats'

export interface ReviewRiskAutoRejectResult {
  success: true
  rejectedCount: number
  skippedCount: number
  message: string
}

interface RejectedHandheldListing {
  id: string
  authorId: string | null
  deviceId: string
}

interface RejectedPcListing {
  id: string
  authorId: string | null
}

function createProcessedNotesMap(items: readonly AutoRejectReviewRiskItem[]): Map<string, string> {
  return new Map(items.map((item) => [item.id, item.processedNotes]))
}

function getProcessedNotes(processedNotesById: Map<string, string>, listingId: string): string {
  return processedNotesById.get(listingId) ?? AUTO_REJECT_FALLBACK_NOTE
}

function buildMessage(params: {
  rejectedCount: number
  skippedCount: number
  reportLabel: 'handheld' | 'PC'
}): string {
  const base = `Automatically rejected ${params.rejectedCount} review-risk ${params.reportLabel} report(s).`

  if (params.skippedCount === 0) return base

  return `${base} ${params.skippedCount} ${params.reportLabel} report(s) were skipped because they were already processed.`
}

function logTrustFailures(context: string, results: readonly PromiseSettledResult<unknown>[]) {
  const failures = results.filter((result): result is PromiseRejectedResult => {
    return result.status === 'rejected'
  })

  if (failures.length === 0) return

  console.error(context, failures)
}

export async function autoRejectRiskyHandheldReports(params: {
  prisma: PrismaClient
  adminUserId: string
}): Promise<ReviewRiskAutoRejectResult> {
  const repository = new ListingsRepository(params.prisma)
  const autoRejectItems = await getAutoRejectableReviewRiskItemsForCandidates({
    prisma: params.prisma,
    loadCandidates: () => repository.getPendingListingRiskCandidates({}),
  })

  if (autoRejectItems.length === 0) {
    return {
      success: true,
      rejectedCount: 0,
      skippedCount: 0,
      message: 'No auto-rejectable review-risk handheld reports found.',
    }
  }

  const processedNotesById = createProcessedNotesMap(autoRejectItems)
  const listingIds = autoRejectItems.map((item) => item.id)

  const transactionResult = await params.prisma.$transaction(async (tx) => {
    const pendingListings = await tx.listing.findMany({
      where: {
        id: { in: listingIds },
        status: ApprovalStatus.PENDING,
      },
      select: { id: true, authorId: true, deviceId: true },
    })

    const rejectedListings: RejectedHandheldListing[] = []
    let skippedCount = listingIds.length - pendingListings.length
    const processedAt = new Date()

    for (const listing of pendingListings) {
      const { count } = await tx.listing.updateMany({
        where: { id: listing.id, status: ApprovalStatus.PENDING },
        data: {
          status: ApprovalStatus.REJECTED,
          processedByUserId: params.adminUserId,
          processedAt,
          processedNotes: getProcessedNotes(processedNotesById, listing.id),
        },
      })

      if (count === 1) {
        rejectedListings.push(listing)
      } else {
        skippedCount += 1
      }
    }

    return { rejectedListings, skippedCount }
  })

  const trustActionResults = await Promise.allSettled(
    transactionResult.rejectedListings
      .filter((listing): listing is RejectedHandheldListing & { authorId: string } => {
        return listing.authorId !== null
      })
      .map((listing) =>
        applyTrustAction({
          userId: listing.authorId,
          action: TrustAction.LISTING_REJECTED,
          context: {
            listingId: listing.id,
            adminUserId: params.adminUserId,
            reason: getProcessedNotes(processedNotesById, listing.id),
          },
        }),
      ),
  )
  logTrustFailures(
    'Some trust actions failed during review-risk handheld auto-rejection:',
    trustActionResults,
  )

  const rejectedAt = new Date()
  for (const listing of transactionResult.rejectedListings) {
    try {
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.LISTING_REJECTED,
        entityType: 'listing',
        entityId: listing.id,
        triggeredBy: params.adminUserId,
        payload: {
          listingId: listing.id,
          rejectedBy: params.adminUserId,
          rejectedAt,
          rejectionReason: getProcessedNotes(processedNotesById, listing.id),
          bulk: true,
        },
      })
    } catch (notificationError) {
      console.error(`Failed to emit notification for listing ${listing.id}:`, notificationError)
    }
  }

  listingStatsCache.delete(HANDHELD_STATS_CACHE_KEY)
  invalidateCatalogCompatibilityCacheForDevices(
    transactionResult.rejectedListings.map((listing) => listing.deviceId),
  )

  return {
    success: true,
    rejectedCount: transactionResult.rejectedListings.length,
    skippedCount: transactionResult.skippedCount,
    message: buildMessage({
      rejectedCount: transactionResult.rejectedListings.length,
      skippedCount: transactionResult.skippedCount,
      reportLabel: 'handheld',
    }),
  }
}

export async function autoRejectRiskyPcReports(params: {
  prisma: PrismaClient
  adminUserId: string
}): Promise<ReviewRiskAutoRejectResult> {
  const repository = new PcListingsRepository(params.prisma)
  const autoRejectItems = await getAutoRejectableReviewRiskItemsForCandidates({
    prisma: params.prisma,
    loadCandidates: () => repository.getPendingListingRiskCandidates({}),
  })

  if (autoRejectItems.length === 0) {
    return {
      success: true,
      rejectedCount: 0,
      skippedCount: 0,
      message: 'No auto-rejectable review-risk PC reports found.',
    }
  }

  const processedNotesById = createProcessedNotesMap(autoRejectItems)
  const pcListingIds = autoRejectItems.map((item) => item.id)

  const transactionResult = await params.prisma.$transaction(async (tx) => {
    const pendingListings = await tx.pcListing.findMany({
      where: {
        id: { in: pcListingIds },
        status: ApprovalStatus.PENDING,
      },
      select: { id: true, authorId: true },
    })

    const rejectedListings: RejectedPcListing[] = []
    let skippedCount = pcListingIds.length - pendingListings.length
    const processedAt = new Date()

    for (const listing of pendingListings) {
      const { count } = await tx.pcListing.updateMany({
        where: { id: listing.id, status: ApprovalStatus.PENDING },
        data: {
          status: ApprovalStatus.REJECTED,
          processedAt,
          processedByUserId: params.adminUserId,
          processedNotes: getProcessedNotes(processedNotesById, listing.id),
        },
      })

      if (count === 1) {
        rejectedListings.push(listing)
      } else {
        skippedCount += 1
      }
    }

    return { rejectedListings, skippedCount }
  })

  const trustActionResults = await Promise.allSettled(
    transactionResult.rejectedListings
      .filter((listing): listing is RejectedPcListing & { authorId: string } => {
        return listing.authorId !== null
      })
      .map((listing) =>
        applyTrustAction({
          userId: listing.authorId,
          action: TrustAction.LISTING_REJECTED,
          context: {
            pcListingId: listing.id,
            adminUserId: params.adminUserId,
            reason: getProcessedNotes(processedNotesById, listing.id),
          },
        }),
      ),
  )
  logTrustFailures(
    'Some trust actions failed during review-risk PC auto-rejection:',
    trustActionResults,
  )

  listingStatsCache.delete(PC_STATS_CACHE_KEY)

  const rejectedAt = new Date()
  for (const listing of transactionResult.rejectedListings) {
    try {
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.PC_LISTING_REJECTED,
        entityType: 'pcListing',
        entityId: listing.id,
        triggeredBy: params.adminUserId,
        payload: {
          pcListingId: listing.id,
          rejectedBy: params.adminUserId,
          rejectedAt,
          rejectionReason: getProcessedNotes(processedNotesById, listing.id),
          bulk: true,
        },
      })
    } catch (notificationError) {
      console.error(`Failed to emit notification for PC listing ${listing.id}:`, notificationError)
    }
  }

  return {
    success: true,
    rejectedCount: transactionResult.rejectedListings.length,
    skippedCount: transactionResult.skippedCount,
    message: buildMessage({
      rejectedCount: transactionResult.rejectedListings.length,
      skippedCount: transactionResult.skippedCount,
      reportLabel: 'PC',
    }),
  }
}
