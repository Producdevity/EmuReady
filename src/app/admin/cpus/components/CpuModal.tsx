'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal, Autocomplete } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type CpuData = RouterOutput['cpus']['get']['cpus'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  editId: string | null
  cpuData: CpuData | null
  onSuccess: () => void
}

function CpuModal(props: Props) {
  const createCpu = api.cpus.create.useMutation()
  const updateCpu = api.cpus.update.useMutation()
  const deviceBrandsQuery = api.deviceBrands.get.useQuery()

  const [brandId, setBrandId] = useState('')
  const [modelName, setModelName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when cpuData changes
  useEffect(() => {
    if (props.cpuData) {
      setBrandId(props.cpuData.brand.id)
      setModelName(props.cpuData.modelName)
    } else {
      setBrandId('')
      setModelName('')
    }
    setError('')
    setSuccess('')
  }, [props.cpuData, props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      const cpuData = {
        brandId,
        modelName,
      }

      if (props.editId) {
        await updateCpu.mutateAsync({
          id: props.editId,
          ...cpuData,
        } satisfies RouterInput['cpus']['update'])
        setSuccess('CPU updated!')
        props.onSuccess()
      } else {
        await createCpu.mutateAsync(cpuData satisfies RouterInput['cpus']['create'])
        setSuccess('CPU created!')
        props.onSuccess()
      }

      // Reset form
      setBrandId('')
      setModelName('')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save CPU.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit CPU' : 'Add CPU'}
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
            placeholder="e.g., Core i7-13700K"
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
          <Button variant="ghost" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createCpu.isPending || updateCpu.isPending}
            disabled={createCpu.isPending || updateCpu.isPending}
          >
            {props.editId ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CpuModal
