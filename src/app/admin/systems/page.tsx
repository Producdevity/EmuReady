'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import DeleteButton from '@/app/admin/components/table-buttons/DeleteButton'
import EditButton from '@/app/admin/components/table-buttons/EditButton'
import {
  Button,
  Input,
  SortableHeader,
  ColumnVisibilityControl,
  useConfirmDialog,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import SystemModal from './components/SystemModal'

type SystemSortField = 'name' | 'gamesCount'

const SYSTEMS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'System Name', defaultVisible: true },
  { key: 'gamesCount', label: 'Games', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminSystemsPage() {
  const table = useAdminTable<SystemSortField>()
  const columnVisibility = useColumnVisibility(SYSTEMS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminSystems,
  })

  const { data: systems, refetch } = api.systems.get.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
  const deleteSystem = api.systems.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [systemName, setSystemName] = useState('')

  const openModal = (system?: { id: string; name: string }) => {
    setEditId(system?.id ?? null)
    setSystemName(system?.name ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setSystemName('')
  }

  const handleModalSuccess = () => {
    refetch().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete System',
      description:
        'Are you sure you want to delete this system? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteSystem.mutateAsync({
        id,
      } satisfies RouterInput['systems']['delete'])
      refetch().catch(console.error)
    } catch (err) {
      toast.error(`Failed to delete system: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Game Systems</h1>
        <div className="flex items-center gap-3">
          <ColumnVisibilityControl
            columns={SYSTEMS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add System</Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search systems..."
            value={table.search}
            onChange={table.handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
          <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {systems?.map(
              (system: {
                id: string
                name: string
                _count: { games: number }
              }) => (
                <tr
                  key={system.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {columnVisibility.isColumnVisible('name') && (
                    <td className="px-4 py-2">{system.name}</td>
                  )}
                  {columnVisibility.isColumnVisible('gamesCount') && (
                    <td className="px-4 py-2">{system._count.games} games</td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-4 py-2 flex gap-2 justify-end">
                      <EditButton
                        title="Edit System"
                        onClick={() => openModal(system)}
                      />
                      <DeleteButton
                        title="Delete System"
                        onClick={() => handleDelete(system.id)}
                        isLoading={deleteSystem.isPending}
                        disabled={deleteSystem.isPending}
                      />
                    </td>
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <SystemModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        systemName={systemName}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default AdminSystemsPage
