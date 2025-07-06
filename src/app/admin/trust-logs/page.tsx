'use client'

import { Shield, Calendar, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import TrustStatsOverview from '@/app/admin/trust-logs/components/TrustStatsOverview'
import { AdminTableContainer, AdminTableNoResults } from '@/components/admin'
import {
  Button,
  Input,
  SortableHeader,
  ColumnVisibilityControl,
  LoadingSpinner,
  Badge,
  Code,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { TRUST_ACTIONS } from '@/lib/trust/config'
import { type RouterOutput } from '@/types/trpc'
import { getTrustActionBadgeColor } from '@/utils/badgeColors'
import { formatDateTime, formatTimeAgo } from '@/utils/date'
import { TrustAction } from '@orm'

type TrustLog = RouterOutput['trust']['getTrustLogs']['logs'][number]
type TrustSortField = 'createdAt' | 'action' | 'weight'

const TRUST_LOGS_COLUMNS: ColumnDefinition[] = [
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'action', label: 'Action', defaultVisible: true },
  { key: 'weight', label: 'Weight', defaultVisible: true },
  { key: 'trustScore', label: 'Current Score', defaultVisible: true },
  { key: 'metadata', label: 'Details', defaultVisible: false },
  { key: 'timestamp', label: 'Timestamp', defaultVisible: true },
]

function AdminTrustLogsPage() {
  const table = useAdminTable<TrustSortField>({
    defaultLimit: 50,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(TRUST_LOGS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminTrustLogs,
  })

  const [selectedAction, setSelectedAction] = useState<TrustAction | ''>('')

  const trustLogsQuery = api.trust.getTrustLogs.useQuery({
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    search: isEmpty(table.search) ? undefined : table.search,
    action: selectedAction || undefined,
  })

  const trustStatsQuery = api.trust.getTrustStats.useQuery({})

  const runMonthlyBonusMutation = api.trust.runMonthlyActiveBonus.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Monthly bonus applied to ${result.processedUsers} users. ${result.errors.length} errors.`,
      )
      if (result.errors.length > 0) {
        console.error('Monthly bonus errors:', result.errors)
      }
      trustLogsQuery.refetch().catch(console.error)
      trustStatsQuery.refetch().catch(console.error)
    },
    onError: (error) => {
      toast.error(`Failed to run monthly bonus: ${error.message}`)
    },
  })

  function clearFilters() {
    table.setSearch('')
    setSelectedAction('')
    table.setPage(1)
  }

  if (trustLogsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 text-lg">
            Error loading trust logs: {trustLogsQuery.error.message}
          </p>
          <Button onClick={() => trustLogsQuery.refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const logs = trustLogsQuery.data?.logs ?? []
  const pagination = trustLogsQuery.data?.pagination

  const getLogMetadata = (log: TrustLog): string | number => {
    return log.metadata && typeof log.metadata === 'object'
      ? JSON.stringify(log.metadata)
      : log.metadata
        ? log.metadata.toString()
        : '-'
  }

  // TODO: use AdminPageLayout like all the other admin pages
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trust System Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and audit all trust score changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => runMonthlyBonusMutation.mutate({})}
            disabled={runMonthlyBonusMutation.isPending}
            isLoading={runMonthlyBonusMutation.isPending}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Run Monthly Bonus
          </Button>
          <ColumnVisibilityControl
            columns={TRUST_LOGS_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </div>
      </div>

      {/*TODO: check if we can use AdminStatsDisplay */}
      {trustStatsQuery.data && (
        <TrustStatsOverview trustStatsData={trustStatsQuery.data} />
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-2 mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search users..."
              value={table.search}
              onChange={table.handleSearchChange}
              className="w-full pl-10"
            />
          </div>
          <div>
            <Input
              as="select"
              value={selectedAction}
              onChange={(ev) =>
                setSelectedAction(ev.target.value as TrustAction)
              }
              className="w-full"
            >
              <option value="">All Actions</option>
              {Object.values(TrustAction).map((action) => (
                <option key={action} value={action}>
                  {TRUST_ACTIONS[action]?.description ?? action}
                </option>
              ))}
            </Input>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-full" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Trust Logs Table */}
      <AdminTableContainer>
        {trustLogsQuery.isPending ? (
          <LoadingSpinner text="Loading logs..." />
        ) : logs.length === 0 ? (
          <AdminTableNoResults
            icon={Shield}
            hasQuery={!!table.search || !!selectedAction}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columnVisibility.isColumnVisible('user') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
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
                  {columnVisibility.isColumnVisible('weight') && (
                    <SortableHeader
                      label="Weight"
                      field="weight"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('trustScore') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Score
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('metadata') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('timestamp') && (
                    <SortableHeader
                      label="Timestamp"
                      field="createdAt"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log: TrustLog) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {columnVisibility.isColumnVisible('user') && (
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/admin/users?userId=${log.user.id}`}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {log.user.name || 'Unknown User'}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user.email}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('action') && (
                      <td className="px-6 py-4">
                        <Badge
                          variant={getTrustActionBadgeColor(log.action)}
                          size="sm"
                        >
                          {TRUST_ACTIONS[log.action]?.description ?? log.action}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('weight') && (
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-semibold ${
                            log.weight > 0
                              ? 'text-green-600 dark:text-green-400'
                              : log.weight < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {log.weight > 0 ? '+' : ''}
                          {log.weight}
                        </span>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('trustScore') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {log.user.trustScore}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('metadata') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Code
                          value={getLogMetadata(log)}
                          label={getLogMetadata(log)}
                        />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('timestamp') && (
                      <td
                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                        title={formatDateTime(log.createdAt)}
                      >
                        {formatTimeAgo(log.createdAt)}
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
    </div>
  )
}

export default AdminTrustLogsPage
