'use client'

import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import { AdminTableContainer, AdminSearchFilters, AdminStatsDisplay } from '@/components/admin'
import {
  Button,
  ColumnVisibilityControl,
  SortableHeader,
  useConfirmDialog,
  LoadingSpinner,
  DeleteButton,
  EditButton,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import BrandModal from './components/BrandModal'

type DeviceBrandSortField = 'name' | 'devicesCount'

const BRANDS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Brand Name', defaultVisible: true },
  { key: 'devicesCount', label: 'Devices', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminBrandsPage() {
  const table = useAdminTable<DeviceBrandSortField>()
  const columnVisibility = useColumnVisibility(BRANDS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminBrands,
  })

  const brandsQuery = api.deviceBrands.get.useQuery({
    search: isEmpty(table.debouncedSearch) ? undefined : table.debouncedSearch,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
  })
  const brandsStatsQuery = api.deviceBrands.stats.useQuery()
  const deleteBrand = api.deviceBrands.delete.useMutation()
  const confirm = useConfirmDialog()

  const userQuery = api.users.me.useQuery()
  const canManageDevices = hasPermission(userQuery.data?.permissions, PERMISSIONS.MANAGE_DEVICES)

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')

  const openModal = (brand?: { id: string; name: string }) => {
    setEditId(brand?.id ?? null)
    setBrandName(brand?.name ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setBrandName('')
  }

  const utils = api.useUtils()

  const handleModalSuccess = () => {
    utils.deviceBrands.get.invalidate().catch(console.error)
    utils.deviceBrands.stats.invalidate().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Brand',
      description: 'Are you sure you want to delete this brand? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteBrand.mutateAsync({
        id,
      } satisfies RouterInput['deviceBrands']['delete'])
      utils.deviceBrands.get.invalidate().catch(console.error)
      utils.deviceBrands.stats.invalidate().catch(console.error)
    } catch (err) {
      toast.error(`Failed to delete brand: ${getErrorMessage(err)}`)
    }
  }

  // TODO: use AdminPageLayout like all the other admin pages
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Device Brands</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all device brands in the system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ColumnVisibilityControl columns={BRANDS_COLUMNS} columnVisibility={columnVisibility} />
          {canManageDevices && <Button onClick={() => openModal()}>Add Brand</Button>}
        </div>
      </div>

      {brandsStatsQuery.data && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total',
              value: brandsStatsQuery.data.total,
              color: 'blue',
            },
            {
              label: 'With Devices',
              value: brandsStatsQuery.data.withDevices,
              color: 'green',
            },
            {
              label: 'No Devices',
              value: brandsStatsQuery.data.withoutDevices,
              color: 'gray',
            },
          ]}
          isLoading={brandsStatsQuery.isPending}
        />
      )}

      <AdminSearchFilters<DeviceBrandSortField>
        table={table}
        searchPlaceholder="Search brands..."
      />

      <AdminTableContainer>
        {brandsQuery.isPending ? (
          <LoadingSpinner text="Loading brands..." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('name') && (
                  <SortableHeader
                    label="Brand Name"
                    field="name"
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
              {brandsQuery.data?.map((brand) => (
                <tr
                  key={brand.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('name') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {brand.name}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('devicesCount') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {brand._count.devices} devices
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {canManageDevices && (
                          <EditButton onClick={() => openModal(brand)} title="Edit Brand" />
                        )}
                        {canManageDevices && (
                          <DeleteButton
                            onClick={() => handleDelete(brand.id)}
                            title="Delete Brand"
                            isLoading={deleteBrand.isPending}
                            disabled={deleteBrand.isPending}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!brandsQuery.isPending && brandsQuery.data?.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {table.search
                      ? 'No brands found matching your search.'
                      : 'No brands found. Add your first brand.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AdminTableContainer>
      <BrandModal
        isOpen={modalOpen}
        onClose={closeModal}
        editId={editId}
        brandName={brandName}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
export default AdminBrandsPage
