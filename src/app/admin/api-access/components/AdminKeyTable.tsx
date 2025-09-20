import { type UseAdminTableReturn } from '@/app/admin/hooks/useAdminTable'
import { AdminTableContainer, AdminTableNoResults } from '@/components/admin'
import {
  Badge,
  DeleteButton,
  EditButton,
  LoadingSpinner,
  Pagination,
  RefreshButton,
  SortableHeader,
} from '@/components/ui'
import { type UseColumnVisibilityReturn } from '@/hooks/useColumnVisibility'
import { type ApiKeySortField } from '@/schemas/apiAccess'
import { formatters, getLocale } from '@/utils/date'
import { type ApiPagination, type AdminApiKeyRow } from './types'
import { getKeyStatusLabel } from '../utils/key-format'

interface Props {
  table: UseAdminTableReturn<ApiKeySortField>
  columnVisibility: UseColumnVisibilityReturn
  keys: AdminApiKeyRow[]
  includeRevoked: boolean
  isLoading: boolean
  pagination: ApiPagination | undefined
  hasQuery: boolean
  onRotateKey: (id: string) => void | Promise<void>
  onRevokeKey: (id: string) => void | Promise<void>
  onOpenQuotaDialog: (id: string) => void
}

export function AdminKeyTable(props: Props) {
  const locale = getLocale()

  return (
    <AdminTableContainer>
      {props.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Loading API keys..." />
        </div>
      ) : props.keys.length === 0 ? (
        <AdminTableNoResults hasQuery={props.hasQuery || props.includeRevoked} />
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              {props.columnVisibility.isColumnVisible('name') && (
                <SortableHeader
                  label="Name"
                  field="name"
                  currentSortField={props.table.sortField}
                  currentSortDirection={props.table.sortDirection}
                  onSort={props.table.handleSort}
                />
              )}
              {props.columnVisibility.isColumnVisible('prefix') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Prefix
                </th>
              )}
              {props.columnVisibility.isColumnVisible('owner') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Owner
                </th>
              )}
              {props.columnVisibility.isColumnVisible('createdAt') && (
                <SortableHeader
                  label="Created"
                  field="createdAt"
                  currentSortField={props.table.sortField}
                  currentSortDirection={props.table.sortDirection}
                  onSort={props.table.handleSort}
                />
              )}
              {props.columnVisibility.isColumnVisible('lastUsedAt') && (
                <SortableHeader
                  label="Last Used"
                  field="lastUsedAt"
                  currentSortField={props.table.sortField}
                  currentSortDirection={props.table.sortDirection}
                  onSort={props.table.handleSort}
                />
              )}
              {props.columnVisibility.isColumnVisible('monthlyQuota') && (
                <SortableHeader
                  label="Monthly Quota"
                  field="monthlyQuota"
                  currentSortField={props.table.sortField}
                  currentSortDirection={props.table.sortDirection}
                  onSort={props.table.handleSort}
                />
              )}
              {props.columnVisibility.isColumnVisible('weeklyQuota') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Weekly Quota
                </th>
              )}
              {props.columnVisibility.isColumnVisible('burstQuota') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Burst / min
                </th>
              )}
              {props.columnVisibility.isColumnVisible('requests') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Total Requests
                </th>
              )}
              {props.columnVisibility.isColumnVisible('status') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Status
                </th>
              )}
              {props.columnVisibility.isColumnVisible('actions') && (
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {props.keys.map((key) => {
              const status = getKeyStatusLabel(key)
              return (
                <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  {props.columnVisibility.isColumnVisible('name') && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {key.name ?? 'Untitled key'}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('prefix') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.prefix}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('owner') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.user.email ?? key.user.name ?? key.user.id}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('createdAt') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatters.date(key.createdAt, locale)}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('lastUsedAt') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.lastUsedAt ? formatters.dateTime(key.lastUsedAt, locale) : 'Never'}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('monthlyQuota') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.monthlyQuota.toLocaleString()}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('weeklyQuota') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.weeklyQuota.toLocaleString()}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('burstQuota') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.burstQuota.toLocaleString()}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('requests') && (
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {key.requestCount.toLocaleString()}
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('status') && (
                    <td className="px-4 py-3 text-sm">
                      <Badge pill size="sm" variant={status.variant}>
                        {status.label}
                      </Badge>
                    </td>
                  )}
                  {props.columnVisibility.isColumnVisible('actions') && (
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <EditButton
                          title="Quotas"
                          onClick={() => props.onOpenQuotaDialog(key.id)}
                        />
                        <RefreshButton
                          title="Rotate"
                          onClick={() => {
                            void props.onRotateKey(key.id)
                          }}
                        />
                        <DeleteButton
                          title="Revoke"
                          onClick={() => {
                            void props.onRevokeKey(key.id)
                          }}
                          disabled={Boolean(key.revokedAt)}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {props.pagination && props.keys.length > 0 ? (
        <div className="mt-4 flex justify-end">
          <Pagination
            page={props.pagination.page}
            totalPages={props.pagination.pages}
            totalItems={props.pagination.total}
            itemsPerPage={props.pagination.limit}
            onPageChange={props.table.setPage}
          />
        </div>
      ) : null}
    </AdminTableContainer>
  )
}
