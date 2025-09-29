'use client'

import { useMemo, useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks/useAdminTable'
import {
  AdminPageLayout,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableContainer,
} from '@/components/admin'
import {
  Badge,
  Button,
  ColumnVisibilityControl,
  Dropdown,
  LoadingSpinner,
  Pagination,
  SortableHeader,
  useConfirmDialog,
} from '@/components/ui'
import { ViewButton, DeleteButton } from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility } from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import { EntitlementSource } from '@orm'
import EntitlementDetailsModal from './components/EntitlementDetailsModal'
import GrantEntitlementModal from './components/GrantEntitlementModal'

type SortField = 'grantedAt' | 'revokedAt' | 'source' | 'status' | 'userEmail' | 'userName'

interface ColumnDef {
  key: string
  label: string
  defaultVisible?: boolean
  alwaysVisible?: boolean
}
const COLUMNS: ColumnDef[] = [
  { key: 'userName', label: 'Username', defaultVisible: true },
  { key: 'userEmail', label: 'Email', defaultVisible: false },
  { key: 'source', label: 'Source', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'referenceId', label: 'Reference', defaultVisible: true },
  { key: 'grantedAt', label: 'Granted', defaultVisible: true },
  { key: 'revokedAt', label: 'Revoked', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

export default function AdminEntitlementsPage() {
  const table = useAdminTable<SortField>({
    defaultLimit: 20,
    defaultSortField: 'grantedAt',
    defaultSortDirection: 'desc',
  })
  const confirm = useConfirmDialog()
  const columnVisibility = useColumnVisibility(COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminEntitlements,
  })

  // Filters
  const source = table.additionalParams['source'] || ''
  const status = table.additionalParams['status'] || ''

  const listQuery = api.adminEntitlements.list.useQuery({
    search: table.debouncedSearch || undefined,
    source: (source || undefined) as EntitlementSource | undefined,
    status: (status || undefined) as 'ACTIVE' | 'REVOKED' | undefined,
    page: table.page,
    limit: table.limit,
    sortField: ((table.sortField as SortField) || 'grantedAt') as SortField,
    sortDirection: ((table.sortDirection as 'asc' | 'desc') || 'desc') as 'asc' | 'desc',
  })
  const statsQuery = api.adminEntitlements.stats.useQuery({})

  const revokeMutation = api.adminEntitlements.revoke.useMutation({
    onSuccess: () => listQuery.refetch().catch(console.error),
  })
  const restoreMutation = api.adminEntitlements.restore.useMutation({
    onSuccess: () => listQuery.refetch().catch(console.error),
  })
  const utils = api.useUtils()
  const [selected, setSelected] = useState<Row | null>(null)
  const [showGrant, setShowGrant] = useState(false)

  type Row = RouterOutput['adminEntitlements']['list']['items'][number]
  const items = (listQuery.data?.items ?? []) as Row[]
  const pagination = listQuery.data?.pagination

  const stats = useMemo(() => {
    const s = statsQuery.data
    return [
      { label: 'Total', value: s?.total, color: 'blue' as const },
      { label: 'Active', value: s?.active, color: 'green' as const },
      { label: 'Revoked', value: s?.revoked, color: 'red' as const },
      { label: 'Play', value: s?.sourceCounts?.PLAY ?? 0, color: 'purple' as const },
      { label: 'Patreon', value: s?.sourceCounts?.PATREON ?? 0, color: 'orange' as const },
      { label: 'Manual', value: s?.sourceCounts?.MANUAL ?? 0, color: 'gray' as const },
    ]
  }, [statsQuery.data])

  return (
    <AdminPageLayout
      title="Android Entitlements"
      description="Manage eligibility for Android app downloads."
      headerActions={
        <div className="flex items-center gap-2">
          <ColumnVisibilityControl columns={COLUMNS} columnVisibility={columnVisibility} />
          <Button onClick={() => setShowGrant(true)}>Grant entitlement</Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const all = await utils.adminEntitlements.list.fetch({
                  search: table.debouncedSearch || undefined,
                  source: (source || undefined) as EntitlementSource | undefined,
                  status: (status || undefined) as 'ACTIVE' | 'REVOKED' | undefined,
                  page: 1,
                  limit: 5000,
                  sortField: ((table.sortField as SortField) || 'grantedAt') as SortField,
                  sortDirection: ((table.sortDirection as 'asc' | 'desc') || 'desc') as
                    | 'asc'
                    | 'desc',
                })
                const rows: Row[] = all.items as Row[]
                const header = [
                  'userId',
                  'userEmail',
                  'source',
                  'status',
                  'referenceId',
                  'grantedAt',
                  'revokedAt',
                ]
                const csv = [
                  header.join(','),
                  ...rows.map((r: Row) =>
                    [
                      r.user.id,
                      r.user.email ?? '',
                      r.source,
                      r.status,
                      r.referenceId ?? '',
                      new Date(r.grantedAt).toISOString(),
                      r.revokedAt ? new Date(r.revokedAt).toISOString() : '',
                    ]
                      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                      .join(','),
                  ),
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'entitlements.csv'
                a.click()
                URL.revokeObjectURL(url)
              } catch {
                toast.error('Failed to export CSV')
              }
            }}
          >
            Export CSV
          </Button>
        </div>
      }
    >
      <AdminStatsDisplay stats={stats} isLoading={statsQuery.isPending} />

      <AdminSearchFilters table={table} searchPlaceholder="Search by email/name/reference…">
        <Dropdown
          options={[
            { value: '', label: 'All sources' },
            { value: EntitlementSource.PLAY, label: 'PLAY' },
            { value: EntitlementSource.PATREON, label: 'PATREON' },
            { value: EntitlementSource.MANUAL, label: 'MANUAL' },
          ]}
          value={source}
          onChange={(v) => table.setAdditionalParam('source', v)}
        />
        <Dropdown
          options={[
            { value: '', label: 'All statuses' },
            { value: 'ACTIVE', label: 'ACTIVE' },
            { value: 'REVOKED', label: 'REVOKED' },
          ]}
          value={status}
          onChange={(v) => table.setAdditionalParam('status', v)}
        />
      </AdminSearchFilters>

      <AdminTableContainer>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Entitlements</h3>
            {listQuery.isPending && <LoadingSpinner size="sm" />}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  {columnVisibility.isColumnVisible('userName') && (
                    <SortableHeader
                      field="userName"
                      label="Username"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={(f) => table.handleSort(f)}
                    />
                  )}
                  {columnVisibility.isColumnVisible('userEmail') && (
                    <SortableHeader
                      field="userEmail"
                      label="Email"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={(f) => table.handleSort(f)}
                    />
                  )}
                  <SortableHeader
                    field="source"
                    label="Source"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={(f) => table.handleSort(f)}
                  />
                  <SortableHeader
                    field="status"
                    label="Status"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={(f) => table.handleSort(f)}
                  />
                  {columnVisibility.isColumnVisible('referenceId') && (
                    <th className="py-2 px-3">Reference</th>
                  )}
                  {columnVisibility.isColumnVisible('grantedAt') && (
                    <SortableHeader
                      field="grantedAt"
                      label="Granted"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={(f) => table.handleSort(f)}
                    />
                  )}
                  {columnVisibility.isColumnVisible('revokedAt') && (
                    <SortableHeader
                      field="revokedAt"
                      label="Revoked"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={(f) => table.handleSort(f)}
                    />
                  )}
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No entitlements found
                    </td>
                  </tr>
                ) : (
                  items.map((e) => (
                    <tr key={e.id} className="border-t border-gray-200 dark:border-gray-700">
                      {columnVisibility.isColumnVisible('userName') && (
                        <td className="py-2 px-3">
                          <a
                            href={`/admin/users?userId=${e.user.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {e.user.name ?? '—'}
                          </a>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('userEmail') && (
                        <td className="py-2 px-3">{e.user.email ?? '—'}</td>
                      )}
                      <td className="py-2 px-3">{e.source}</td>
                      <td className="py-2 px-3">
                        <Badge variant={e.status === 'ACTIVE' ? 'primary' : 'default'}>
                          {e.status}
                        </Badge>
                      </td>
                      {columnVisibility.isColumnVisible('referenceId') && (
                        <td className="py-2 px-3 font-mono text-xs break-all">
                          {e.referenceId || '—'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('grantedAt') && (
                        <td className="py-2 px-3">{new Date(e.grantedAt).toLocaleString()}</td>
                      )}
                      {columnVisibility.isColumnVisible('revokedAt') && (
                        <td className="py-2 px-3">
                          {e.revokedAt ? new Date(e.revokedAt).toLocaleString() : '—'}
                        </td>
                      )}
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <ViewButton title="View" onClick={() => setSelected(e)} />
                          {e.status === 'ACTIVE' ? (
                            <DeleteButton
                              title="Revoke"
                              onClick={async () => {
                                const ok = await confirm({
                                  title: 'Revoke entitlement',
                                  description: 'This will immediately remove access for the user.',
                                  confirmText: 'Revoke',
                                })
                                if (!ok) return
                                await revokeMutation.mutateAsync({ entitlementId: e.id })
                              }}
                              disabled={revokeMutation.isPending}
                            />
                          ) : (
                            <Button
                              variant="primary"
                              onClick={async () => {
                                const ok = await confirm({
                                  title: 'Restore entitlement',
                                  description:
                                    'This will mark the entitlement as ACTIVE again. Proceed?',
                                  confirmText: 'Restore',
                                })
                                if (!ok) return
                                await restoreMutation.mutateAsync({ entitlementId: e.id })
                              }}
                              disabled={restoreMutation.isPending}
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="mt-4">
              <Pagination
                page={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(p) => table.setPage(p)}
              />
            </div>
          )}
        </div>
      </AdminTableContainer>
      {showGrant && (
        <GrantEntitlementModal
          isOpen
          onClose={() => setShowGrant(false)}
          onSuccess={() => listQuery.refetch().catch(console.error)}
        />
      )}
      {selected && (
        <EntitlementDetailsModal
          isOpen
          onClose={() => setSelected(null)}
          row={selected}
          onRevoke={async (id) => {
            await revokeMutation.mutateAsync({ entitlementId: id })
          }}
          onRestore={async (id) => {
            await restoreMutation.mutateAsync({ entitlementId: id })
          }}
          isMutating={revokeMutation.isPending || restoreMutation.isPending}
        />
      )}
    </AdminPageLayout>
  )
}
