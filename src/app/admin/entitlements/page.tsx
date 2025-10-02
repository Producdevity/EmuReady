'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks/useAdminTable'
import {
  AdminPageLayout,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableContainer,
  AdminTableNoResults,
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
  ViewButton,
  DeleteButton,
  UndoButton,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility } from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import { exportCsv } from '@/utils/export-csv'
import { EntitlementSource, EntitlementStatus } from '@orm'
import EntitlementDetailsModal from './components/EntitlementDetailsModal'
import GrantEntitlementModal from './components/GrantEntitlementModal'

type SortField = 'grantedAt' | 'revokedAt' | 'source' | 'status' | 'userEmail' | 'userName'
type Entitlement = RouterOutput['adminEntitlements']['list']['items'][number]

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
  const source = table.additionalParams?.source || ''
  const status = table.additionalParams?.status || ''

  const isEntitlementSource = (v: string): v is EntitlementSource =>
    v === EntitlementSource.PLAY ||
    v === EntitlementSource.PATREON ||
    v === EntitlementSource.MANUAL
  const isEntitlementStatus = (v: string): v is EntitlementStatus =>
    v === EntitlementStatus.ACTIVE || v === EntitlementStatus.REVOKED

  const parseSource = (s: string): EntitlementSource | undefined =>
    isEntitlementSource(s) ? s : undefined
  const parseStatus = (s: string): EntitlementStatus | undefined =>
    isEntitlementStatus(s) ? s : undefined

  const listQuery = api.adminEntitlements.list.useQuery({
    search: table.debouncedSearch || undefined,
    source: parseSource(source),
    status: parseStatus(status),
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
  const statsQuery = api.adminEntitlements.stats.useQuery({})

  const revokeMutation = api.adminEntitlements.revoke.useMutation({
    onSuccess: () => listQuery.refetch().catch(console.error),
  })
  const restoreMutation = api.adminEntitlements.restore.useMutation({
    onSuccess: () => listQuery.refetch().catch(console.error),
  })
  const utils = api.useUtils()
  const [selected, setSelected] = useState<Entitlement | null>(null)
  const [showGrant, setShowGrant] = useState(false)

  const items = (listQuery.data?.items ?? []) as Entitlement[]
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

  const handleRevoke = useCallback(
    async (entitlement: Entitlement) => {
      const ok = await confirm({
        title: 'Revoke entitlement',
        description: 'This will immediately remove access for the user.',
        confirmText: 'Revoke',
      })
      if (!ok) return
      await revokeMutation.mutateAsync({ entitlementId: entitlement.id })
    },
    [confirm, revokeMutation],
  )

  const handleRestore = useCallback(
    async (entitlement: Entitlement) => {
      const ok = await confirm({
        title: 'Restore entitlement',
        description: 'This will mark the entitlement as ACTIVE again. Proceed?',
        confirmText: 'Restore',
      })
      if (!ok) return
      await restoreMutation.mutateAsync({ entitlementId: entitlement.id })
    },
    [confirm, restoreMutation],
  )

  const handleView = useCallback((row: Entitlement) => {
    setSelected(row)
  }, [])

  const onModalRevoke = useCallback(
    async (id: string) => {
      await revokeMutation.mutateAsync({ entitlementId: id })
    },
    [revokeMutation],
  )

  const onModalRestore = useCallback(
    async (id: string) => {
      await restoreMutation.mutateAsync({ entitlementId: id })
    },
    [restoreMutation],
  )

  const handleExportCsv = async () => {
    try {
      const all = await utils.adminEntitlements.list.fetch({
        search: table.debouncedSearch || undefined,
        source: parseSource(source),
        status: parseStatus(status),
        page: 1,
        limit: 5000,
        sortField: table.sortField ?? undefined,
        sortDirection: table.sortDirection ?? undefined,
      })
      const rows: Entitlement[] = all.items as Entitlement[]
      exportCsv({
        filename: 'entitlements.csv',
        header: [
          'userId',
          'userEmail',
          'source',
          'status',
          'referenceId',
          'grantedAt',
          'revokedAt',
        ],
        rows: rows.map((r) => [
          r.user.id,
          r.user.email ?? '',
          r.source,
          r.status,
          r.referenceId ?? '',
          new Date(r.grantedAt).toISOString(),
          r.revokedAt ? new Date(r.revokedAt).toISOString() : '',
        ]),
      })
    } catch {
      toast.error('Failed to export CSV')
    }
  }

  return (
    <AdminPageLayout
      title="Android Entitlements"
      description="Manage eligibility for Android app downloads."
      headerActions={
        <>
          <ColumnVisibilityControl columns={COLUMNS} columnVisibility={columnVisibility} />
          <Button onClick={() => setShowGrant(true)}>Grant entitlement</Button>
          <Button variant="ghost" onClick={handleExportCsv}>
            Export CSV
          </Button>
        </>
      }
    >
      <AdminStatsDisplay stats={stats} isLoading={statsQuery.isPending} />

      <AdminSearchFilters table={table} searchPlaceholder="Search by email/name/reference…">
        <Dropdown
          options={[
            { value: '', label: 'All sources' },
            { value: EntitlementSource.PLAY, label: EntitlementSource.PLAY },
            { value: EntitlementSource.PATREON, label: EntitlementSource.PATREON },
            { value: EntitlementSource.MANUAL, label: EntitlementSource.MANUAL },
          ]}
          value={source}
          onChange={(value) => table.setAdditionalParam('source', value)}
        />
        <Dropdown
          options={[
            { value: '', label: 'All statuses' },
            { value: EntitlementStatus.ACTIVE, label: EntitlementStatus.ACTIVE },
            { value: EntitlementStatus.REVOKED, label: EntitlementStatus.REVOKED },
          ]}
          value={status}
          onChange={(value) => table.setAdditionalParam('status', value)}
        />
      </AdminSearchFilters>

      <AdminTableContainer>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Entitlements</h3>
            {listQuery.isPending && <LoadingSpinner size="sm" />}
          </div>

          {items.length === 0 ? (
            <AdminTableNoResults hasQuery={Boolean(table.search || source || status)} />
          ) : (
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
                  {items.map((e) => (
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
                        <Badge
                          variant={e.status === EntitlementStatus.ACTIVE ? 'primary' : 'default'}
                        >
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
                          <ViewButton title="View" onClick={() => handleView(e)} />
                          {e.status === EntitlementStatus.ACTIVE ? (
                            <DeleteButton
                              title="Revoke"
                              onClick={() => void handleRevoke(e)}
                              disabled={revokeMutation.isPending}
                            />
                          ) : (
                            <UndoButton
                              title="Restore entitlement"
                              onClick={() => void handleRestore(e)}
                              disabled={restoreMutation.isPending}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
          onRevoke={onModalRevoke}
          onRestore={onModalRestore}
          isMutating={revokeMutation.isPending || restoreMutation.isPending}
        />
      )}
    </AdminPageLayout>
  )
}
