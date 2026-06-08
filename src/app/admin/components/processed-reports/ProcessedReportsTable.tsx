'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { type UseAdminTableReturn } from '@/app/admin/hooks'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import {
  ApproveButton,
  EditButton,
  LocalizedDate,
  RejectButton,
  SortableHeader,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  UndoButton,
  ViewButton,
  ViewUserButton,
} from '@/components/ui'
import { type UseColumnVisibilityReturn } from '@/hooks'
import analytics from '@/lib/analytics'
import { getApprovalStatusColor } from '@/utils/badge-colors'
import { ApprovalStatus } from '@orm'
import { type ProcessedReportAccessors, type ProcessedReportHardwareColumn } from './types'

interface Props<TReport, TSortField extends string> {
  table: UseAdminTableReturn<TSortField>
  reports: TReport[]
  hardwareColumns: ProcessedReportHardwareColumn<TReport, TSortField>[]
  columnVisibility: UseColumnVisibilityReturn
  accessors: ProcessedReportAccessors<TReport>
  reportLabel: string
  analyticsContext: string
  showSystemIcons: boolean
  isSystemIconsHydrated: boolean
  showEmulatorLogos: boolean
  isEmulatorLogosHydrated: boolean
  canEditReports: boolean
  canOverrideReports: boolean
  canViewUsers: boolean
  isOverridePending: boolean
  onOpenOverrideModal: (report: TReport, targetStatus: ApprovalStatus) => void
}

