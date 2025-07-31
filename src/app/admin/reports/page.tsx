'use client'

import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
} from '@/components/admin'
import {
  Button,
  ColumnVisibilityControl,
  DeleteButton,
  EditButton,
  LoadingSpinner,
  SortableHeader,
  useConfirmDialog,
  Badge,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import {
  type ReportReasonType,
  type ReportStatusType,
} from '@/schemas/listingReport'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { ReportReason, ReportStatus } from '@orm'
import ReportDetailsModal from './components/ReportDetailsModal'
import ReportStatusModal from './components/ReportStatusModal'
import { type ReportModalState, type ReportStatusModalState } from './types'

type ReportSortField = 'createdAt' | 'updatedAt' | 'status' | 'reason'

const REPORT_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'listing', label: 'Listing', defaultVisible: true },
  { key: 'reason', label: 'Reason', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'reportedBy', label: 'Reported By', defaultVisible: true },
  { key: 'reviewedBy', label: 'Reviewed By', defaultVisible: true },
  { key: 'createdAt', label: 'Reported', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true },
]

const REPORT_REASONS = [
  { value: '', label: 'All Reasons' },
  { value: ReportReason.INAPPROPRIATE_CONTENT, label: 'Inappropriate Content' },
  { value: ReportReason.SPAM, label: 'Spam' },
  {
    value: ReportReason.MISLEADING_INFORMATION,
    label: 'Misleading Information',
  },
  { value: ReportReason.FAKE_LISTING, label: 'Fake Listing' },
  { value: ReportReason.COPYRIGHT_VIOLATION, label: 'Copyright Violation' },
  { value: ReportReason.OTHER, label: 'Other' },
] as const

const REPORT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: ReportStatus.PENDING, label: 'Pending' },
  { value: ReportStatus.UNDER_REVIEW, label: 'Under Review' },
  { value: ReportStatus.RESOLVED, label: 'Resolved' },
  { value: ReportStatus.DISMISSED, label: 'Dismissed' },
] as const

const getReasonBadgeVariant = (reason: ReportReasonType) => {
  switch (reason) {
    case ReportReason.INAPPROPRIATE_CONTENT:
      return 'danger'
    case ReportReason.SPAM:
      return 'warning'
    case ReportReason.MISLEADING_INFORMATION:
      return 'danger'
    case ReportReason.FAKE_LISTING:
      return 'danger'
    case ReportReason.COPYRIGHT_VIOLATION:
      return 'danger'
    case ReportReason.OTHER:
      return 'default'
    default:
      return 'default'
  }
}

