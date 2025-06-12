'use client'

import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { isEmpty } from 'remeda'
import {
  Button,
  Input,
  SortableHeader,
  ColumnVisibilityControl,
  AdminTableContainer,
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

  const { data: brands, refetch } = api.deviceBrands.get.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
  const createBrand = api.deviceBrands.create.useMutation()
  const updateBrand = api.deviceBrands.update.useMutation()
  const deleteBrand = api.deviceBrands.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const openModal = (brand?: { id: string; name: string }) => {
    setEditId(brand?.id ?? null)
    setName(brand?.name ?? '')
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setName('')
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editId) {
        await updateBrand.mutateAsync({
          id: editId,
          name,
        } satisfies RouterInput['deviceBrands']['update'])
        setSuccess('Brand updated!')
      } else {
        await createBrand.mutateAsync({
          name,
        } satisfies RouterInput['deviceBrands']['create'])
        setSuccess('Brand created!')
      }
      refetch().catch(console.error)
      closeModal()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save brand.'))
    }
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
      refetch().catch(console.error)
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
            {brands?.map((brand) => (
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
                      <Button
                        variant="secondary"
                        onClick={() => openModal(brand)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(brand.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {brands?.length === 0 && (
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
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all">
          <form
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 relative"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
              {editId ? 'Edit Brand' : 'Add Brand'}
            </h2>
            <label className="block mb-2 font-medium">Brand Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mb-4 w-full"
            />
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createBrand.isPending || updateBrand.isPending}
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {editId ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
export default AdminBrandsPage
