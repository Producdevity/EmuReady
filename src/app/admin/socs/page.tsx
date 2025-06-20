'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import AdminStatsBar from '@/app/admin/components/AdminStatsBar'
import {
  Button,
  Input,
  LoadingSpinner,
  ColumnVisibilityControl,
  SortableHeader,
  AdminTableContainer,
  Pagination,
  useConfirmDialog,
} from '@/components/ui'
import DeleteButton from '@/components/ui/table-buttons/DeleteButton'
import EditButton from '@/components/ui/table-buttons/EditButton'
import ViewButton from '@/components/ui/table-buttons/ViewButton'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import SocModal from './components/SocModal'
import SocViewModal from './components/SocViewModal'

type SocSortField = 'name' | 'manufacturer' | 'devicesCount'
type SocData = RouterOutput['socs']['get']['socs'][number]

const SOCS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'manufacturer', label: 'Manufacturer', defaultVisible: true },
  { key: 'architecture', label: 'Architecture', defaultVisible: false },
  { key: 'processNode', label: 'Process Node', defaultVisible: false },
  { key: 'cpuCores', label: 'CPU Cores', defaultVisible: false },
  { key: 'gpuModel', label: 'GPU Model', defaultVisible: false },
  { key: 'devicesCount', label: 'Devices', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminSoCsPage() {
  const table = useAdminTable<SocSortField>()
  const confirm = useConfirmDialog()
  const columnVisibility = useColumnVisibility(SOCS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminSoCs,
  })

  const socQuery = api.socs.get.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })
  const socsStatsQuery = api.socs.stats.useQuery()
  const deleteSoC = api.socs.delete.useMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [socData, setSocData] = useState<SocData | null>(null)

  const socs = socQuery.data?.socs ?? []
  const pagination = socQuery.data?.pagination
  const isLoading = socQuery.isLoading

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
    socQuery.refetch().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete SoC',
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    try {
      await deleteSoC.mutateAsync({
        id,
      } satisfies RouterInput['socs']['delete'])
      socQuery.refetch().catch(console.error)
    } catch (err) {
      toast.error(`Failed to delete SoC: ${getErrorMessage(err)}`)
    }
  }

  const clearFilters = () => {
    table.setSearch('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            System on Chips (SoCs)
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <AdminStatsBar
            stats={[
              {
                label: 'Total',
                value: socsStatsQuery.data?.total ?? 0,
                color: 'blue',
              },
              {
                label: 'With Devices',
                value: socsStatsQuery.data?.withDevices ?? 0,
                color: 'green',
              },
              {
                label: 'No Devices',
                value: socsStatsQuery.data?.withoutDevices ?? 0,
                color: 'gray',
              },
            ]}
            isLoading={socsStatsQuery.isLoading}
          />
          <ColumnVisibilityControl
            columns={SOCS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add SoC</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search SoCs..."
            value={table.search}
            onChange={table.handleSearchChange}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner text="Loading SoCs..." />
        </div>
      )}

      {!isLoading && socs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {table.search
              ? 'No SoCs match your search criteria.'
              : 'No SoCs found.'}
          </p>
        </div>
      )}

      {!isLoading && socs.length > 0 && (
        <AdminTableContainer>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
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
                {columnVisibility.isColumnVisible('manufacturer') && (
                  <SortableHeader
                    label="Manufacturer"
                    field="manufacturer"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('architecture') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Architecture
                  </th>
                )}
                {columnVisibility.isColumnVisible('processNode') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Process Node
                  </th>
                )}
                {columnVisibility.isColumnVisible('cpuCores') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    CPU Cores
                  </th>
                )}
                {columnVisibility.isColumnVisible('gpuModel') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    GPU Model
                  </th>
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
              {socs.map((soc) => (
                <tr
                  key={soc.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('name') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {soc.name}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('manufacturer') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc.manufacturer}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('architecture') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc.architecture ?? '-'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('processNode') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc.processNode ?? '-'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('cpuCores') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc.cpuCores ?? '-'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('gpuModel') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc.gpuModel ?? '-'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('devicesCount') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {soc._count?.devices ?? 0}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <EditButton
                        onClick={() => openModal(soc)}
                        title="Edit SoC"
                      />
                      <ViewButton
                        onClick={() => openViewModal(soc)}
                        title="View SoC"
                      />
                      <DeleteButton
                        onClick={() => handleDelete(soc.id, soc.name)}
                        title="Delete SoC"
                        isLoading={deleteSoC.isPending}
                        disabled={deleteSoC.isPending}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableContainer>
      )}

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={table.setPage}
        />
      )}

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
