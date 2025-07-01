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
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import DeviceModal from './components/DeviceModal'
import DeviceViewModal from './components/DeviceViewModal'

type DeviceSortField = 'brand' | 'modelName' | 'soc'
type DeviceData = RouterOutput['devices']['get']['devices'][number]

const DEVICES_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'soc', label: 'SoC', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminDevicesPage() {
  const table = useAdminTable<DeviceSortField>({
    defaultSortField: 'brand',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(DEVICES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminDevices,
  })

  const devicesQuery = api.devices.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? undefined : table.debouncedSearch,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
    page: table.page,
    brandId: table.additionalParams.brandId || undefined,
  })

  const devicesStatsQuery = api.devices.stats.useQuery()
  const brandsQuery = api.deviceBrands.get.useQuery({ limit: 100 })
  const deleteDevice = api.devices.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null)

  const utils = api.useUtils()

  const openModal = (device?: DeviceData) => {
    setEditId(device?.id ?? null)
    setDeviceData(device ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setDeviceData(null)
  }

  const openViewModal = (device: DeviceData) => {
    setDeviceData(device)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setDeviceData(null)
  }

  const handleModalSuccess = () => {
    utils.devices.get.invalidate().catch(console.error)
    utils.devices.stats.invalidate().catch(console.error)
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
      title: 'Delete Device',
      description:
        'Are you sure you want to delete this device? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteDevice.mutateAsync({
        id,
      } satisfies RouterInput['devices']['delete'])
      utils.devices.get.invalidate().catch(console.error)
      utils.devices.stats.invalidate().catch(console.error)
      toast.success('Device deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete device: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Devices
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all gaming devices and hardware
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl
            columns={DEVICES_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Device</Button>
        </div>
      </div>

      {devicesStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total',
              value: devicesStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'With Listings',
              value: devicesStatsQuery.data.withListings,
              color: 'green',
            },
            {
              label: 'No Listings',
              value: devicesStatsQuery.data.withoutListings,
              color: 'gray',
            },
          ]}
          isLoading={devicesStatsQuery.isLoading}
        />
      )}

      <AdminSearchFilters
        searchValue={table.search}
        onSearchChange={(value) => table.setSearch(value)}
        searchPlaceholder="Search devices..."
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
        {devicesQuery.isLoading ? (
          <LoadingSpinner text="Loading devices..." />
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
                {columnVisibility.isColumnVisible('soc') && (
                  <SortableHeader
                    label="SoC"
                    field="soc"
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
              {devicesQuery.data?.devices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('brand') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {device.brand.name}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('model') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {device.modelName}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('soc') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {device.soc?.name ?? 'No SoC assigned'}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ViewButton
                          onClick={() => openViewModal(device)}
                          title="View Device Details"
                        />
                        <EditButton
                          onClick={() => openModal(device)}
                          title="Edit Device"
                        />
                        <DeleteButton
                          onClick={() => handleDelete(device.id)}
                          title="Delete Device"
                          isLoading={deleteDevice.isPending}
                          disabled={deleteDevice.isPending}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!devicesQuery.isLoading &&
                devicesQuery.data?.devices.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      {table.search || table.additionalParams.brandId
                        ? 'No devices found matching your search.'
                        : 'No devices found. Add your first device.'}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      {devicesQuery.data && devicesQuery.data.pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPage(table.page - 1)}
              disabled={table.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {table.page} of {devicesQuery.data.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPage(table.page + 1)}
              disabled={table.page === devicesQuery.data.pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <DeviceModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        deviceData={deviceData}
        onSuccess={handleModalSuccess}
      />

      <DeviceViewModal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        deviceData={deviceData}
      />
    </div>
  )
}

export default AdminDevicesPage
