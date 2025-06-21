'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import AdminStatsBar from '@/app/admin/components/AdminStatsBar'
import { AdminTableContainer } from '@/components/admin'
import {
  Button,
  Input,
  ColumnVisibilityControl,
  SortableHeader,
  useConfirmDialog,
} from '@/components/ui'
import { DeleteButton, EditButton } from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
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
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    limit: table.limit,
  })
  const brandsStatsQuery = api.deviceBrands.stats.useQuery()
  const deleteBrand = api.deviceBrands.delete.useMutation()
  const confirm = useConfirmDialog()

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

  const handleModalSuccess = () => {
    brandsQuery.refetch().catch(console.error)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Brand',
      description:
        'Are you sure you want to delete this brand? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteBrand.mutateAsync({
        id,
      } satisfies RouterInput['deviceBrands']['delete'])
      brandsQuery.refetch().catch(console.error)
    } catch (err) {
      toast.error(`Failed to delete brand: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Device Brands
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <AdminStatsBar
            stats={[
              {
                label: 'Total',
                value: brandsStatsQuery.data?.total ?? 0,
                color: 'blue',
              },
              {
                label: 'With Devices',
                value: brandsStatsQuery.data?.withDevices ?? 0,
                color: 'green',
              },
              {
                label: 'No Devices',
                value: brandsStatsQuery.data?.withoutDevices ?? 0,
                color: 'gray',
              },
            ]}
            isLoading={brandsStatsQuery.isLoading}
          />
          <ColumnVisibilityControl
            columns={BRANDS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Brand</Button>
        </div>
      </div>

      <div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search brands..."
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
                      <EditButton
                        onClick={() => openModal(brand)}
                        title="Edit Brand"
                      />
                      <DeleteButton
                        onClick={() => handleDelete(brand.id)}
                        title="Delete Brand"
                        isLoading={deleteBrand.isPending}
                        disabled={deleteBrand.isPending}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {brandsQuery.data?.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No brands found. Add your first brand.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
