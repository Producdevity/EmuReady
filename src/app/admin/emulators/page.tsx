'use client'

import { Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import EmulatorModal from '@/app/admin/emulators/components/EmulatorModal'
import EmulatorIcon from '@/components/icons/EmulatorIcon'
import {
  Button,
  Input,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  Pagination,
  useConfirmDialog,
} from '@/components/ui'
import DisplayToggleButton from '@/components/ui/DisplayToggleButton'
import { EditButton, DeleteButton } from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import useEmulatorLogos from '@/hooks/useEmulatorLogos'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

const actionButtonClasses =
  'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-3 py-1.5 text-sm border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800'

type EmulatorSortField = 'name'

const EMULATORS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'systemCount', label: 'Systems', defaultVisible: true },
  { key: 'listingCount', label: 'Listings', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminEmulatorsPage() {
  const table = useAdminTable<EmulatorSortField>()

  const columnVisibility = useColumnVisibility(EMULATORS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminEmulators,
  })

  const {
    showEmulatorLogos,
    toggleEmulatorLogos,
    isHydrated: isEmulatorLogosHydrated,
  } = useEmulatorLogos()

  const emulatorsQuery = api.emulators.get.useQuery({
    search: table.search ?? undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const emulators = emulatorsQuery.data?.emulators ?? []
  const pagination = emulatorsQuery.data?.pagination

  const deleteEmulator = api.emulators.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [emulatorName, setEmulatorName] = useState('')

  const openModal = (emulator?: { id: string; name: string }) => {
    setEditId(emulator?.id ?? null)
    setEmulatorName(emulator?.name ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setEmulatorName('')
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Emulator',
      description:
        'Are you sure you want to delete this emulator? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteEmulator.mutateAsync({
        id,
      } satisfies RouterInput['emulators']['delete'])
      emulatorsQuery.refetch().catch(console.error)
      toast.success('Emulator deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete emulator: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Manage Emulators
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage emulator software for various gaming systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DisplayToggleButton
            showLogos={showEmulatorLogos}
            onToggle={toggleEmulatorLogos}
            isHydrated={isEmulatorLogosHydrated}
            logoLabel="Show Emulator Logos"
            nameLabel="Show Emulator Names"
          />
          <ColumnVisibilityControl
            columns={EMULATORS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Emulator</Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search emulators by name..."
              value={table.search}
              onChange={table.handleSearchChange}
              className="w-full pl-10"
            />
          </div>
        </div>
        {table.search && (
          <Button variant="outline" onClick={() => table.setSearch('')}>
            Clear Filters
          </Button>
        )}
      </div>

      {emulatorsQuery.isLoading && (
        <LoadingSpinner text="Loading emulators..." />
      )}

      {!emulatorsQuery.isLoading && emulators.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {table.search
              ? 'No emulators match your search criteria.'
              : 'No emulators found.'}
          </p>
        </div>
      )}

      {!emulatorsQuery.isLoading && emulators.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
            <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
              <tr>
                {columnVisibility.isColumnVisible('name') && (
                  <SortableHeader
                    label="Name"
                    field="name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('systemCount') && (
                  <SortableHeader
                    label="Systems"
                    field="systemCount"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('listingCount') && (
                  <SortableHeader
                    label="Listings"
                    field="listingCount"
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
              {emulators.map((emulator) => (
                <tr
                  key={emulator.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {columnVisibility.isColumnVisible('name') && (
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/emulators/${emulator.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                      >
                        <EmulatorIcon
                          name={emulator.name}
                          logo={emulator.logo}
                          showLogo={
                            isEmulatorLogosHydrated && showEmulatorLogos
                          }
                        />
                      </Link>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('systemCount') && (
                    <td className="px-4 py-2">{emulator._count.systems}</td>
                  )}
                  {columnVisibility.isColumnVisible('listingCount') && (
                    <td className="px-4 py-2">{emulator._count.listings}</td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-4 py-2 flex gap-2 justify-end">
                      <Link
                        href={`/admin/emulators/${emulator.id}/custom-fields`}
                        className={actionButtonClasses}
                      >
                        <Settings className="mr-2 h-4 w-4" /> Custom Fields
                      </Link>
                      <EditButton
                        href={`/admin/emulators/${emulator.id}`}
                        title="Edit Emulator"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openModal(emulator)}
                      >
                        Quick Edit
                      </Button>
                      <DeleteButton
                        onClick={() => handleDelete(emulator.id)}
                        title="Delete Emulator"
                        isLoading={deleteEmulator.isPending}
                        disabled={deleteEmulator.isPending}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={table.setPage}
        />
      )}

      {modalOpen && (
        <EmulatorModal
          editId={editId}
          emulatorName={emulatorName}
          onClose={closeModal}
          onSuccess={() => {
            emulatorsQuery.refetch().catch(console.error)
            closeModal()
          }}
        />
      )}
    </div>
  )
}

export default AdminEmulatorsPage
