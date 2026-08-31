'use client'

import { useState, type FormEvent } from 'react'
import { Button, Input, Modal, Autocomplete } from '@/components/ui'
import { LOOKUP_PAGINATION } from '@/data/constants'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type DeviceData = RouterOutput['devices']['get']['devices'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  editId: string | null
  deviceData: DeviceData | null
  onSuccess: () => void
}

function DeviceModal(props: Props) {
  const formKey = [
    props.isOpen ? 'open' : 'closed',
    props.editId ?? 'new',
    props.deviceData?.id ?? 'no-device',
  ].join(':')

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit Device' : 'Add Device'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
      <DeviceModalForm
        key={formKey}
        editId={props.editId}
        deviceData={props.deviceData}
        onClose={props.onClose}
        onSuccess={props.onSuccess}
      />
    </Modal>
  )
}

interface FormProps {
  editId: string | null
  deviceData: DeviceData | null
  onClose: () => void
  onSuccess: () => void
}

function DeviceModalForm(props: FormProps) {
  const createDevice = api.devices.create.useMutation()
  const updateDevice = api.devices.update.useMutation()
  const deviceBrandsQuery = api.deviceBrands.get.useQuery({ limit: 100 })
  // TODO: Make this selector async instead of preloading 1000 options.
  const socsQuery = api.socs.options.useQuery({ limit: LOOKUP_PAGINATION.MAX_LIMIT })

  const [brandId, setBrandId] = useState(props.deviceData?.brandId ?? '')
  const [modelName, setModelName] = useState(props.deviceData?.modelName ?? '')
  const [socId, setSocId] = useState(props.deviceData?.socId ?? '')
  const [error, setError] = useState('')

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    try {
      const deviceData = {
        brandId,
        modelName,
        socId: socId || null,
      }

      if (props.editId) {
        await updateDevice.mutateAsync({
          id: props.editId,
          ...deviceData,
        } satisfies RouterInput['devices']['update'])
        props.onSuccess()
      } else {
        await createDevice.mutateAsync(deviceData satisfies RouterInput['devices']['create'])
        props.onSuccess()
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save device.'))
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
          onChange={(e) => setModelName(e.target.value)}
          required
          className="w-full"
          placeholder="Enter model name"
        />
      </div>

      <div>
        <label htmlFor="soc" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          SoC (Optional)
        </label>
        <Autocomplete
          value={socId}
          onChange={(value) => setSocId(value ?? '')}
          items={socsQuery.data?.socs ?? []}
          optionToValue={(soc) => soc.id}
          optionToLabel={(soc) => `${soc.manufacturer} ${soc.name}`}
          placeholder="Select a SoC..."
          className="w-full"
          filterKeys={['name', 'manufacturer']}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={props.onClose}
          disabled={createDevice.isPending || updateDevice.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={createDevice.isPending || updateDevice.isPending}
          disabled={createDevice.isPending || updateDevice.isPending}
        >
          {props.editId ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export default DeviceModal
