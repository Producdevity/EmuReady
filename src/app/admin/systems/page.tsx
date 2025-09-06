'use client'

import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminTableContainer,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableNoResults,
} from '@/components/admin'
import {
  Button,
  ColumnVisibilityControl,
  DeleteButton,
  EditButton,
  LoadingSpinner,
  SortableHeader,
  useConfirmDialog,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import SystemModal from './components/SystemModal'

type SystemSortField = 'name' | 'key' | 'gamesCount'

const SYSTEMS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'System Name', defaultVisible: true },
  { key: 'key', label: 'System Key', defaultVisible: true },
  { key: 'gamesCount', label: 'Games', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminSystemsPage() {
  const table = useAdminTable<SystemSortField>({
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(SYSTEMS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminSystems,
  })

  const systemsQuery = api.systems.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? null : table.debouncedSearch,
    sortField: table.sortField ?? null,
    sortDirection: table.sortDirection ?? null,
  })
  const systemsStatsQuery = api.systems.stats.useQuery()
  const deleteSystem = api.systems.delete.useMutation()
  const confirm = useConfirmDialog()
  const userQuery = api.users.me.useQuery()
  const canManageSystems = hasPermission(userQuery.data?.permissions, PERMISSIONS.MANAGE_SYSTEMS)

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [systemName, setSystemName] = useState('')
  const [systemKey, setSystemKey] = useState('')

  const utils = api.useUtils()

  const openModal = (system?: { id: string; name: string; key: string | null }) => {
    setEditId(system?.id ?? null)
    setSystemName(system?.name ?? '')
    setSystemKey(system?.key ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setSystemName('')
    setSystemKey('')
  }

  const handleModalSuccess = () => {
    utils.systems.get.invalidate().catch(console.error)
    utils.systems.stats.invalidate().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete System',
      description: 'Are you sure you want to delete this system? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteSystem.mutateAsync({
        id,
      } satisfies RouterInput['systems']['delete'])
      utils.systems.get.invalidate().catch(console.error)
      utils.systems.stats.invalidate().catch(console.error)
    } catch (err) {
      toast.error(`Failed to delete system: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gaming Systems</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all gaming systems in the database
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl columns={SYSTEMS_COLUMNS} columnVisibility={columnVisibility} />
          {canManageSystems && <Button onClick={() => openModal()}>Add System</Button>}
        </div>
      </div>

      {systemsStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total',
              value: systemsStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'With Games',
              value: systemsStatsQuery.data.withGames,
              color: 'green',
            },
            {
              label: 'No Games',
              value: systemsStatsQuery.data.withoutGames,
              color: 'gray',
            },
          ]}
          isLoading={systemsStatsQuery.isPending}
        />
      )}

      <AdminSearchFilters<SystemSortField> searchPlaceholder="Search systems..." table={table} />

      <AdminTableContainer>
        {systemsQuery.isPending ? (
          <LoadingSpinner text="Loading systems..." />
        ) : systemsQuery.data?.length === 0 ? (
          <AdminTableNoResults hasQuery={!!table.search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {columnVisibility.isColumnVisible('name') && (
                    <SortableHeader
                      label="System Name"
                      field="name"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('key') && (
                    <SortableHeader
                      label="System Key"
                      field="key"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('gamesCount') && (
                    <SortableHeader
                      label="Games"
                      field="gamesCount"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                    />
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {systemsQuery.data?.map((system) => (
                  <tr
                    key={system.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('name') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {system.name}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('key') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {system.key || '-'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('gamesCount') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {system._count.games} games
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {canManageSystems && (
                            <EditButton onClick={() => openModal(system)} title="Edit System" />
                          )}
                          {canManageSystems && (
                            <DeleteButton
                              onClick={() => handleDelete(system.id)}
                              title="Delete System"
                              isLoading={deleteSystem.isPending}
                              disabled={deleteSystem.isPending}
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

      <SystemModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        systemName={systemName}
        systemKey={systemKey}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default AdminSystemsPage
