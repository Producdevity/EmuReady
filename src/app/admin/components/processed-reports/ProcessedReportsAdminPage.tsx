'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import {
  AdminErrorState,
  AdminPageLayout,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableContainer,
  AdminTableNoResults,
} from '@/components/admin'
import {
  ColumnVisibilityControl,
  DisplayToggleButton,
  LoadingSpinner,
  Pagination,
  SelectInput,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import {
  useColumnVisibility,
  useEmulatorLogos,
  useLocalStorage,
  type ColumnDefinition,
} from '@/hooks'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
import { ApprovalStatusOverrideModal } from './ApprovalStatusOverrideModal'
import { ProcessedReportsTable } from './ProcessedReportsTable'
import { type ProcessedReportHardwareColumn, type ProcessedReportsAdminPageProps } from './types'

const STATUS_FILTER_OPTIONS = [
  { id: 'all' as const, name: 'All Processed' },
  { id: ApprovalStatus.APPROVED, name: 'Approved' },
  { id: ApprovalStatus.REJECTED, name: 'Rejected' },
]

function buildColumns<TReport, TSortField extends string>(
  hardwareColumns: ProcessedReportHardwareColumn<TReport, TSortField>[],
): ColumnDefinition[] {
  return [
    { key: 'game', label: 'Game', defaultVisible: true },
    { key: 'system', label: 'System', defaultVisible: true },
    ...hardwareColumns.map((column) => ({
      key: column.key,
      label: column.label,
      defaultVisible: column.defaultVisible,
    })),
    { key: 'emulator', label: 'Emulator', defaultVisible: true },
    { key: 'author', label: 'Author', defaultVisible: true },
    { key: 'status', label: 'Status', defaultVisible: true },
    { key: 'processedBy', label: 'Processed By', defaultVisible: true },
    { key: 'processedAt', label: 'Processed At', defaultVisible: true },
    { key: 'actions', label: 'Actions', alwaysVisible: true },
  ]
}

export function ProcessedReportsAdminPage<TReport, TSortField extends string>(
  props: ProcessedReportsAdminPageProps<TReport, TSortField>,
) {
  const columns = useMemo(() => buildColumns(props.hardwareColumns), [props.hardwareColumns])
  const columnVisibility = useColumnVisibility(columns, { storageKey: props.storageKey })
  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] = useLocalStorage(
    storageKeys.showSystemIcons,
    true,
  )
  const emulatorLogos = useEmulatorLogos()
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<TReport | null>(null)
  const [overrideNotes, setOverrideNotes] = useState('')
  const [newStatusForOverride, setNewStatusForOverride] = useState<ApprovalStatus | null>(null)

  const handleFilterChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value as ApprovalStatus | 'all'
    props.onFilterStatusChange(value === 'all' ? null : value)
    props.table.setPage(1)
  }

  const openOverrideModal = (report: TReport, targetStatus: ApprovalStatus) => {
    setSelectedReport(report)
    setNewStatusForOverride(targetStatus)
    setOverrideNotes(props.accessors.getProcessedNotes(report) ?? '')
    setShowOverrideModal(true)
  }

  const closeOverrideModal = () => {
    setShowOverrideModal(false)
    setSelectedReport(null)
    setOverrideNotes('')
    setNewStatusForOverride(null)
  }

  const handleOverrideSubmit = () => {
    if (!selectedReport || !newStatusForOverride) return

    void props
      .onOverrideStatus({
        report: selectedReport,
        newStatus: newStatusForOverride,
        overrideNotes:
          newStatusForOverride === ApprovalStatus.PENDING ? undefined : overrideNotes || undefined,
      })
      .then(closeOverrideModal)
      .catch(() => undefined)
  }

  if (props.errorMessage) {
    return <AdminErrorState message={props.errorMessage} onRetry={props.onRetry} />
  }

  const canEditReports = hasPermission(props.currentUserPermissions, PERMISSIONS.EDIT_ANY_LISTING)
  const canOverrideReports = hasRolePermission(props.currentUserRole, Role.SUPER_ADMIN)
  const canViewUsers = hasPermission(props.currentUserPermissions, PERMISSIONS.MANAGE_USERS)
  const selectedReportTitle = selectedReport ? props.accessors.getGameTitle(selectedReport) : ''
  const overrideModalTitle =
    newStatusForOverride === ApprovalStatus.PENDING
      ? `Return to Pending Review: ${selectedReportTitle}`
      : `Override Status: ${selectedReportTitle}`

  return (
    <AdminPageLayout
      title={props.title}
      description={props.description}
      headerActions={
        <>
          <DisplayToggleButton
            showLogos={showSystemIcons}
            onToggle={() => setShowSystemIcons(!showSystemIcons)}
            isHydrated={isSystemIconsHydrated}
            logoLabel="Show System Icons"
            nameLabel="Show System Names"
          />
          <DisplayToggleButton
            showLogos={emulatorLogos.showEmulatorLogos}
            onToggle={emulatorLogos.toggleEmulatorLogos}
            isHydrated={emulatorLogos.isHydrated}
            logoLabel="Show Emulator Logos"
            nameLabel="Show Emulator Names"
          />
          <ColumnVisibilityControl columns={columns} columnVisibility={columnVisibility} />
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          { label: 'Total', value: props.stats.total, color: 'blue' },
          { label: 'Approved', value: props.stats.approved, color: 'green' },
          { label: 'Pending', value: props.stats.pending, color: 'yellow' },
          { label: 'Rejected', value: props.stats.rejected, color: 'red' },
        ]}
        isLoading={props.isStatsLoading}
      />

      <AdminSearchFilters<TSortField>
        table={props.table}
        searchPlaceholder={props.searchPlaceholder}
        onClear={() => props.onFilterStatusChange(null)}
      >
        <SelectInput
          hideLabel
          label="Filter by Status"
          options={STATUS_FILTER_OPTIONS}
          value={props.filterStatus ?? 'all'}
          onChange={handleFilterChange}
        />
      </AdminSearchFilters>

      <AdminTableContainer>
        {props.isReportsLoading ? (
          <LoadingSpinner text={props.loadingText} />
        ) : props.reports.length === 0 ? (
          <AdminTableNoResults
            hasQuery={Boolean(props.table.search) || props.filterStatus !== null}
          />
        ) : (
          <ProcessedReportsTable
            table={props.table}
            reports={props.reports}
            hardwareColumns={props.hardwareColumns}
            columnVisibility={columnVisibility}
            accessors={props.accessors}
            reportLabel={props.reportLabel}
            analyticsContext={props.analyticsContext}
            showSystemIcons={showSystemIcons}
            isSystemIconsHydrated={isSystemIconsHydrated}
            showEmulatorLogos={emulatorLogos.showEmulatorLogos}
            isEmulatorLogosHydrated={emulatorLogos.isHydrated}
            canEditReports={canEditReports}
            canOverrideReports={canOverrideReports}
            canViewUsers={canViewUsers}
            isOverridePending={props.isOverridePending}
            onOpenOverrideModal={openOverrideModal}
          />
        )}
      </AdminTableContainer>

      {props.pagination && props.pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            page={props.table.page}
            totalPages={props.pagination.pages}
            totalItems={props.pagination.total}
            itemsPerPage={props.pagination.limit}
            onPageChange={props.table.setPage}
          />
        </div>
      )}

      <ApprovalStatusOverrideModal
        isOpen={showOverrideModal}
        onClose={closeOverrideModal}
        title={overrideModalTitle}
        currentStatus={selectedReport ? props.accessors.getStatus(selectedReport) : null}
        newStatus={newStatusForOverride}
        overrideNotes={overrideNotes}
        onOverrideNotesChange={setOverrideNotes}
        onSubmit={handleOverrideSubmit}
        isLoading={props.isOverridePending}
      />
    </AdminPageLayout>
  )
}
