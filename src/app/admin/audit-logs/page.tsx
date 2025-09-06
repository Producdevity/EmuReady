'use client'

import { Shield } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ADMIN_ROUTES } from '@/app/admin/config/routes'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
} from '@/components/admin'
import {
  ColumnVisibilityControl,
  Button,
  LoadingSpinner,
  SortableHeader,
  Badge,
  Pagination,
  LocalizedDate,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { formatEnumLabel } from '@/utils/format'
import { AuditAction, AuditEntityType } from '@orm'

type AuditLogSortField = 'createdAt' | 'action' | 'entityType' | 'actorId' | 'targetUserId'

const AUDIT_LOG_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'createdAt', label: 'Date', defaultVisible: true },
  { key: 'action', label: 'Action', defaultVisible: true },
  { key: 'entityType', label: 'Entity Type', defaultVisible: true },
  { key: 'entityId', label: 'Entity ID', defaultVisible: false },
  { key: 'actor', label: 'Actor', defaultVisible: true },
  { key: 'targetUser', label: 'Target User', defaultVisible: false },
  { key: 'ipAddress', label: 'IP', defaultVisible: false },
  { key: 'userAgent', label: 'User Agent', defaultVisible: false },
  { key: 'requestId', label: 'Request ID', defaultVisible: false },
  { key: 'metadata', label: 'Details', defaultVisible: false },
]

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: AuditAction.CREATE, label: 'Create' },
  { value: AuditAction.UPDATE, label: 'Update' },
  { value: AuditAction.DELETE, label: 'Delete' },
  { value: AuditAction.ARCHIVE, label: 'Archive' },
  { value: AuditAction.APPROVE, label: 'Approve' },
  { value: AuditAction.REJECT, label: 'Reject' },
  { value: AuditAction.ASSIGN, label: 'Assign' },
  { value: AuditAction.UNASSIGN, label: 'Unassign' },
  { value: AuditAction.BAN, label: 'Ban' },
  { value: AuditAction.UNBAN, label: 'Unban' },
]

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: AuditEntityType.USER, label: 'User' },
  { value: AuditEntityType.USER_BAN, label: 'User Ban' },
  { value: AuditEntityType.LISTING, label: 'Listing' },
  { value: AuditEntityType.PC_LISTING, label: 'PC Listing' },
  { value: AuditEntityType.GAME, label: 'Game' },
  { value: AuditEntityType.PERMISSION, label: 'Permission' },
  { value: AuditEntityType.COMMENT, label: 'Comment' },
  { value: AuditEntityType.REPORT, label: 'Report' },
  { value: AuditEntityType.EMULATOR, label: 'Emulator' },
  { value: AuditEntityType.OTHER, label: 'Other' },
]

function getActionBadgeVariant(action: AuditAction) {
  switch (action) {
    case AuditAction.CREATE:
      return 'success' as const
    case AuditAction.UPDATE:
      return 'info' as const
    case AuditAction.DELETE:
    case AuditAction.ARCHIVE:
      return 'danger' as const
    case AuditAction.APPROVE:
      return 'primary' as const
    case AuditAction.REJECT:
      return 'warning' as const
    case AuditAction.ASSIGN:
      return 'success' as const
    case AuditAction.UNASSIGN:
      return 'default' as const
    case AuditAction.BAN:
      return 'danger' as const
    case AuditAction.UNBAN:
      return 'info' as const
    default:
      return 'default' as const
  }
}

function AdminAuditLogsPage() {
  const table = useAdminTable<AuditLogSortField>({
    defaultLimit: 50,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const [selectedAction, setSelectedAction] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const columnVisibility = useColumnVisibility(AUDIT_LOG_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminAuditLogs,
  })

  const statsQuery = api.auditLogs.stats.useQuery()

  const logsQuery = api.auditLogs.get.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: table.debouncedSearch || undefined,
    action: (selectedAction as unknown as AuditAction) || undefined,
    entityType: (selectedEntity as unknown as AuditEntityType) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const logs = logsQuery.data?.logs ?? []
  const pagination = logsQuery.data?.pagination

  if (logsQuery.isPending) return <LoadingSpinner />

  return (
    <AdminPageLayout
      title="Audit Logs"
      description="System-wide audit trail for sensitive operations"
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ADMIN_ROUTES.PERMISSION_LOGS}>
              <Shield className="w-4 h-4" /> Permission Logs
            </Link>
          </Button>
          <ColumnVisibilityControl
            columns={AUDIT_LOG_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </div>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total Logs',
            value: statsQuery.data?.summary.totalLogs,
            color: 'blue' as const,
          },
          {
            label: 'Last 24h',
            value: statsQuery.data?.summary.logsLast24h,
            color: 'green' as const,
          },
          {
            label: 'Last 7 days',
            value: statsQuery.data?.summary.logsLast7d,
            color: 'purple' as const,
          },
          {
            label: 'Last 30 days',
            value: statsQuery.data?.summary.logsLast30d,
            color: 'yellow' as const,
          },
        ]}
        isLoading={statsQuery.isPending}
      />

      <AdminSearchFilters<AuditLogSortField>
        table={table}
        searchPlaceholder="Search by actor, target, entity ID, request, IP, user agent..."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option
                key={opt.value ? String(opt.value) : 'all'}
                value={opt.value as unknown as string}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option
                key={opt.value ? String(opt.value) : 'all'}
                value={opt.value as unknown as string}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="From date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="To date"
          />
        </div>
      </AdminSearchFilters>

      <AdminTableContainer>
        {logs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || selectedAction || selectedEntity || dateFrom || dateTo
                ? 'No audit logs found matching your criteria.'
                : 'No audit logs found.'}
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
                  {columnVisibility.isColumnVisible('createdAt') && (
                    <SortableHeader
                      label="Date"
                      field="createdAt"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('action') && (
                    <SortableHeader
                      label="Action"
                      field="action"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('entityType') && (
                    <SortableHeader
                      label="Entity Type"
                      field="entityType"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('entityId') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entity ID
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('actor') && (
                    <SortableHeader
                      label="Actor"
                      field="actorId"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('targetUser') && (
                    <SortableHeader
                      label="Target User"
                      field="targetUserId"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('ipAddress') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('userAgent') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User Agent
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('requestId') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Request ID
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('metadata') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('id') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.id.slice(0, 8)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <LocalizedDate date={log.createdAt} format="date" />
                          <div className="text-xs">
                            <LocalizedDate
                              date={log.createdAt}
                              format="dateTime"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('action') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {formatEnumLabel(log.action)}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('entityType') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatEnumLabel(log.entityType)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('entityId') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {log.entityId?.slice(0, 8) || ''}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actor') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{log.actor?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.actor?.email}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('targetUser') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{log.targetUser?.name || ''}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.targetUser?.email || ''}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('ipAddress') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.ipAddress || ''}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('userAgent') && (
                      <td
                        className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate"
                        title={log.userAgent || ''}
                      >
                        {log.userAgent || ''}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('requestId') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {log.requestId || ''}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('metadata') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {log.metadata && (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 dark:text-blue-400 hover:underline">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
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
    </AdminPageLayout>
  )
}

export default AdminAuditLogsPage
