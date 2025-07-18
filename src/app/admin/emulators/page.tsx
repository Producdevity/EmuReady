'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import EmulatorModal from '@/app/admin/emulators/components/EmulatorModal'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
  AdminTableNoResults,
} from '@/components/admin'
import { EmulatorIcon } from '@/components/icons'
import {
  Button,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  Pagination,
  useConfirmDialog,
  DisplayToggleButton,
  EditButton,
  DeleteButton,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import {
  useEmulatorLogos,
  useColumnVisibility,
  type ColumnDefinition,
} from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

const actionButtonClasses =
  'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-3 py-1.5 text-sm border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800'

type EmulatorSortField = 'name' | 'systemCount' | 'listingCount'

const EMULATORS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'systemCount', label: 'Systems', defaultVisible: true },
  { key: 'listingCount', label: 'Listings', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminEmulatorsPage() {
  const table = useAdminTable<EmulatorSortField>({ defaultLimit: 20 })
  const utils = api.useUtils()
  const emulatorLogos = useEmulatorLogos()
  const columnVisibility = useColumnVisibility(EMULATORS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminEmulators,
  })

  const emulatorsStatsQuery = api.emulators.getStats.useQuery()
  const emulatorsQuery = api.emulators.get.useQuery({
    search: table.search ?? undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const emulators = emulatorsQuery.data?.emulators ?? []
  const pagination = emulatorsQuery.data?.pagination

  const deleteEmulator = api.emulators.delete.useMutation({
    onSuccess: () => {
      toast.success('Emulator deleted successfully!')
      utils.emulators.get.invalidate().catch(console.error)
      utils.emulators.getStats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete emulator: ${getErrorMessage(err)}`)
    },
  })
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

    deleteEmulator.mutate({
      id,
    } satisfies RouterInput['emulators']['delete'])
  }

  return (
    <AdminPageLayout
      title="Manage Emulators"
      description="Manage emulator software for various gaming systems"
      headerActions={
        <>
          <DisplayToggleButton
            showLogos={emulatorLogos.showEmulatorLogos}
            onToggle={emulatorLogos.toggleEmulatorLogos}
            isHydrated={emulatorLogos.isHydrated}
            logoLabel="Show Emulator Logos"
            nameLabel="Show Emulator Names"
          />
          <ColumnVisibilityControl
            columns={EMULATORS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Emulator</Button>
        </>
      }
    >
      {emulatorsStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total Emulators',
              value: emulatorsStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'With Listings',
              value: emulatorsStatsQuery.data.withListings,
              color: 'green',
            },
            {
              label: 'With Systems',
              value: emulatorsStatsQuery.data.withSystems,
              color: 'purple',
            },
          ]}
          isLoading={emulatorsStatsQuery.isPending}
        />
      )}

      <AdminSearchFilters<EmulatorSortField>
        table={table}
        searchPlaceholder="Search emulators by name..."
      />

      <AdminTableContainer>
        {emulatorsQuery.isPending ? (
          <LoadingSpinner text="Loading emulators..." />
        ) : emulators.length === 0 ? (
          <AdminTableNoResults hasQuery={!!table.search} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {columnVisibility.isColumnVisible('name') && (
                      <SortableHeader
                        label="Name"
                        field="name"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('systemCount') && (
                      <SortableHeader
                        label="Systems"
                        field="systemCount"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('listingCount') && (
                      <SortableHeader
                        label="Listings"
                        field="listingCount"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {emulators.map((emulator) => (
                    <tr
                      key={emulator.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {columnVisibility.isColumnVisible('name') && (
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/emulators/${emulator.id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                          >
                            <EmulatorIcon
                              name={emulator.name}
                              logo={emulator.logo}
                              showLogo={
                                emulatorLogos.isHydrated &&
                                emulatorLogos.showEmulatorLogos
                              }
                            />
                          </Link>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('systemCount') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {emulator._count.systems}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('listingCount') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {emulator._count.listings}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/emulators/${emulator.id}/custom-fields`}
                              className={actionButtonClasses}
                            >
                              <Settings className="mr-2 h-4 w-4" /> Custom
                              Fields
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
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </AdminTableContainer>

      {modalOpen && (
        <EmulatorModal
          editId={editId}
          emulatorName={emulatorName}
          onClose={closeModal}
          onSuccess={() => {
            utils.emulators.get.invalidate().catch(console.error)
            utils.emulators.getStats.invalidate().catch(console.error)
            closeModal()
          }}
        />
      )}
    </AdminPageLayout>
  )
}

export default AdminEmulatorsPage
