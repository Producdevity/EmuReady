import { type RouterOutput } from '@/types/trpc'

type ListingReportWithDetails = RouterOutput['listingReports']['get']['reports'][number]
type PcListingReportWithDetails = RouterOutput['pcListingReports']['get']['reports'][number]

const ADMIN_REPORT_KIND = {
  HANDHELD: 'handheld',
  PC: 'pc',
} as const

export const REPORT_TYPES = [
  { value: ADMIN_REPORT_KIND.HANDHELD, label: 'Handheld Reports' },
  { value: ADMIN_REPORT_KIND.PC, label: 'PC Reports' },
] as const

export type AdminReportKind = (typeof REPORT_TYPES)[number]['value']

export function isAdminReportKind(value: string): value is AdminReportKind {
  return REPORT_TYPES.some((reportType) => reportType.value === value)
}

export function toHandheldAdminReport(report: ListingReportWithDetails) {
  return {
    kind: ADMIN_REPORT_KIND.HANDHELD,
    id: report.id,
    reason: report.reason,
    status: report.status,
    description: report.description,
    reviewNotes: report.reviewNotes,
    reviewedAt: report.reviewedAt,
    createdAt: report.createdAt,
    reportedBy: report.reportedBy,
    reviewedBy: report.reviewedBy,
    compatibilityReport: {
      id: report.listing.id,
      href: `/listings/${report.listing.id}`,
      reportLabel: 'Handheld Report',
      gameTitle: report.listing.game.title,
      hardwareFieldLabel: 'Device',
      hardwareLabel: report.listing.device.modelName,
      emulatorName: report.listing.emulator.name,
      author: report.listing.author,
    },
  }
}

export function toPcAdminReport(report: PcListingReportWithDetails) {
  const cpuName = report.pcListing.cpu?.modelName ?? 'Unknown CPU'
  const gpuName = report.pcListing.gpu?.modelName ?? 'Integrated GPU'

  return {
    kind: ADMIN_REPORT_KIND.PC,
    id: report.id,
    reason: report.reason,
    status: report.status,
    description: report.description,
    reviewNotes: report.reviewNotes,
    reviewedAt: report.reviewedAt,
    createdAt: report.createdAt,
    reportedBy: report.reportedBy,
    reviewedBy: report.reviewedBy,
    compatibilityReport: {
      id: report.pcListing.id,
      href: `/pc-listings/${report.pcListing.id}`,
      reportLabel: 'PC Report',
      gameTitle: report.pcListing.game.title,
      hardwareFieldLabel: 'Hardware',
      hardwareLabel: `${cpuName} / ${gpuName}`,
      emulatorName: report.pcListing.emulator.name,
      author: report.pcListing.author,
    },
  }
}

export type AdminReportWithDetails =
  | ReturnType<typeof toHandheldAdminReport>
  | ReturnType<typeof toPcAdminReport>
