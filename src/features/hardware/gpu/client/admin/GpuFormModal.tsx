'use client'

import { useState, type SubmitEvent } from 'react'
import { Autocomplete, Button, Input, Modal } from '@/components/ui'
import { PAGINATION } from '@/data/constants'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import type { CreateGpuInput, GpuDetail, UpdateGpuInput } from '../../shared/gpu.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  gpuData: GpuDetail | null
  onSuccess: () => void
}

export function GpuFormModal(props: Props) {
  const formKey = props.gpuData?.id ?? 'new'

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.gpuData ? 'Edit GPU' : 'Add GPU'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
      <GpuForm
        key={formKey}
        gpuData={props.gpuData}
        onClose={props.onClose}
        onSuccess={props.onSuccess}
      />
    </Modal>
  )
}

interface GpuFormProps {
  onClose: () => void
  gpuData: GpuDetail | null
  onSuccess: () => void
}

function GpuForm(props: GpuFormProps) {
  const createGpu = api.gpus.create.useMutation()
  const updateGpu = api.gpus.update.useMutation()
  const deviceBrandsQuery = api.deviceBrands.get.useQuery({
    limit: PAGINATION.MAX_LIMIT,
    category: 'gpu',
  })

  const [brandId, setBrandId] = useState(props.gpuData?.brand.id ?? '')
  const [modelName, setModelName] = useState(props.gpuData?.modelName ?? '')
  const [error, setError] = useState('')

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()
    setError('')

    try {
      const gpuData = {
        brandId,
        modelName,
      } satisfies CreateGpuInput

      if (props.gpuData) {
        await updateGpu.mutateAsync({
          id: props.gpuData.id,
          ...gpuData,
        } satisfies UpdateGpuInput)
      } else {
        await createGpu.mutateAsync(gpuData)
      }

      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save GPU.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="brand" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          Brand
        </label>
        <Autocomplete
          value={brandId}
          onChange={(value) => setBrandId(value ?? '')}
          items={deviceBrandsQuery.data ?? []}
          optionToValue={(brand) => brand.id}
          optionToLabel={(brand) => brand.name}
          placeholder="Select a brand..."
          className="w-full"
          filterKeys={['name']}
        />
      </div>

      <div>
        <label
          htmlFor="modelName"
          className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
        >
          Model Name
        </label>
        <Input
          id="modelName"
          value={modelName}
          onChange={(ev) => setModelName(ev.target.value)}
          required
          className="w-full"
          placeholder="e.g., GeForce RTX 4090"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="ghost" onClick={props.onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={createGpu.isPending || updateGpu.isPending}
          disabled={createGpu.isPending || updateGpu.isPending}
        >
          {props.gpuData ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
