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
  Badge,
  Button,
  ColumnVisibilityControl,
  SortableHeader,
  useConfirmDialog,
  Autocomplete,
  LoadingSpinner,
  DeleteButton,
  EditButton,
  ViewButton,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import CpuModal from './components/CpuModal'
import CpuViewModal from './components/CpuViewModal'

type CpuSortField = 'brand' | 'modelName'
type CpuData = RouterOutput['cpus']['get']['cpus'][number]

const CPUS_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'listings', label: 'PC Listings', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminCpusPage() {
  const table = useAdminTable<CpuSortField>({
    defaultSortField: 'brand',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(CPUS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminCpus,
  })

  const cpusQuery = api.cpus.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? undefined : table.debouncedSearch,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
    page: table.page,
    brandId: table.additionalParams.brandId || undefined,
  })

  const cpusStatsQuery = api.cpus.stats.useQuery()
  const brandsQuery = api.deviceBrands.get.useQuery({ limit: 100 })
  const deleteCpu = api.cpus.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [cpuData, setCpuData] = useState<CpuData | null>(null)

  const utils = api.useUtils()

  const userQuery = api.users.me.useQuery()
  const isAdmin = hasPermission(userQuery.data?.role, Role.ADMIN)

  // TODO: Temporary fix for brands query
  // only keep 'Intel', 'AMD', and 'Apple' brands
  const brands = (brandsQuery.data || []).filter((brand) =>
    ['intel', 'amd', 'apple'].includes(brand.name.toLowerCase()),
  )

  const openModal = (cpu?: CpuData) => {
    setEditId(cpu?.id ?? null)
    setCpuData(cpu ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setCpuData(null)
  }

  const openViewModal = (cpu: CpuData) => {
    setCpuData(cpu)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setCpuData(null)
  }

  const handleModalSuccess = () => {
    utils.cpus.get.invalidate().catch(console.error)
    utils.cpus.stats.invalidate().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete CPU',
      description:
        'Are you sure you want to delete this CPU? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteCpu.mutateAsync({
        id,
      } satisfies RouterInput['cpus']['delete'])
      utils.cpus.get.invalidate().catch(console.error)
      utils.cpus.stats.invalidate().catch(console.error)
      toast.success('CPU deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete CPU: ${getErrorMessage(err)}`)
    }
  }

  // TODO: use AdminPageLayout like all the other admin pages
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            CPUs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all CPU models for PC compatibility listings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl
            columns={CPUS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add CPU</Button>
        </div>
      </div>

      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: cpusStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'With Listings',
            value: cpusStatsQuery.data?.withListings,
            color: 'green',
          },
          {
            label: 'No Listings',
            value: cpusStatsQuery.data?.withoutListings,
            color: 'gray',
          },
        ]}
        isLoading={cpusStatsQuery.isPending}
      />

      <AdminSearchFilters<CpuSortField>
        table={table}
        searchPlaceholder="Search CPUs..."
        onClear={() => table.setAdditionalParam('brandId', '')}
      >
        <Autocomplete
          value={table.additionalParams.brandId || ''}
          onChange={(value) => table.setAdditionalParam('brandId', value || '')}
          items={[{ id: '', name: 'All Brands' }, ...brands]}
          optionToValue={(brand) => brand.id}
          optionToLabel={(brand) => brand.name}
          className="w-full md:w-64"
          placeholder="Filter by brand"
          filterKeys={['name']}
        />
      </AdminSearchFilters>

      <AdminTableContainer>
        {cpusQuery.isPending ? (
          <LoadingSpinner text="Loading CPUs..." />
        ) : cpusQuery.data?.cpus.length === 0 ? (
          <AdminTableNoResults
            icon={Cpu}
            hasQuery={!!table.search || !!table.additionalParams.brandId}
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('brand') && (
                  <SortableHeader
                    label="Brand"
                    field="brand"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('model') && (
                  <SortableHeader
                    label="Model"
                    field="modelName"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('listings') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    PC Listings
                  </th>
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cpusQuery.data?.cpus.map((cpu) => (
                <tr
                  key={cpu.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('brand') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cpu.brand.name}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('model') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cpu.modelName}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('listings') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <Badge>{cpu._count.pcListings}</Badge>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ViewButton
                          onClick={() => openViewModal(cpu)}
                          title="View CPU Details"
                        />
                        <EditButton
                          onClick={() => openModal(cpu)}
                          title="Edit CPU"
                        />
                        {isAdmin && (
                          <DeleteButton
                            onClick={() => handleDelete(cpu.id)}
                            title="Delete CPU"
                            isLoading={deleteCpu.isPending}
                            disabled={deleteCpu.isPending}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!cpusQuery.isPending && cpusQuery.data?.cpus.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {table.search || table.additionalParams.brandId
                      ? 'No CPUs found matching your search.'
                      : 'No CPUs found. Add your first CPU.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      {cpusQuery.data && cpusQuery.data.pagination.pages > 1 && (
        <Pagination
          currentPage={table.page}
          totalPages={cpusQuery.data.pagination.pages}
          totalItems={cpusQuery.data.pagination.total}
          itemsPerPage={cpusQuery.data.pagination.limit}
          onPageChange={(newPage) => table.setPage(newPage)}
        />
      )}

      <CpuModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        cpuData={cpuData}
        onSuccess={handleModalSuccess}
      />

      <CpuViewModal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        cpuData={cpuData}
      />
    </div>
  )
}

export default AdminCpusPage