const getStatusBadgeVariant = (status: ReportStatusType) => {
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

function AdminReportsPage() {
  const table = useAdminTable<ReportSortField>({ defaultLimit: 20 })
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const columnVisibility = useColumnVisibility(REPORT_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminReports,
  })

  const [selectedReason, setSelectedReason] = useState<ReportReasonType | ''>(
    '',
  )
  const [selectedStatus, setSelectedStatus] = useState<ReportStatusType | ''>(
    '',
  )
  const [reportDetailsModal, setReportDetailsModal] =
    useState<ReportModalState>({ isOpen: false })
  const [reportStatusModal, setReportStatusModal] =
    useState<ReportStatusModalState>({ isOpen: false })

  const reportsStatsQuery = api.listingReports.getStats.useQuery()
  const reportsQuery = api.listingReports.getAll.useQuery({
    search: table.debouncedSearch || undefined,
    reason: selectedReason || undefined,
    status: selectedStatus || undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const reports = reportsQuery.data?.reports ?? []
  const pagination = reportsQuery.data?.pagination

  const deleteReport = api.listingReports.delete.useMutation({
    onSuccess: () => {
      toast.success('Report deleted successfully!')
      utils.listingReports.getAll.invalidate().catch(console.error)
      utils.listingReports.getStats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete report: ${getErrorMessage(err)}`)
    },
  })

  const handleViewDetails = (report: (typeof reports)[0]) => {
    setReportDetailsModal({ isOpen: true, report })
  }

  const handleUpdateStatus = (report: (typeof reports)[0]) => {
    setReportStatusModal({ isOpen: true, report })
  }

  const handleDelete = async (report: (typeof reports)[0]) => {
    const confirmed = await confirm({
      title: 'Delete Report',
      description: `Are you sure you want to delete this report? This action cannot be undone.`,
    })

    if (!confirmed) return

    deleteReport.mutate({
      id: report.id,
    } satisfies RouterInput['listingReports']['delete'])
  }

  const statsData = reportsStatsQuery.data
    ? [
        {
          label: 'Total Reports',
          value: reportsStatsQuery.data.total,
          color: 'blue' as const,
        },
        {
          label: 'Pending',
          value: reportsStatsQuery.data.pending,
          color: 'yellow' as const,
        },
        {
          label: 'Under Review',
          value: reportsStatsQuery.data.underReview,
          color: 'blue' as const,
        },
        {
          label: 'Resolved',
          value: reportsStatsQuery.data.resolved,
          color: 'green' as const,
        },
        {
          label: 'Dismissed',
          value: reportsStatsQuery.data.dismissed,
          color: 'gray' as const,
        },
      ]
    : []

  if (reportsQuery.isPending) return <LoadingSpinner />

  return (
    <AdminPageLayout
      title="Report Management"
      description="Manage user reports for listings"
      headerActions={
        <ColumnVisibilityControl
          columns={REPORT_COLUMNS}
          columnVisibility={columnVisibility}
        />
      }
    >
      <AdminStatsDisplay
        stats={statsData}
        isLoading={reportsStatsQuery.isPending}
      />

      <AdminSearchFilters<ReportSortField>
        table={table}
        searchPlaceholder="Search reports by listing, user, or description..."
      >
        <div className="flex gap-2">
          <select
            value={selectedReason}
            onChange={(ev) =>
              setSelectedReason(ev.target.value as ReportReasonType | '')
            }
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {REPORT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as ReportStatusType | '')
            }
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {REPORT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </AdminSearchFilters>

      <AdminTableContainer>
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || selectedReason || selectedStatus
                ? 'No reports found matching your criteria.'
                : 'No reports found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columnVisibility.isColumnVisible('id') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('listing') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Listing
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('reason') && (
                    <SortableHeader
                      label="Reason"
                      field="reason"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('status') && (
                    <SortableHeader
                      label="Status"
                      field="status"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('reportedBy') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reported By
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('reviewedBy') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reviewed By
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('createdAt') && (
                    <SortableHeader
                      label="Reported"
                      field="createdAt"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('id') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {report.id.slice(0, 8)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('listing') && (
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.listing.game.title}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {report.listing.device.modelName} •{' '}
                            {report.listing.emulator.name}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            by {report.listing.author.name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('reason') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={getReasonBadgeVariant(report.reason)}>
                          {report.reason.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {report.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('reportedBy') && (
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.reportedBy.name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {report.reportedBy.email}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('reviewedBy') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {report.reviewedBy?.name || '-'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(report)}
                          >
                            View
                          </Button>
                          {report.status !== ReportStatus.RESOLVED &&
                            report.status !== ReportStatus.DISMISSED && (
                              <EditButton
                                onClick={() => handleUpdateStatus(report)}
                                title="Update Status"
                              />
                            )}
                          <DeleteButton
                            onClick={() => handleDelete(report)}
                            title="Delete Report"
                            isLoading={deleteReport.isPending}
                            disabled={deleteReport.isPending}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={table.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(newPage) => table.setPage(newPage)}
        />
      )}

      <ReportDetailsModal
        report={reportDetailsModal.report}
        isOpen={reportDetailsModal.isOpen}
        onClose={() => setReportDetailsModal({ isOpen: false })}
      />

      <ReportStatusModal
        report={reportStatusModal.report}
        isOpen={reportStatusModal.isOpen}
        onClose={() => setReportStatusModal({ isOpen: false })}
        onSuccess={() => {
          setReportStatusModal({ isOpen: false })
          utils.listingReports.getAll.invalidate().catch(console.error)
          utils.listingReports.getStats.invalidate().catch(console.error)
        }}
      />
    </AdminPageLayout>
  )
}

export default AdminReportsPage
