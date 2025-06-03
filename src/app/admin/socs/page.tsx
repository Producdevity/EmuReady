'use client'

import { useState, type FormEvent } from 'react'
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

const SOCS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'manufacturer', label: 'Manufacturer', defaultVisible: true },
  { key: 'architecture', label: 'Architecture', defaultVisible: true },
  { key: 'processNode', label: 'Process Node', defaultVisible: true },
  { key: 'cpuCores', label: 'CPU Cores', defaultVisible: true },
  { key: 'gpuModel', label: 'GPU Model', defaultVisible: true },
  { key: 'devicesCount', label: 'Devices', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminSoCsPage() {
  const columnVisibility = useColumnVisibility(SOCS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminSoCs,
  })

  const {
    data: socs,
    isLoading: socsLoading,
    refetch,
  } = api.socs.get.useQuery()
  const createSoC = api.socs.create.useMutation()
  const updateSoC = api.socs.update.useMutation()
  const deleteSoC = api.socs.delete.useMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [architecture, setArchitecture] = useState('')
  const [processNode, setProcessNode] = useState('')
  const [cpuCores, setCpuCores] = useState('')
  const [gpuModel, setGpuModel] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const openModal = (soc?: {
    id: string
    name: string
    manufacturer: string
    architecture: string | null
    processNode: string | null
    cpuCores: number | null
    gpuModel: string | null
  }) => {
    setEditId(soc?.id ?? null)
    setName(soc?.name ?? '')
    setManufacturer(soc?.manufacturer ?? '')
    setArchitecture(soc?.architecture ?? '')
    setProcessNode(soc?.processNode ?? '')
    setCpuCores(soc?.cpuCores?.toString() ?? '')
    setGpuModel(soc?.gpuModel ?? '')
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setName('')
    setManufacturer('')
    setArchitecture('')
    setProcessNode('')
    setCpuCores('')
    setGpuModel('')
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      const data = {
        name,
        manufacturer,
        architecture: architecture || undefined,
        processNode: processNode || undefined,
        cpuCores: cpuCores ? parseInt(cpuCores, 10) : undefined,
        gpuModel: gpuModel || undefined,
      }

      if (editId) {
        await updateSoC.mutateAsync({
          id: editId,
          ...data,
        } satisfies RouterInput['socs']['update'])
        setSuccess('SoC updated!')
      } else {
        await createSoC.mutateAsync(
          data satisfies RouterInput['socs']['create'],
        )
        setSuccess('SoC created!')
      }
      refetch()
      closeModal()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save SoC.'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete SoC "${name}"?`)) return
    try {
      await deleteSoC.mutateAsync({
        id,
      } satisfies RouterInput['socs']['delete'])
      refetch()
    } catch (err) {
      toast.error(`Failed to delete SoC: ${getErrorMessage(err)}`)
    }
  }

  const isLoading = socsLoading

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Manage SoCs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System on Chip specifications for devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ColumnVisibilityControl
            columns={SOCS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add SoC</Button>
        </div>
      </div>

      <AdminTableContainer>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {columnVisibility.isColumnVisible('name') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
              )}
              {columnVisibility.isColumnVisible('manufacturer') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Manufacturer
                </th>
              )}
              {columnVisibility.isColumnVisible('architecture') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Architecture
                </th>
              )}
              {columnVisibility.isColumnVisible('processNode') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Process Node
                </th>
              )}
              {columnVisibility.isColumnVisible('cpuCores') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  CPU Cores
                </th>
              )}
              {columnVisibility.isColumnVisible('gpuModel') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  GPU Model
                </th>
              )}
              {columnVisibility.isColumnVisible('devicesCount') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Devices
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
                <td colSpan={8} className="text-center py-12">
                  <LoadingSpinner size="lg" text="Loading..." />
                </td>
              </tr>
            )}
            {socs?.map((soc) => (
              <tr
                key={soc.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                {columnVisibility.isColumnVisible('name') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    {soc.name}
                  </td>
                )}
                {columnVisibility.isColumnVisible('manufacturer') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {soc.manufacturer}
                  </td>
                )}
                {columnVisibility.isColumnVisible('architecture') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {soc.architecture ?? '—'}
                  </td>
                )}
                {columnVisibility.isColumnVisible('processNode') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {soc.processNode ?? '—'}
                  </td>
                )}
                {columnVisibility.isColumnVisible('cpuCores') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {soc.cpuCores ?? '—'}
                  </td>
                )}
                {columnVisibility.isColumnVisible('gpuModel') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {soc.gpuModel ?? '—'}
                  </td>
                )}
                {columnVisibility.isColumnVisible('devicesCount') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {soc._count.devices}
                  </td>
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => openModal(soc)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(soc.id, soc.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {socs?.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No SoCs found. Add your first SoC.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableContainer>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all">
          <form
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 relative max-h-[90vh] overflow-y-auto"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
              {editId ? 'Edit SoC' : 'Add SoC'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block mb-2 font-medium">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                  placeholder="e.g., Snapdragon 8 Gen 3"
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-2 font-medium">Manufacturer *</label>
                <Input
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  required
                  className="w-full"
                  placeholder="e.g., Qualcomm"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Architecture</label>
                <Input
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value)}
                  className="w-full"
                  placeholder="e.g., ARM64"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Process Node</label>
                <Input
                  value={processNode}
                  onChange={(e) => setProcessNode(e.target.value)}
                  className="w-full"
                  placeholder="e.g., 4nm"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">CPU Cores</label>
                <Input
                  type="number"
                  value={cpuCores}
                  onChange={(e) => setCpuCores(e.target.value)}
                  className="w-full"
                  placeholder="e.g., 8"
                  min="1"
                  max="64"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">GPU Model</label>
                <Input
                  value={gpuModel}
                  onChange={(e) => setGpuModel(e.target.value)}
                  className="w-full"
                  placeholder="e.g., Adreno 750"
                />
              </div>
            </div>

            {error && <div className="text-red-500 mb-2 mt-4">{error}</div>}
            {success && (
              <div className="text-green-600 mb-2 mt-4">{success}</div>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createSoC.isPending || updateSoC.isPending}
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

export default AdminSoCsPage
