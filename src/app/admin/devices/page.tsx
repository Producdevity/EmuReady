'use client'

import { Cog } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminTableContainer,
  AdminSearchFilters,
  AdminStatsDisplay,
  AdminPageLayout,
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
  PlatformBadge,
  PlatformChipList,
  ViewButton,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import DeviceModal from './components/DeviceModal'
import DeviceViewModal from './components/DeviceViewModal'

type DeviceSortField = 'brand' | 'modelName' | 'soc' | 'listings'
type DeviceData = RouterOutput['devices']['get']['devices'][number]

const DEVICES_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'soc', label: 'SoC', defaultVisible: true },
  { key: 'platforms', label: 'Platforms', defaultVisible: true },
  { key: 'defaultPlatform', label: 'Default', defaultVisible: true },
  { key: 'listings', label: 'Listings', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminDevicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editIdFromUrl = searchParams.get('editId')

  const table = useAdminTable<DeviceSortField>({
    defaultSortField: 'brand',
    defaultSortDirection: 'asc',
  })

  const columnVisibility = useColumnVisibility(DEVICES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminDevices,
  })

  const devicesQuery = api.devices.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? null : table.debouncedSearch,
    sortField: table.sortField ?? null,
    sortDirection: table.sortDirection ?? null,
    limit: table.limit,
    page: table.page,
    brandId: table.additionalParams.brandId || null,
    platformId: table.additionalParams.platformId || null,
  })

  const devicesStatsQuery = api.devices.stats.useQuery()
  const brandsQuery = api.deviceBrands.get.useQuery({ limit: 100 })
  const platformsQuery = api.platforms.get.useQuery()
  const deleteDevice = api.devices.delete.useMutation()
  const confirm = useConfirmDialog()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewDevice, setViewDevice] = useState<DeviceData | null>(null)
  const [primedEditDevice, setPrimedEditDevice] = useState<DeviceData | null>(null)

  const editFetch = api.devices.byId.useQuery(
    { id: editIdFromUrl ?? '' },
    { enabled: !!editIdFromUrl && primedEditDevice?.id !== editIdFromUrl },
  )

  const editDevice: DeviceData | null = editIdFromUrl
    ? primedEditDevice && primedEditDevice.id === editIdFromUrl
      ? primedEditDevice
      : (editFetch.data ?? null)
    : null

  const isEditModalOpen = !!editIdFromUrl
  const utils = api.useUtils()

  const userQuery = api.users.me.useQuery()
  const canManageDevices = hasPermission(userQuery.data?.permissions, PERMISSIONS.MANAGE_DEVICES)

  const setEditIdParam = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('editId', id)
    else params.delete('editId')
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
  }

  const openAddModal = () => setAddModalOpen(true)

  const openEditModal = (device: DeviceData) => {
    setPrimedEditDevice(device)
    setEditIdParam(device.id)
  }

  const closeModal = () => {
    if (addModalOpen) setAddModalOpen(false)
    if (isEditModalOpen) {
      setPrimedEditDevice(null)
      setEditIdParam(null)
    }
  }

  const openViewModal = (device: DeviceData) => setViewDevice(device)
  const closeViewModal = () => setViewDevice(null)

  const handleModalSuccess = () => {
    utils.devices.get.invalidate().catch(console.error)
    utils.devices.stats.invalidate().catch(console.error)
    if (editIdFromUrl) utils.devices.byId.invalidate({ id: editIdFromUrl }).catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Device',
      description: 'Are you sure you want to delete this device? This action cannot be undone.',
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
    <AdminPageLayout
      title="Devices"
      description="Manage all gaming devices and hardware"
      headerActions={
        <>
          <ColumnVisibilityControl columns={DEVICES_COLUMNS} columnVisibility={columnVisibility} />
          {canManageDevices && <Button onClick={openAddModal}>Add Device</Button>}
        </>
      }
    >
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
          isLoading={devicesStatsQuery.isPending}
        />
      )}

      <AdminSearchFilters<DeviceSortField>
        searchPlaceholder="Search devices..."
        table={table}
        onClear={() => {
          table.setAdditionalParam('brandId', '')
          table.setAdditionalParam('platformId', '')
        }}
      >
        <Autocomplete
          value={table.additionalParams.platformId || ''}
          onChange={(value) => table.setAdditionalParam('platformId', value || '')}
          items={[{ id: '', name: 'All Platforms' }, ...(platformsQuery.data || [])]}
          optionToValue={(platform) => platform.id}
          optionToLabel={(platform) => platform.name}
          className="w-full md:w-64"
          placeholder="Filter by platform"
          filterKeys={['name']}
        />
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
        {devicesQuery.isPending ? (
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
                {columnVisibility.isColumnVisible('platforms') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Platforms
                  </th>
                )}
                {columnVisibility.isColumnVisible('defaultPlatform') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Default
                  </th>
                )}
                {columnVisibility.isColumnVisible('listings') && (
                  <SortableHeader
                    label="Listings"
                    field="listings"
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
                  {columnVisibility.isColumnVisible('platforms') && (
                    <td className="px-6 py-4 text-sm">
                      <PlatformChipList platforms={device.platforms.map((p) => p.platform)} />
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('defaultPlatform') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {device.defaultPlatform ? (
                        <PlatformBadge
                          name={device.defaultPlatform.name}
                          scope={device.defaultPlatform.scope}
                        />
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Not set</span>
                      )}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('listings') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                      {device._count.listings}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ViewButton
                          onClick={() => openViewModal(device)}
                          title="View Device Details"
                        />
                        {canManageDevices && (
                          <EditButton onClick={() => openEditModal(device)} title="Edit Device" />
                        )}
                        {canManageDevices && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            icon={Cog}
                            title="Manage supported platforms + default"
                          >
                            <Link href={`/admin/devices/${device.id}`}>Platforms</Link>
                          </Button>
                        )}
                        {canManageDevices && (
                          <DeleteButton
                            onClick={() => handleDelete(device.id)}
                            title="Delete Device"
                            isLoading={deleteDevice.isPending}
                            disabled={deleteDevice.isPending}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!devicesQuery.isPending && devicesQuery.data?.devices.length === 0 && (
                <tr>
                  <td
                    colSpan={columnVisibility.visibleColumns.size}
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
        <Pagination
          page={table.page}
          totalPages={devicesQuery.data.pagination.pages}
          totalItems={devicesQuery.data.pagination.total}
          itemsPerPage={devicesQuery.data.pagination.limit}
          onPageChange={(newPage) => table.setPage(newPage)}
        />
      )}

      <DeviceModal
        key={editIdFromUrl ?? 'add'}
        isOpen={addModalOpen || (isEditModalOpen && editDevice !== null)}
        onClose={closeModal}
        editId={editIdFromUrl}
        deviceData={editDevice}
        onSuccess={handleModalSuccess}
      />

      <DeviceViewModal isOpen={!!viewDevice} onClose={closeViewModal} deviceData={viewDevice} />
    </AdminPageLayout>
  )
}

export default AdminDevicesPage
