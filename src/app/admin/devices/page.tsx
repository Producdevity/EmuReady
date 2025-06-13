'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import DeleteButton from '@/app/admin/components/table-buttons/DeleteButton'
import EditButton from '@/app/admin/components/table-buttons/EditButton'
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
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import DeviceModal from './components/DeviceModal'

type DeviceSortField = 'brand' | 'modelName' | 'soc'

const DEVICES_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'soc', label: 'SoC', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminDevicesPage() {
  const table = useAdminTable<DeviceSortField>()
  const confirm = useConfirmDialog()
  const columnVisibility = useColumnVisibility(DEVICES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminDevices,
  })

  const devicesQuery = api.devices.get.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })
  const deleteDevice = api.devices.delete.useMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deviceData, setDeviceData] = useState<{
    id: string
    brand: { id: string; name: string }
    modelName: string
    soc?: { id: string; name: string } | null
  } | null>(null)

  const devices = devicesQuery.data?.devices ?? []
  const pagination = devicesQuery.data?.pagination

  const openModal = (device?: {
    id: string
    brand: { id: string; name: string }
    modelName: string
    soc?: { id: string; name: string } | null
  }) => {
    setEditId(device?.id ?? null)
    setDeviceData(device ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setDeviceData(null)
  }

  const handleModalSuccess = () => {
    devicesQuery.refetch().catch(console.error)
    closeModal()
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
      devicesQuery.refetch().catch(console.error)
    } catch (err) {
      toast.error(`Failed to delete device: ${getErrorMessage(err)}`)
    }
  }

  const isLoading = devicesQuery.isLoading

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Manage Devices
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ColumnVisibilityControl
            columns={DEVICES_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Device</Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search devices..."
            value={table.search}
            onChange={table.handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      <AdminTableContainer>
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
            {isLoading && (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <LoadingSpinner size="lg" text="Loading..." />
                </td>
              </tr>
            )}
            {devices?.map((dev) => (
              <tr
                key={dev.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                {columnVisibility.isColumnVisible('brand') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dev.brand.name}
                  </td>
                )}
                {columnVisibility.isColumnVisible('model') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dev.modelName}
                  </td>
                )}
                {columnVisibility.isColumnVisible('soc') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dev.soc?.name}
                  </td>
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <EditButton
                        onClick={() => openModal(dev)}
                        title="Edit Device"
                      />
                      <DeleteButton
                        onClick={() => handleDelete(dev.id)}
                        title="Delete Device"
                        isLoading={deleteDevice.isPending}
                        disabled={deleteDevice.isPending}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!isLoading && devices.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <p className="text-gray-600 dark:text-gray-400">
                    {table.search
                      ? 'No devices match your search criteria.'
                      : 'No devices found.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={table.setPage}
        />
      )}

      <DeviceModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        deviceData={deviceData}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default AdminDevicesPage
