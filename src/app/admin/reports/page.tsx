'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
  AdminTableNoResults,
} from '@/components/admin'
import {
  ColumnVisibilityControl,
  ApproveButton,
  DeleteButton,
  EditButton,
  ViewButton,
  LoadingSpinner,
  SortableHeader,
  useConfirmDialog,
  Badge,
  Pagination,
  LocalizedDate,
  Code,
  Dropdown,
  type BadgeVariant,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { useAdminTable } from '@/hooks/admin'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { ReportReason, ReportStatus } from '@orm'
import {
  REPORT_TYPES,
  type AdminReportKind,
  type AdminReportWithDetails,
  isAdminReportKind,
  toHandheldAdminReport,
  toPcAdminReport,
} from './adminReport'
import ReportDetailsModal from './components/ReportDetailsModal'
import ReportStatusModal from './components/ReportStatusModal'
import UserDetailsModal from '../users/components/UserDetailsModal'

type ReportSortField = 'createdAt' | 'updatedAt' | 'status' | 'reason'

const REPORT_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'listing', label: 'Report', defaultVisible: true },
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
  { value: ReportReason.FAKE_LISTING, label: 'Fake Report' },
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

type ReportReasonFilter = (typeof REPORT_REASONS)[number]['value']
type ReportStatusFilter = (typeof REPORT_STATUSES)[number]['value']

function isReportReasonFilter(value: string): value is ReportReasonFilter {
  return REPORT_REASONS.some((reason) => reason.value === value)
}

function isReportStatusFilter(value: string): value is ReportStatusFilter {
  return REPORT_STATUSES.some((status) => status.value === value)
}

const getReasonBadgeVariant = (reason: ReportReason) => {
  const reasonBadgeVariantsMap: Record<ReportReason, BadgeVariant> = {
    [ReportReason.INAPPROPRIATE_CONTENT]: 'danger',
    [ReportReason.SPAM]: 'warning',
    [ReportReason.MISLEADING_INFORMATION]: 'danger',
    [ReportReason.FAKE_LISTING]: 'danger',
    [ReportReason.COPYRIGHT_VIOLATION]: 'danger',
    [ReportReason.OTHER]: 'default',
  }
  return reasonBadgeVariantsMap[reason] ?? 'default'
}

const getStatusBadgeVariant = (status: ReportStatus) => {
  const statusBadgeVariantsMap: Record<ReportStatus, BadgeVariant> = {
    [ReportStatus.PENDING]: 'warning',
    [ReportStatus.UNDER_REVIEW]: 'info',
    [ReportStatus.RESOLVED]: 'success',
    [ReportStatus.DISMISSED]: 'default',
  }

  return statusBadgeVariantsMap[status] ?? 'default'
}

