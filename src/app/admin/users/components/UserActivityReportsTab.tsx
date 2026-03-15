'use client'

import { Flag, Monitor, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { Badge, Dropdown, LocalizedDate, Pagination } from '@/components/ui'
import { type BadgeVariant } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import { formatCountLabel } from '@/utils/text'
import { ReportReason, ReportStatus } from '@orm'

type UserReportsData = RouterOutput['listingReports']['getUserReports']
type UnifiedReport = UserReportsData['reports'][number]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: ReportStatus.PENDING, label: 'Pending' },
  { value: ReportStatus.UNDER_REVIEW, label: 'Under Review' },
  { value: ReportStatus.RESOLVED, label: 'Resolved' },
  { value: ReportStatus.DISMISSED, label: 'Dismissed' },
]

function getStatusBadgeVariant(status: ReportStatus): BadgeVariant {
  switch (status) {
    case ReportStatus.PENDING:
      return 'warning'
    case ReportStatus.UNDER_REVIEW:
      return 'info'
    case ReportStatus.RESOLVED:
      return 'success'
    case ReportStatus.DISMISSED:
      return 'default'
    default:
      return 'default'
  }
}

function getReasonBadgeVariant(reason: ReportReason): BadgeVariant {
  switch (reason) {
    case ReportReason.SPAM:
      return 'warning'
    case ReportReason.OTHER:
      return 'default'
    default:
      return 'danger'
  }
}

interface Props {
  reports: UserReportsData
  page: number
  onPageChange: (page: number) => void
  status: ReportStatus | undefined
  onStatusChange: (status: ReportStatus | undefined) => void
  isFetching: boolean
}

function UserActivityReportsTab(props: Props) {
  const { reports, pagination } = props.reports

  return (
    <div className={cn('space-y-3', props.isFetching && 'opacity-60 transition-opacity')}>
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Dropdown
          options={STATUS_OPTIONS}
          value={props.status ?? ''}
          onChange={(value) => props.onStatusChange(value ? (value as ReportStatus) : undefined)}
          placeholder="All Statuses"
          className="w-48"
        />
      </div>

      {/* Count */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {formatCountLabel('report', pagination.total)}
      </div>

      {/* Report Rows */}
      {reports.length > 0 ? (
        <div className="space-y-2">
          {reports.map((report: UnifiedReport) => (
            <div
              key={`${report.listingType}-${report.id}`}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <Flag className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={
                          report.listingType === 'handheld'
                            ? `/listings/${report.listingId}`
                            : `/pc-listings/${report.listingId}`
                        }
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                      >
                        {report.gameTitle}
                      </Link>
                      <Badge variant="default" size="sm">
                        {report.listingType === 'handheld' ? (
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            Handheld
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            PC
                          </span>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={getStatusBadgeVariant(report.status)} size="sm">
                        {report.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={getReasonBadgeVariant(report.reason)} size="sm">
                        {report.reason.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>Reported by: {report.reportedBy.name ?? 'Unknown'}</span>
                      <LocalizedDate date={report.createdAt} format="timeAgo" />
                    </div>
                    {report.reviewedBy && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Reviewed by: {report.reviewedBy.name ?? 'Unknown'}
                        {report.reviewNotes && ` - ${report.reviewNotes}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
          No reports found
        </p>
      )}

      {pagination.pages > 1 && (
        <Pagination
          page={props.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={props.onPageChange}
        />
      )}
    </div>
  )
}

export default UserActivityReportsTab
