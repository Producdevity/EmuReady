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
import { CpuFormModal } from './CpuFormModal'
import { CpuTable } from './CpuTable'
import { CpuViewModal } from './CpuViewModal'
import type { CpuDetail, CpuSortField } from '../../shared/cpu.types'

const CPUS_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'listings', label: 'PC Reports', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

export default function AdminCpusView() {
  const table = useAdminTable<CpuSortField>({
    defaultSortField: 'brand',
    defaultSortDirection: 'asc',
  })
  const search = table.debouncedSearch.trim()

  const columnVisibility = useColumnVisibility(CPUS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminCpus,
  })

  const cpusQuery = api.cpus.get.useQuery({
    search: search || undefined,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
    page: table.page,
    brandId: table.additionalParams.brandId || undefined,
  })

  const cpusStatsQuery = api.cpus.stats.useQuery()
  const brandsQuery = api.deviceBrands.get.useQuery({
    limit: PAGINATION.MAX_LIMIT,
    category: 'cpu',
  })
  const deleteCpu = api.cpus.delete.useMutation()
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery()
  const canManageDevices = hasPermission(userQuery.data?.permissions, PERMISSIONS.MANAGE_DEVICES)

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedCpu, setSelectedCpu] = useState<CpuDetail | null>(null)

  const invalidateCpuQueries = () => {
    utils.cpus.get.invalidate().catch(console.error)
    utils.cpus.options.invalidate().catch(console.error)
    utils.cpus.stats.invalidate().catch(console.error)
  }

  const openFormModal = (cpu?: CpuDetail) => {
    setSelectedCpu(cpu ?? null)
    setFormModalOpen(true)
  }

  const closeFormModal = () => {
    setFormModalOpen(false)
    setSelectedCpu(null)
  }

  const openViewModal = (cpu: CpuDetail) => {
    setSelectedCpu(cpu)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setSelectedCpu(null)
  }

  const handleFormSuccess = () => {
    invalidateCpuQueries()
    closeFormModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete CPU',
      description: 'Are you sure you want to delete this CPU? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteCpu.mutateAsync({ id })
      invalidateCpuQueries()
      toast.success('CPU deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete CPU: ${getErrorMessage(err)}`)
    }
  }

  return (
    <AdminPageLayout
      title="CPUs"
      description="Manage CPU models for PC Compatibility Reports"
      headerActions={
        <>
          <ColumnVisibilityControl columns={CPUS_COLUMNS} columnVisibility={columnVisibility} />
          {canManageDevices && <Button onClick={() => openFormModal()}>Add CPU</Button>}
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total',
            value: cpusStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'With Reports',
            value: cpusStatsQuery.data?.withListings,
            color: 'green',
          },
          {
            label: 'No Reports',
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
          items={[{ id: '', name: 'All Brands' }, ...(brandsQuery.data || [])]}
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
        ) : (
          <CpuTable
            cpus={cpusQuery.data?.cpus ?? []}
            hasQuery={!!search || !!table.additionalParams.brandId}
            canManageDevices={canManageDevices}
            isDeleting={deleteCpu.isPending}
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

      {cpusQuery.data && cpusQuery.data.pagination.pages > 1 && (
        <Pagination
          page={table.page}
          totalPages={cpusQuery.data.pagination.pages}
          totalItems={cpusQuery.data.pagination.total}
          itemsPerPage={cpusQuery.data.pagination.limit}
          onPageChange={table.setPage}
        />
      )}

      <CpuFormModal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        cpuData={selectedCpu}
        onSuccess={handleFormSuccess}
      />

      <CpuViewModal isOpen={viewModalOpen} onClose={closeViewModal} cpuData={selectedCpu} />
    </AdminPageLayout>
  )
}
