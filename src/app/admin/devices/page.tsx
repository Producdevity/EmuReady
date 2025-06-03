'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import storageKeys from '@/data/storageKeys'
import {
  Button,
  Input,
  LoadingSpinner,
  ColumnVisibilityControl,
  AdminTableContainer,
} from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { type RouterInput } from '@/types/trpc'

const DEVICES_COLUMNS: ColumnDefinition[] = [
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'model', label: 'Model', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminDevicesPage() {
  const columnVisibility = useColumnVisibility(DEVICES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminDevices,
  })

  const {
    data: devices,
    isLoading: devicesLoading,
    refetch,
  } = api.devices.get.useQuery()
  const { data: brands, isLoading: brandsLoading } =
    api.deviceBrands.get.useQuery()
  const createDevice = api.devices.create.useMutation()
  const updateDevice = api.devices.update.useMutation()
  const deleteDevice = api.devices.delete.useMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [brandId, setBrandId] = useState('')
  const [modelName, setModelName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const openModal = (device?: {
    id: string
    brand: { id: string; name: string }
    modelName: string
  }) => {
    setEditId(device?.id ?? null)
    setBrandId(device?.brand.id ?? '')
    setModelName(device?.modelName ?? '')
    setModalOpen(true)
    setError('')
    setSuccess('')
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setBrandId('')
    setModelName('')
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editId) {
        await updateDevice.mutateAsync({
          id: editId,
          brandId,
          modelName,
        } satisfies RouterInput['devices']['update'])
        setSuccess('Device updated!')
      } else {
        await createDevice.mutateAsync({
          brandId,
          modelName,
        } satisfies RouterInput['devices']['create'])
        setSuccess('Device created!')
      }
      refetch()
      closeModal()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save device.'))
    }
  }

  const handleDelete = async (id: string) => {
    // TODO: use a confirmation modal instead of browser confirm
    if (!confirm('Delete this device?')) return
    try {
      await deleteDevice.mutateAsync({
        id,
      } satisfies RouterInput['devices']['delete'])
      refetch()
    } catch (err) {
      toast.error(`Failed to delete device: ${getErrorMessage(err)}`)
    }
  }

  const areBrandsAvailable = brands && brands.length > 0
  const isLoading = devicesLoading || brandsLoading

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
          <Button onClick={() => openModal()} disabled={!areBrandsAvailable}>
            Add Device
          </Button>
        </div>
      </div>

      {!isLoading && !areBrandsAvailable && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
          <p>
            You need to create at least one device brand before adding devices.{' '}
            <Link
              href="/admin/brands"
              className="underline hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              Go to Device Brand Management
            </Link>
          </p>
        </div>
      )}

      <AdminTableContainer>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {columnVisibility.isColumnVisible('brand') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Brand
                </th>
              )}
              {columnVisibility.isColumnVisible('model') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
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
            {isLoading && (
              <tr>
                <td colSpan={3} className="text-center py-12">
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
                {columnVisibility.isColumnVisible('actions') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => openModal(dev)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(dev.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {devices?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No devices found. Add your first device.
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
              {editId ? 'Edit Device' : 'Add Device'}
            </h2>
            <label className="block mb-2 font-medium">Brand</label>
            <Input
              as="select"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="mb-4 w-full"
            >
              <option value="">Select a brand...</option>
              {brands?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Input>
            <label className="block mb-2 font-medium">Model Name</label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
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
                isLoading={createDevice.isPending || updateDevice.isPending}
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

export default AdminDevicesPage
