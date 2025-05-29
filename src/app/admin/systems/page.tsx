'use client'

import { useState, type FormEvent } from 'react'
import { isEmpty } from 'remeda'
import { Search } from 'lucide-react'
import toast from '@/lib/toast'
import { api } from '@/lib/api'
import storageKeys from '@/data/storageKeys'
import {
  Button,
  Input,
  SortableHeader,
  ColumnVisibilityControl,
} from '@/components/ui'
import { useConfirmDialog } from '@/components/ui'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import getErrorMessage from '@/utils/getErrorMessage'

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
  const createSystem = api.systems.create.useMutation()
  const updateSystem = api.systems.update.useMutation()
  const deleteSystem = api.systems.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const openModal = (system?: { id: string; name: string }) => {
    setEditId(system?.id ?? null)
    setName(system?.name ?? '')
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setName('')
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editId) {
        await updateSystem.mutateAsync({ id: editId, name })
        setSuccess('System updated!')
      } else {
        await createSystem.mutateAsync({ name })
        setSuccess('System created!')
      }
      refetch()
      closeModal()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save system.'))
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete System',
      description:
        'Are you sure you want to delete this system? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteSystem.mutateAsync({ id })
      refetch()
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
                      <Button
                        variant="secondary"
                        onClick={() => openModal(system)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(system.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all">
          <form
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 relative"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
              {editId ? 'Edit System' : 'Add System'}
            </h2>
            <label className="block mb-2 font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mb-4 w-full"
            />
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createSystem.isPending || updateSystem.isPending}
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {editId ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AdminSystemsPage
