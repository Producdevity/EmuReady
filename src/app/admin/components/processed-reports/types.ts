import type { UseAdminTableReturn } from '@/hooks/admin'
import type { ApprovalStatus, Role } from '@orm'
import type { ReactNode } from 'react'

export interface ProcessedReportPagination {
  page: number
  pages: number
  total: number
  limit?: number
}

export interface ProcessedReportStats {
  total?: number
  approved?: number
  pending?: number
  rejected?: number
}

export interface ProcessedReportUser {
  id: string
  name?: string | null
}

export interface ProcessedReportHardwareColumn<TReport, TSortField extends string> {
  key: string
  label: string
  sortField: TSortField
  defaultVisible?: boolean
  render: (report: TReport) => ReactNode
}

export interface ProcessedReportAccessors<TReport> {
  getId: (report: TReport) => string
  getGameTitle: (report: TReport) => string
  getSystemName: (report: TReport) => string
  getSystemKey?: (report: TReport) => string | null | undefined
  getEmulatorName: (report: TReport) => string
  getEmulatorLogo: (report: TReport) => string | null | undefined
  getAuthor: (report: TReport) => ProcessedReportUser | null | undefined
  getProcessedByName: (report: TReport) => string | null | undefined
  getProcessedAt: (report: TReport) => Date | string | null | undefined
  getProcessedNotes: (report: TReport) => string | null | undefined
  getStatus: (report: TReport) => ApprovalStatus
  getEditHref: (report: TReport) => string
  getViewHref: (report: TReport) => string
}

export interface ProcessedReportOverrideRequest<TReport> {
  report: TReport
  newStatus: ApprovalStatus
  overrideNotes?: string
}

export interface ProcessedReportsAdminPageProps<TReport, TSortField extends string> {
  title: string
  description: string
  reportLabel: string
  loadingText: string
  errorMessage: string | null
  searchPlaceholder: string
  storageKey: string
  analyticsContext: string
  table: UseAdminTableReturn<TSortField>
  reports: TReport[]
  pagination?: ProcessedReportPagination
  stats: ProcessedReportStats
  isStatsLoading: boolean
  isReportsLoading: boolean
  currentUserPermissions?: string[] | null
  currentUserRole?: Role | null
  filterStatus: ApprovalStatus | null
  hardwareColumns: ProcessedReportHardwareColumn<TReport, TSortField>[]
  accessors: ProcessedReportAccessors<TReport>
  onFilterStatusChange: (status: ApprovalStatus | null) => void
  onRetry: () => void
  onOverrideStatus: (request: ProcessedReportOverrideRequest<TReport>) => Promise<void>
  isOverridePending: boolean
}
