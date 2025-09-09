'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal, Autocomplete } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type GpuData = RouterOutput['gpus']['get']['gpus'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  editId: string | null
  gpuData: GpuData | null
  onSuccess: () => void
}

function GpuModal(props: Props) {
  const createGpu = api.gpus.create.useMutation()
  const updateGpu = api.gpus.update.useMutation()
  const deviceBrandsQuery = api.deviceBrands.get.useQuery()

  const [brandId, setBrandId] = useState('')
  const [modelName, setModelName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when gpuData changes
  useEffect(() => {
    if (props.gpuData) {
      setBrandId(props.gpuData.brand.id)
      setModelName(props.gpuData.modelName)
    } else {
      setBrandId('')
      setModelName('')
    }
    setError('')
    setSuccess('')
  }, [props.gpuData, props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      const gpuData = {
        brandId,
        modelName,
      }

      if (props.editId) {
        await updateGpu.mutateAsync({
          id: props.editId,
          ...gpuData,
        } satisfies RouterInput['gpus']['update'])
        setSuccess('GPU updated!')
        props.onSuccess()
      } else {
        await createGpu.mutateAsync(gpuData satisfies RouterInput['gpus']['create'])
        setSuccess('GPU created!')
        props.onSuccess()
      }

      // Reset form
      setBrandId('')
      setModelName('')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save GPU.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit GPU' : 'Add GPU'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="brand"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
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
            onChange={(e) => setModelName(e.target.value)}
            required
            className="w-full"
            placeholder="e.g., GeForce RTX 4090"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            {success}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={props.onClose}
            disabled={createGpu.isPending || updateGpu.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createGpu.isPending || updateGpu.isPending}
            disabled={createGpu.isPending || updateGpu.isPending}
          >
            {props.editId ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default GpuModal
