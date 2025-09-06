import { type RouterOutput } from '@/types/trpc'

export type ListingReportWithDetails = RouterOutput['listingReports']['get']['reports'][0]

export interface ReportModalState {
  isOpen: boolean
  report?: ListingReportWithDetails
}

export interface ReportStatusModalState {
  isOpen: boolean
  report?: ListingReportWithDetails
}
