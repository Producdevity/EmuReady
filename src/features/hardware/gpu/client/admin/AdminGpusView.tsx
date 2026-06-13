'use client'

import { useState } from 'react'
import {
  AdminPageLayout,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminTableContainer,
} from '@/components/admin'
import {
  Autocomplete,
  Button,
  ColumnVisibilityControl,
  LoadingSpinner,
  Pagination,
  useConfirmDialog,
} from '@/components/ui'
import { PAGINATION } from '@/data/constants'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { useAdminTable } from '@/hooks/admin'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { GpuFormModal } from './GpuFormModal'
import { GpuTable } from './GpuTable'
import { GpuViewModal } from './GpuViewModal'
import type { GpuDetail, GpuSortField } from '../../shared/gpu.types'

const GPUS_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'listings', label: 'PC Reports', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

export default function AdminGpusView() {
  const table = useAdminTable<GpuSortField>({
    defaultSortField: 'brand',
    defaultSortDirection: 'asc',
  })
  const search = table.debouncedSearch.trim()

  const columnVisibility = useColumnVisibility(GPUS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminGpus,
  })

  const gpusQuery = api.gpus.get.useQuery({
    search: search || undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
    page: table.page,
    brandId: table.additionalParams.brandId || undefined,
  })

  const gpusStatsQuery = api.gpus.stats.useQuery()
  const brandsQuery = api.deviceBrands.get.useQuery({
    limit: PAGINATION.MAX_LIMIT,
    category: 'gpu',
  })
  const deleteGpu = api.gpus.delete.useMutation()
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery()
  const canManageDevices = hasPermission(userQuery.data?.permissions, PERMISSIONS.MANAGE_DEVICES)

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedGpu, setSelectedGpu] = useState<GpuDetail | null>(null)

  const invalidateGpuQueries = () => {
    utils.gpus.get.invalidate().catch(console.error)
    utils.gpus.options.invalidate().catch(console.error)
    utils.gpus.stats.invalidate().catch(console.error)
  }

  const openFormModal = (gpu?: GpuDetail) => {
    setSelectedGpu(gpu ?? null)
    setFormModalOpen(true)
  }

  const closeFormModal = () => {
    setFormModalOpen(false)
    setSelectedGpu(null)
  }

  const openViewModal = (gpu: GpuDetail) => {
    setSelectedGpu(gpu)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSelectedGpu(null)
  }

  const handleFormSuccess = () => {
    invalidateGpuQueries()
    closeFormModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete GPU',
      description: 'Are you sure you want to delete this GPU? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteGpu.mutateAsync({ id })
      invalidateGpuQueries()
      toast.success('GPU deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete GPU: ${getErrorMessage(err)}`)
    }
  }

  return (
    <AdminPageLayout
      title="GPUs"
      description="Manage GPU models for PC Compatibility Reports"
      headerActions={
        <>
          <ColumnVisibilityControl columns={GPUS_COLUMNS} columnVisibility={columnVisibility} />
          {canManageDevices && <Button onClick={() => openFormModal()}>Add GPU</Button>}
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: gpusStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'With Reports',
            value: gpusStatsQuery.data?.withListings,
            color: 'green',
          },
          {
            label: 'No Reports',
            value: gpusStatsQuery.data?.withoutListings,
            color: 'gray',
          },
        ]}
        isLoading={gpusStatsQuery.isPending}
      />

      <AdminSearchFilters<GpuSortField>
        table={table}
        searchPlaceholder="Search GPUs..."
        onClear={() => table.setAdditionalParam('brandId', '')}
      >
        <Autocomplete
          value={table.additionalParams.brandId || ''}
          onChange={(value) => table.setAdditionalParam('brandId', value || '')}
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
          <GpuTable
            gpus={gpusQuery.data?.gpus ?? []}
            hasQuery={!!search || !!table.additionalParams.brandId}
            canManageDevices={canManageDevices}
            isDeleting={deleteGpu.isPending}
            columnVisibility={columnVisibility}
            sortField={table.sortField}
            sortDirection={table.sortDirection}
            onSort={table.handleSort}
            onView={openViewModal}
            onEdit={openFormModal}
            onDelete={handleDelete}
          />
        )}
      </AdminTableContainer>

      {gpusQuery.data && gpusQuery.data.pagination.pages > 1 && (
        <Pagination
          page={table.page}
          totalPages={gpusQuery.data.pagination.pages}
          totalItems={gpusQuery.data.pagination.total}
          itemsPerPage={gpusQuery.data.pagination.limit}
          onPageChange={table.setPage}
        />
      )}

      <GpuFormModal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        gpuData={selectedGpu}
        onSuccess={handleFormSuccess}
      />

      <GpuViewModal isOpen={viewModalOpen} onClose={closeViewModal} gpuData={selectedGpu} />
    </AdminPageLayout>
  )
}