function AdminReportsPage() {
  const table = useAdminTable<ReportSortField>({ defaultLimit: 20 })
  const confirm = useConfirmDialog()
  const userQuery = api.users.me.useQuery()
  const utils = api.useUtils()
  const columnVisibility = useColumnVisibility(REPORT_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminReports,
  })

  const [selectedReportKind, setSelectedReportKind] = useState<AdminReportKind>('handheld')
  const [selectedReason, setSelectedReason] = useState<ReportReasonFilter>('')
  const [selectedStatus, setSelectedStatus] = useState<ReportStatusFilter>('')
  const [reportDetailsModalReport, setReportDetailsModalReport] =
    useState<AdminReportWithDetails | null>(null)
  const [reportStatusModalReport, setReportStatusModalReport] =
    useState<AdminReportWithDetails | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const reportQueryInput = {
    search: table.debouncedSearch || undefined,
    reason: selectedReason || undefined,
    status: selectedStatus || undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  }

  const listingReportsStatsQuery = api.listingReports.stats.useQuery(undefined, {
    enabled: selectedReportKind === 'handheld',
  })
  const pcReportsStatsQuery = api.pcListingReports.stats.useQuery(undefined, {
    enabled: selectedReportKind === 'pc',
  })
  const listingReportsQuery = api.listingReports.get.useQuery(reportQueryInput, {
    enabled: selectedReportKind === 'handheld',
  })
  const pcReportsQuery = api.pcListingReports.get.useQuery(reportQueryInput, {
    enabled: selectedReportKind === 'pc',
  })

  const activeStatsQuery =
    selectedReportKind === 'handheld' ? listingReportsStatsQuery : pcReportsStatsQuery
  const activeReportsQuery =
    selectedReportKind === 'handheld' ? listingReportsQuery : pcReportsQuery

  const reports: AdminReportWithDetails[] =
    selectedReportKind === 'handheld'
      ? (listingReportsQuery.data?.reports.map(toHandheldAdminReport) ?? [])
      : (pcReportsQuery.data?.reports.map(toPcAdminReport) ?? [])
  const pagination = activeReportsQuery.data?.pagination

  const invalidateReports = () => {
    utils.listingReports.get.invalidate().catch(console.error)
    utils.listingReports.stats.invalidate().catch(console.error)
    utils.pcListingReports.get.invalidate().catch(console.error)
    utils.pcListingReports.stats.invalidate().catch(console.error)
  }

  const deleteListingReport = api.listingReports.delete.useMutation({
    onSuccess: () => {
      toast.success('Report deleted successfully!')
      invalidateReports()
    },
    onError: (err) => {
      toast.error(`Failed to delete report: ${getErrorMessage(err)}`)
    },
  })

  const deletePcListingReport = api.pcListingReports.delete.useMutation({
    onSuccess: () => {
      toast.success('Report deleted successfully!')
      invalidateReports()
    },
    onError: (err) => {
      toast.error(`Failed to delete report: ${getErrorMessage(err)}`)
    },
  })

  const updateListingStatus = api.listingReports.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Report status updated successfully!')
      invalidateReports()
    },
    onError: (err) => {
      toast.error(`Failed to update report status: ${getErrorMessage(err)}`)
    },
  })

  const updatePcListingStatus = api.pcListingReports.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Report status updated successfully!')
      invalidateReports()
    },
    onError: (err) => {
      toast.error(`Failed to update report status: ${getErrorMessage(err)}`)
    },
  })

  const handleViewDetails = (report: AdminReportWithDetails) => {
    setReportDetailsModalReport(report)
  }

  const handleUpdateStatus = (report: AdminReportWithDetails) => {
    setReportStatusModalReport(report)
  }

  const handleDelete = async (report: AdminReportWithDetails) => {
    const confirmed = await confirm({
      title: 'Delete Report',
      description: `Are you sure you want to delete this report? This action cannot be undone.`,
    })

    if (!confirmed) return

    if (report.kind === 'handheld') {
      deleteListingReport.mutate({
        id: report.id,
      } satisfies RouterInput['listingReports']['delete'])
      return
    }

    deletePcListingReport.mutate({
      id: report.id,
    } satisfies RouterInput['pcListingReports']['delete'])
  }

  const handleMarkResolved = async (report: AdminReportWithDetails) => {
    const confirmed = await confirm({
      title: 'Mark as Resolved',
      description: 'Are you sure you want to mark this report as resolved?',
      confirmText: 'Mark Resolved',
    })

    if (!confirmed) return

    if (report.kind === 'handheld') {
      updateListingStatus.mutate({
        id: report.id,
        status: ReportStatus.RESOLVED,
        reviewNotes: 'Marked as resolved',
      } satisfies RouterInput['listingReports']['updateStatus'])
      return
    }

    updatePcListingStatus.mutate({
      id: report.id,
      status: ReportStatus.RESOLVED,
      reviewNotes: 'Marked as resolved',
    } satisfies RouterInput['pcListingReports']['updateStatus'])
  }

  const statsData = activeStatsQuery.data
    ? [
        {
          label: 'Total Reports',
          value: activeStatsQuery.data.total,
          color: 'blue' as const,
        },
        {
          label: 'Pending',
          value: activeStatsQuery.data.pending,
          color: 'yellow' as const,
        },
        {
          label: 'Under Review',
          value: activeStatsQuery.data.underReview,
          color: 'blue' as const,
        },
        {
          label: 'Resolved',
          value: activeStatsQuery.data.resolved,
          color: 'green' as const,
        },
        {
          label: 'Dismissed',
          value: activeStatsQuery.data.dismissed,
          color: 'gray' as const,
        },
      ]
    : []

  const isDeletePending = deleteListingReport.isPending || deletePcListingReport.isPending
  const isUpdateStatusPending = updateListingStatus.isPending || updatePcListingStatus.isPending

  if (activeReportsQuery.isPending) return <LoadingSpinner />

  return (
    <AdminPageLayout
      title="Report Management"
      description="Manage user reports for compatibility reports"
      headerActions={
        <ColumnVisibilityControl columns={REPORT_COLUMNS} columnVisibility={columnVisibility} />
      }
    >
      <AdminStatsDisplay stats={statsData} isLoading={activeStatsQuery.isPending} />

      <AdminSearchFilters<ReportSortField>
        table={table}
        searchPlaceholder="Search reports by compatibility report, user, or description..."
        onClear={() => {
          setSelectedReason('')
          setSelectedStatus('')
        }}
      >
        <div className="flex gap-2">
          <Dropdown
            options={[...REPORT_TYPES]}
            value={selectedReportKind}
            onChange={(value) => {
              if (!isAdminReportKind(value)) return
              setSelectedReportKind(value)
              table.setPage(1)
            }}
          />
          <Dropdown
            options={[...REPORT_REASONS]}
            value={selectedReason}
            onChange={(value) => {
              if (!isReportReasonFilter(value)) return
              setSelectedReason(value)
            }}
          />
          <Dropdown
            options={[...REPORT_STATUSES]}
            value={selectedStatus}
            onChange={(value) => {
              if (!isReportStatusFilter(value)) return
              setSelectedStatus(value)
            }}
          />
        </div>
      </AdminSearchFilters>

      <AdminTableContainer>
        {reports.length === 0 ? (
          <AdminTableNoResults
            hasQuery={!!table.search || !!selectedReason || !!selectedStatus}
            queryTitle="No reports found matching your criteria."
            title="No reports found."
          />
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
                      Report
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
                        <Code label={report.id} maxLength={8} />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('listing') && (
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <Link
                            href={report.compatibilityReport.href}
                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                          >
                            {report.compatibilityReport.gameTitle}
                          </Link>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {report.compatibilityReport.hardwareLabel} •{' '}
                            {report.compatibilityReport.emulatorName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {report.compatibilityReport.reportLabel} by{' '}
                            {report.compatibilityReport.author.name || 'Unknown'}
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
                        <button
                          onClick={() => setSelectedUserId(report.reportedBy.id)}
                          className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.reportedBy.name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {report.reportedBy.email}
                          </div>
                        </button>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('reviewedBy') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {report.reviewedBy?.name || '-'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <LocalizedDate date={report.createdAt} format="date" />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ViewButton
                            onClick={() => handleViewDetails(report)}
                            title="View Report Details"
                          />
                          {hasPermission(
                            userQuery.data?.permissions,
                            PERMISSIONS.MANAGE_USER_BANS,
                          ) &&
                            report.status !== ReportStatus.RESOLVED &&
                            report.status !== ReportStatus.DISMISSED && (
                              <ApproveButton
                                onClick={() => handleMarkResolved(report)}
                                title="Mark as Resolved"
                                isLoading={isUpdateStatusPending}
                                disabled={isUpdateStatusPending}
                              />
                            )}
                          {hasPermission(
                            userQuery.data?.permissions,
                            PERMISSIONS.MANAGE_USER_BANS,
                          ) && (
                            <EditButton
                              onClick={() => handleUpdateStatus(report)}
                              title="Update Status"
                            />
                          )}
                          {hasPermission(
                            userQuery.data?.permissions,
                            PERMISSIONS.MANAGE_USER_BANS,
                          ) && (
                            <DeleteButton
                              onClick={() => handleDelete(report)}
                              title="Delete Report"
                              isLoading={isDeletePending}
                              disabled={isDeletePending}
                            />
                          )}
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
          page={table.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(newPage) => table.setPage(newPage)}
        />
      )}

      <ReportDetailsModal
        report={reportDetailsModalReport ?? undefined}
        isOpen={reportDetailsModalReport !== null}
        onClose={() => setReportDetailsModalReport(null)}
      />

      <ReportStatusModal
        report={reportStatusModalReport ?? undefined}
        isOpen={reportStatusModalReport !== null}
        onClose={() => setReportStatusModalReport(null)}
        onSuccess={() => {
          setReportStatusModalReport(null)
          invalidateReports()
        }}
      />

      <UserDetailsModal
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </AdminPageLayout>
  )
}

export default AdminReportsPage
