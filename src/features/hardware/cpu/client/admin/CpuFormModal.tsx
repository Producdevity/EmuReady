'use client'

import { useState, type SubmitEvent } from 'react'
import { Autocomplete, Button, Input, Modal } from '@/components/ui'
import { PAGINATION } from '@/data/constants'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import type { CreateCpuInput, CpuDetail, UpdateCpuInput } from '../../shared/cpu.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  cpuData: CpuDetail | null
  onSuccess: () => void
}

export function CpuFormModal(props: Props) {
  const formKey = props.cpuData?.id ?? 'new'

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.cpuData ? 'Edit CPU' : 'Add CPU'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
      <CpuForm
        key={formKey}
        cpuData={props.cpuData}
        onClose={props.onClose}
        onSuccess={props.onSuccess}
      />
    </Modal>
  )
}

interface CpuFormProps {
  onClose: () => void
  cpuData: CpuDetail | null
  onSuccess: () => void
}

function CpuForm(props: CpuFormProps) {
  const createCpu = api.cpus.create.useMutation()
  const updateCpu = api.cpus.update.useMutation()
  const deviceBrandsQuery = api.deviceBrands.get.useQuery({
    limit: PAGINATION.MAX_LIMIT,
    category: 'cpu',
  })

  const [brandId, setBrandId] = useState(props.cpuData?.brand.id ?? '')
  const [modelName, setModelName] = useState(props.cpuData?.modelName ?? '')
  const [error, setError] = useState('')

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()
    setError('')

    try {
      const cpuData = {
        brandId,
        modelName,
      } satisfies CreateCpuInput

      if (props.cpuData) {
        await updateCpu.mutateAsync({
          id: props.cpuData.id,
          ...cpuData,
        } satisfies UpdateCpuInput)
      } else {
        await createCpu.mutateAsync(cpuData)
      }

      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save CPU.'))
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
          placeholder="e.g., Core i7-13700K"
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
          isLoading={createCpu.isPending || updateCpu.isPending}
          disabled={createCpu.isPending || updateCpu.isPending}
        >
          {props.cpuData ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