export function ProcessedReportsTable<TReport, TSortField extends string>(
  props: Props<TReport, TSortField>,
) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {props.columnVisibility.isColumnVisible('game') && (
              <SortableHeader
                label="Game"
                field="game.title"
                currentSortField={props.table.sortField}
                currentSortDirection={props.table.sortDirection}
                onSort={props.table.handleSort}
                className="px-6 py-3 text-left"
              />
            )}
            {props.columnVisibility.isColumnVisible('system') && (
              <SortableHeader
                label="System"
                field="game.system.name"
                currentSortField={props.table.sortField}
                currentSortDirection={props.table.sortDirection}
                onSort={props.table.handleSort}
                className="px-6 py-3 text-left"
              />
            )}
            {props.hardwareColumns.map(
              (column) =>
                props.columnVisibility.isColumnVisible(column.key) && (
                  <SortableHeader
                    key={column.key}
                    label={column.label}
                    field={column.sortField}
                    currentSortField={props.table.sortField}
                    currentSortDirection={props.table.sortDirection}
                    onSort={props.table.handleSort}
                    className="px-6 py-3 text-left"
                  />
                ),
            )}
            {props.columnVisibility.isColumnVisible('emulator') && (
              <SortableHeader
                label="Emulator"
                field="emulator.name"
                currentSortField={props.table.sortField}
                currentSortDirection={props.table.sortDirection}
                onSort={props.table.handleSort}
                className="px-6 py-3 text-left"
              />
            )}
            {props.columnVisibility.isColumnVisible('author') && (
              <SortableHeader
                label="Author"
                field="author.name"
                currentSortField={props.table.sortField}
                currentSortDirection={props.table.sortDirection}
                onSort={props.table.handleSort}
                className="px-6 py-3 text-left"
              />
            )}
            {props.columnVisibility.isColumnVisible('status') && (
              <SortableHeader
                label="Status"
                field="status"
                currentSortField={props.table.sortField}
                currentSortDirection={props.table.sortDirection}
                onSort={props.table.handleSort}
                className="px-6 py-3 text-left"
              />
            )}
            {props.columnVisibility.isColumnVisible('processedBy') && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Processed By
              </th>
            )}
            {props.columnVisibility.isColumnVisible('processedAt') && (
              <SortableHeader
                label="Processed"
                field="processedAt"
                currentSortField={props.table.sortField}
                currentSortDirection={props.table.sortDirection}
                onSort={props.table.handleSort}
                className="px-6 py-3 text-left"
              />
            )}
            {props.columnVisibility.isColumnVisible('actions') && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {props.reports.map((report) => (
            <ProcessedReportRow
              key={props.accessors.getId(report)}
              report={report}
              hardwareColumns={props.hardwareColumns}
              columnVisibility={props.columnVisibility}
              accessors={props.accessors}
              reportLabel={props.reportLabel}
              analyticsContext={props.analyticsContext}
              showSystemIcons={props.showSystemIcons}
              isSystemIconsHydrated={props.isSystemIconsHydrated}
              showEmulatorLogos={props.showEmulatorLogos}
              isEmulatorLogosHydrated={props.isEmulatorLogosHydrated}
              canEditReports={props.canEditReports}
              canOverrideReports={props.canOverrideReports}
              canViewUsers={props.canViewUsers}
              isOverridePending={props.isOverridePending}
              onOpenOverrideModal={props.onOpenOverrideModal}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface RowProps<TReport, TSortField extends string> {
  report: TReport
  hardwareColumns: ProcessedReportHardwareColumn<TReport, TSortField>[]
  columnVisibility: UseColumnVisibilityReturn
  accessors: ProcessedReportAccessors<TReport>
  reportLabel: string
  analyticsContext: string
  showSystemIcons: boolean
  isSystemIconsHydrated: boolean
  showEmulatorLogos: boolean
  isEmulatorLogosHydrated: boolean
  canEditReports: boolean
  canOverrideReports: boolean
  canViewUsers: boolean
  isOverridePending: boolean
  onOpenOverrideModal: (report: TReport, targetStatus: ApprovalStatus) => void
}

function ProcessedReportRow<TReport, TSortField extends string>(
  props: RowProps<TReport, TSortField>,
) {
  const reportId = props.accessors.getId(props.report)
  const reportHref = props.accessors.getViewHref(props.report)
  const author = props.accessors.getAuthor(props.report)
  const processedAt = props.accessors.getProcessedAt(props.report)
  const status = props.accessors.getStatus(props.report)
  const gameTitle = props.accessors.getGameTitle(props.report)
  const systemName = props.accessors.getSystemName(props.report)
  const systemKey = props.accessors.getSystemKey?.(props.report)
  const emulatorName = props.accessors.getEmulatorName(props.report)
  const emulatorLogo = props.accessors.getEmulatorLogo(props.report)

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      {props.columnVisibility.isColumnVisible('game') && (
        <td className="px-6 py-4">
          <Link
            href={reportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => {
              analytics.contentDiscovery.externalLinkClicked({
                url: reportHref,
                context: props.analyticsContext,
                entityId: reportId,
              })
            }}
          >
            {gameTitle}
            <ExternalLink className="ml-1.5 h-3 w-3" />
          </Link>
        </td>
      )}
      {props.columnVisibility.isColumnVisible('system') && (
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
          {props.isSystemIconsHydrated && props.showSystemIcons && systemKey ? (
            <div className="flex items-center gap-2">
              <SystemIcon name={systemName} systemKey={systemKey} size="md" />
              <span className="sr-only">{systemName}</span>
            </div>
          ) : (
            systemName
          )}
        </td>
      )}
      {props.hardwareColumns.map(
        (column) =>
          props.columnVisibility.isColumnVisible(column.key) && (
            <td key={column.key} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
              {column.render(props.report)}
            </td>
          ),
      )}
      {props.columnVisibility.isColumnVisible('emulator') && (
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
          <EmulatorIcon
            name={emulatorName}
            logo={emulatorLogo}
            showLogo={props.isEmulatorLogosHydrated && props.showEmulatorLogos}
            size="sm"
          />
        </td>
      )}
      {props.columnVisibility.isColumnVisible('author') && (
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
          {author ? (
            <Link
              href={`/admin/users?userId=${author.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              {author.name ?? 'N/A'}
            </Link>
          ) : (
            'N/A'
          )}
        </td>
      )}
      {props.columnVisibility.isColumnVisible('status') && (
        <td className="px-6 py-4 text-sm">
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusColor(status)}`}
          >
            {status}
          </span>
        </td>
      )}
      {props.columnVisibility.isColumnVisible('processedBy') && (
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {props.accessors.getProcessedByName(props.report) ?? 'N/A'}
        </td>
      )}
      {props.columnVisibility.isColumnVisible('processedAt') && (
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {processedAt ? (
            <Tooltip>
              <TooltipTrigger>
                <span className="cursor-help">
                  <LocalizedDate date={processedAt} format="timeAgo" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <LocalizedDate date={processedAt} format="dateTime" />
              </TooltipContent>
            </Tooltip>
          ) : (
            'N/A'
          )}
        </td>
      )}
      {props.columnVisibility.isColumnVisible('actions') && (
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {props.canEditReports && (
              <EditButton
                href={props.accessors.getEditHref(props.report)}
                title={`Edit ${props.reportLabel}`}
              />
            )}
            {props.canOverrideReports && (
              <UndoButton
                title="Return to Pending Review"
                onClick={() => props.onOpenOverrideModal(props.report, ApprovalStatus.PENDING)}
                disabled={props.isOverridePending}
              />
            )}
            {props.canOverrideReports && status === ApprovalStatus.APPROVED && (
              <RejectButton
                title="Override to Rejected"
                onClick={() => props.onOpenOverrideModal(props.report, ApprovalStatus.REJECTED)}
                disabled={props.isOverridePending}
              />
            )}
            {props.canOverrideReports && status === ApprovalStatus.REJECTED && (
              <ApproveButton
                title="Override to Approved"
                onClick={() => props.onOpenOverrideModal(props.report, ApprovalStatus.APPROVED)}
                disabled={props.isOverridePending}
              />
            )}
            {props.canViewUsers && author && (
              <ViewUserButton title="View User Details" href={`/admin/users?userId=${author.id}`} />
            )}
            <ViewButton title={`View ${props.reportLabel}`} href={reportHref} />
          </div>
        </td>
      )}
    </tr>
  )
}
