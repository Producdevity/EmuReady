'use client'

import { Computer, Plus, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, LoadingSpinner, useConfirmDialog, Card } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { PcOs } from '@orm'
import PcPresetModal from './PcPresetModal'
import type { RouterOutput } from '@/types/trpc'

type PcPreset = RouterOutput['pcListings']['presets']['get'][number]

function PcPresets() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PcPreset | null>(null)

  const presetsQuery = api.pcListings.presets.get.useQuery({})
  const deletePreset = api.pcListings.presets.delete.useMutation()
  const confirm = useConfirmDialog()
  const utils = api.useUtils()

  const openModal = (preset?: PcPreset) => {
    setEditingPreset(preset ?? null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPreset(null)
  }

  const handleModalSuccess = () => {
    utils.pcListings.presets.get.invalidate().catch(console.error)
    closeModal()
  }

  const handleDelete = async (preset: PcPreset) => {
    const confirmed = await confirm({
      title: 'Delete PC Preset',
      description: `Are you sure you want to delete the preset "${preset.name}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    try {
      await deletePreset.mutateAsync({ id: preset.id })
      utils.pcListings.presets.get.invalidate().catch(console.error)
      toast.success('PC preset deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete preset: ${getErrorMessage(err)}`)
    }
  }

  const formatOs = (os: PcOs) => {
    switch (os) {
      case PcOs.WINDOWS:
        return 'Windows'
      case PcOs.LINUX:
        return 'Linux'
      case PcOs.MACOS:
        return 'macOS'
      default:
        return os
    }
  }

  if (presetsQuery.isPending) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner text="Loading PC presets..." />
      </div>
    )
  }

  if (presetsQuery.error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">
          Failed to load PC presets: {getErrorMessage(presetsQuery.error)}
        </p>
      </div>
    )
  }

  const presets = presetsQuery.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Computer className="w-6 h-6" />
            PC Hardware Presets
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Save your PC configurations for quick PC listing creation
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Preset
        </Button>
      </div>

      {presets.length === 0 ? (
        <Card className="text-center py-12">
          <Computer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No PC presets yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Save your PC hardware configurations to quickly create PC listings
            later.
          </p>
          <Button onClick={() => openModal()}>Create your first preset</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset) => (
            <Card key={preset.id} className="hover:shadow-lg transition-shadow">
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
                <div className="text-lg font-semibold flex items-center justify-between">
                  {preset.name}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(preset)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(preset)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      disabled={deletePreset.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    CPU
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {preset.cpu.brand.name} {preset.cpu.modelName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    GPU
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {preset.gpu.brand.name} {preset.gpu.modelName}
                  </p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      RAM
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {preset.memorySize} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      OS
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatOs(preset.os)}
                    </p>
                  </div>
                </div>
                {preset.osVersion && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      OS Version
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {preset.osVersion}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <PcPresetModal
        isOpen={modalOpen}
        onClose={closeModal}
        preset={editingPreset}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default PcPresets
