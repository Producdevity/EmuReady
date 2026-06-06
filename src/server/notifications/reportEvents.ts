import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'

type ListingReportNotificationInput = {
  type: 'listing'
  reportId: string
  listingId: string
  reportedById: string
}

type PcListingReportNotificationInput = {
  type: 'pcListing'
  reportId: string
  pcListingId: string
  reportedById: string
}

type ReportNotificationInput =
  | ListingReportNotificationInput
  | PcListingReportNotificationInput

export function emitReportCreatedNotification(input: ReportNotificationInput): void {
  const isPcListing = input.type === 'pcListing'
  const contentId = isPcListing ? input.pcListingId : input.listingId

  notificationEventEmitter.emitNotificationEvent({
    eventType: NOTIFICATION_EVENTS.REPORT_CREATED,
    entityType: isPcListing ? 'pcListingReport' : 'listingReport',
    entityId: input.reportId,
    triggeredBy: input.reportedById,
    payload: {
      reportId: input.reportId,
      contentId,
      contentType: isPcListing ? 'PC Compatibility Report' : 'Compatibility Report',
      actionUrl: isPcListing
        ? `/admin/reports?pcListing=${contentId}`
        : `/admin/reports?listing=${contentId}`,
      ...(isPcListing ? { pcListingId: input.pcListingId } : { listingId: input.listingId }),
    },
  })
}
