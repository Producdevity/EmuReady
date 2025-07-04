'use client'

import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminTableContainer,
  AdminSearchFilters,
  AdminStatsDisplay,
} from '@/components/admin'
import {
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
import GpuModal from './components/GpuModal'
import GpuViewModal from './components/GpuViewModal'

type GpuSortField = 'brand' | 'modelName'
type GpuData = RouterOutput['gpus']['get']['gpus'][number]

const GPUS_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'listings', label: 'PC Listings', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminGpusPage() {
  const table = useAdminTable<GpuSortField>({
    defaultSortField: 'brand',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(GPUS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminGpus,
  })

  const gpusQuery = api.gpus.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? undefined : table.debouncedSearch,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
    page: table.page,
    brandId: table.additionalParams.brandId || undefined,
  })

  const gpusStatsQuery = api.gpus.stats.useQuery()
  const brandsQuery = api.deviceBrands.get.useQuery({ limit: 100 })
  const deleteGpu = api.gpus.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [gpuData, setGpuData] = useState<GpuData | null>(null)

  const utils = api.useUtils()

  const openModal = (gpu?: GpuData) => {
    setEditId(gpu?.id ?? null)
    setGpuData(gpu ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setGpuData(null)
  }

  const openViewModal = (gpu: GpuData) => {
    setGpuData(gpu)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setGpuData(null)
  }

  const handleModalSuccess = () => {
    utils.gpus.get.invalidate().catch(console.error)
    utils.gpus.stats.invalidate().catch(console.error)
    closeModal()
  }

  const handleBrandChange = (value: string | null) => {
    table.setAdditionalParam('brandId', value || '')
  }

  const clearFilters = () => {
    table.setSearch('')
    table.setAdditionalParam('brandId', '')
    table.setPage(1)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete GPU',
      description:
        'Are you sure you want to delete this GPU? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteGpu.mutateAsync({
        id,
      } satisfies RouterInput['gpus']['delete'])
      utils.gpus.get.invalidate().catch(console.error)
      utils.gpus.stats.invalidate().catch(console.error)
      toast.success('GPU deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete GPU: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            GPUs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all GPU models for PC compatibility listings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl
            columns={GPUS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add GPU</Button>
        </div>
      </div>

      {gpusStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total',
              value: gpusStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'With Listings',
              value: gpusStatsQuery.data.withListings,
              color: 'green',
            },
            {
              label: 'No Listings',
              value: gpusStatsQuery.data.withoutListings,
              color: 'gray',
            },
          ]}
          isLoading={gpusStatsQuery.isPending}
        />
      )}

      <AdminSearchFilters
        searchValue={table.search}
        onSearchChange={(value) => table.setSearch(value)}
        searchPlaceholder="Search GPUs..."
        onClear={clearFilters}
      >
        <Autocomplete
          value={table.additionalParams.brandId || ''}
          onChange={handleBrandChange}
          items={[{ id: '', name: 'All Brands' }, ...(brandsQuery.data || [])]}
          optionToValue={(brand) => brand.id}
          optionToLabel={(brand) => brand.name}
          className="w-full md:w-64"
          placeholder="Filter by brand"
          filterKeys={['name']}
        />
      </AdminSearchFilters>

      <AdminTableContainer>
        {gpusQuery.isPending ? (
          <LoadingSpinner text="Loading GPUs..." />
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
              {gpusQuery.data?.gpus.map((gpu) => (
                <tr
                  key={gpu.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('brand') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {gpu.brand.name}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('model') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {gpu.modelName}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('listings') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {gpu._count.pcListings}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ViewButton
                          onClick={() => openViewModal(gpu)}
                          title="View GPU Details"
                        />
                        <EditButton
                          onClick={() => openModal(gpu)}
                          title="Edit GPU"
                        />
                        <DeleteButton
                          onClick={() => handleDelete(gpu.id)}
                          title="Delete GPU"
                          isLoading={deleteGpu.isPending}
                          disabled={deleteGpu.isPending}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!gpusQuery.isPending && gpusQuery.data?.gpus.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {table.search || table.additionalParams.brandId
                      ? 'No GPUs found matching your search.'
                      : 'No GPUs found. Add your first GPU.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      {gpusQuery.data && gpusQuery.data.pagination.pages > 1 && (
        <Pagination
          currentPage={table.page}
          totalPages={gpusQuery.data.pagination.pages}
          totalItems={gpusQuery.data.pagination.total}
          itemsPerPage={gpusQuery.data.pagination.limit}
          onPageChange={(newPage) => table.setPage(newPage)}
        />
      )}

      <GpuModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        gpuData={gpuData}
        onSuccess={handleModalSuccess}
      />

      <GpuViewModal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        gpuData={gpuData}
      />
    </div>
  )
}

export default AdminGpusPage
