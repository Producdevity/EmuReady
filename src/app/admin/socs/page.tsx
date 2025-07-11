'use client'

import { Cpu } from 'lucide-react'
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
  SortableHeader,
  useConfirmDialog,
  LoadingSpinner,
  DeleteButton,
  EditButton,
  ViewButton,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import SocModal from './components/SocModal'
import SocViewModal from './components/SocViewModal'

type SocSortField = 'name' | 'manufacturer' | 'devicesCount'
type SocData = RouterOutput['socs']['get']['socs'][number]

const SOCS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'SoC Name', defaultVisible: true },
  { key: 'manufacturer', label: 'Manufacturer', defaultVisible: true },
  { key: 'devicesCount', label: 'Devices', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminSoCsPage() {
  const table = useAdminTable<SocSortField>({
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(SOCS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminSoCs,
  })

  const userQuery = api.users.me.useQuery()
  const isAdmin = hasPermission(userQuery.data?.role, Role.ADMIN)

  const socsQuery = api.socs.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? undefined : table.debouncedSearch,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
  const socsStatsQuery = api.socs.stats.useQuery()
  const deleteSoc = api.socs.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [socData, setSocData] = useState<SocData | null>(null)

  const utils = api.useUtils()

  const openModal = (soc?: SocData) => {
    setEditId(soc?.id ?? null)
    setSocData(soc ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setSocData(null)
  }

  const openViewModal = (soc: SocData) => {
    setSocData(soc)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSocData(null)
  }

  const handleModalSuccess = () => {
    utils.socs.get.invalidate().catch(console.error)
    utils.socs.stats.invalidate().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete SoC',
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    try {
      await deleteSoc.mutateAsync({
        id,
      } satisfies RouterInput['socs']['delete'])
      utils.socs.get.invalidate().catch(console.error)
      utils.socs.stats.invalidate().catch(console.error)
      toast.success('SoC deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete SoC: ${getErrorMessage(err)}`)
    }
  }

  // TODO: use AdminPageLayout like all the other admin pages
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System on Chips (SoCs)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all processors and system on chips
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl
            columns={SOCS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add SoC</Button>
        </div>
      </div>

      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: socsStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'With Devices',
            value: socsStatsQuery.data?.withDevices,
            color: 'green',
          },
          {
            label: 'No Devices',
            value: socsStatsQuery.data?.withoutDevices,
            color: 'gray',
          },
        ]}
        isLoading={socsStatsQuery.isPending}
      />

      <AdminSearchFilters<SocSortField>
        table={table}
        searchPlaceholder="Search SoCs..."
      />

      <AdminTableContainer>
        {socsQuery.isPending ? (
          <LoadingSpinner text="Loading SoCs..." />
        ) : socsQuery.data?.socs.length === 0 ? (
          <AdminTableNoResults icon={Cpu} hasQuery={!!table.search} />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('name') && (
                  <SortableHeader
                    label="SoC Name"
                    field="name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('manufacturer') && (
                  <SortableHeader
                    label="Manufacturer"
                    field="manufacturer"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('devicesCount') && (
                  <SortableHeader
                    label="Devices"
                    field="devicesCount"
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
              {socsQuery.data?.socs.map((soc) => (
                <tr
                  key={soc.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('name') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {soc.name}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('manufacturer') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc.manufacturer}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('devicesCount') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc._count.devices} devices
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ViewButton
                          onClick={() => openViewModal(soc)}
                          title="View SoC Details"
                        />
                        <EditButton
                          onClick={() => openModal(soc)}
                          title="Edit SoC"
                        />
                        {isAdmin && (
                          <DeleteButton
                            onClick={() => handleDelete(soc.id, soc.name)}
                            title="Delete SoC"
                            isLoading={deleteSoc.isPending}
                            disabled={deleteSoc.isPending}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      <SocModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        socData={socData}
        onSuccess={handleModalSuccess}
      />

      <SocViewModal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        socData={socData}
      />
    </div>
  )
}

export default AdminSoCsPage
