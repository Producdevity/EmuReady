'use client'

import { FileText } from 'lucide-react'
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
  LoadingSpinner,
  SortableHeader,
  Badge,
  Pagination,
  LocalizedDate,
  Button,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { PermissionActionType, Role } from '@orm'

type PermissionLogSortField = 'createdAt' | 'action' | 'userId' | 'targetRole'

const PERMISSION_LOG_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'createdAt', label: 'Date', defaultVisible: true },
  { key: 'action', label: 'Action', defaultVisible: true },
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'targetRole', label: 'Target Role', defaultVisible: true },
  { key: 'permission', label: 'Permission', defaultVisible: true },
  { key: 'metadata', label: 'Details', defaultVisible: false },
]

const PERMISSION_ACTIONS = [
  { value: '', label: 'All Actions' },
  {
    value: PermissionActionType.PERMISSION_CREATED,
    label: 'Permission Created',
  },
  {
    value: PermissionActionType.PERMISSION_UPDATED,
    label: 'Permission Updated',
  },
  {
    value: PermissionActionType.PERMISSION_DELETED,
    label: 'Permission Deleted',
  },
  {
    value: PermissionActionType.ROLE_PERMISSION_ASSIGNED,
    label: 'Permission Assigned',
  },
  {
    value: PermissionActionType.ROLE_PERMISSION_REMOVED,
    label: 'Permission Removed',
  },
  { value: PermissionActionType.USER_ROLE_CHANGED, label: 'User Role Changed' },
] as const

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: Role.USER, label: 'User' },
  { value: Role.AUTHOR, label: 'Author' },
  { value: Role.DEVELOPER, label: 'Developer' },
  { value: Role.MODERATOR, label: 'Moderator' },
  { value: Role.ADMIN, label: 'Admin' },
  { value: Role.SUPER_ADMIN, label: 'Super Admin' },
] as const

function AdminPermissionLogsPage() {
  const table = useAdminTable<PermissionLogSortField>({
    defaultLimit: 50,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const [selectedAction, setSelectedAction] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const columnVisibility = useColumnVisibility(PERMISSION_LOG_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminPermissionLogs,
  })

  // Get permission logs stats
  const statsQuery = api.permissionLogs.stats.useQuery()

  // Get permission logs
  const logsQuery = api.permissionLogs.get.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    action: (selectedAction as PermissionActionType) || undefined,
    targetRole: (selectedRole as Role) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const logs = logsQuery.data?.logs ?? []
  const pagination = logsQuery.data?.pagination

  const getActionBadgeColor = (action: PermissionActionType) => {
    switch (action) {
      case PermissionActionType.PERMISSION_CREATED:
        return 'success'
      case PermissionActionType.PERMISSION_UPDATED:
        return 'warning'
      case PermissionActionType.PERMISSION_DELETED:
        return 'danger'
      case PermissionActionType.ROLE_PERMISSION_ASSIGNED:
        return 'info'
      case PermissionActionType.ROLE_PERMISSION_REMOVED:
        return 'default'
      case PermissionActionType.USER_ROLE_CHANGED:
        return 'primary'
      default:
        return 'default'
    }
  }

  const formatActionLabel = (action: PermissionActionType) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (logsQuery.isPending) return <LoadingSpinner />

  return (
    <AdminPageLayout
      title="Permission Logs"
      description="Monitor permission changes and system audit trail"
      headerActions={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ADMIN_ROUTES.AUDIT_LOGS}>
              <FileText className="w-4 h-4" /> Audit Logs
            </Link>
          </Button>
          <ColumnVisibilityControl
            columns={PERMISSION_LOG_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </>
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

      <AdminSearchFilters<PermissionLogSortField>
        table={table}
        searchPlaceholder="Search by user name, email, or permission..."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {PERMISSION_ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From date"
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To date"
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </AdminSearchFilters>

      <AdminTableContainer>
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || selectedAction || selectedRole || dateFrom || dateTo
                ? 'No permission logs found matching your criteria.'
                : 'No permission logs found.'}
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
                  {columnVisibility.isColumnVisible('user') && (
                    <SortableHeader
                      label="User"
                      field="userId"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('targetRole') && (
                    <SortableHeader
                      label="Target Role"
                      field="targetRole"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('permission') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Permission
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
                        <Badge variant={getActionBadgeColor(log.action)}>
                          {formatActionLabel(log.action)}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('user') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{log.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user?.email}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('targetRole') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {log.targetRole && <Badge>{log.targetRole}</Badge>}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('permission') && (
                      <td className="px-6 py-4 text-sm">
                        {log.permission && (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {log.permission.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {log.permission.key}
                            </div>
                          </div>
                        )}
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

      {/* Pagination */}
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

export default AdminPermissionLogsPage
