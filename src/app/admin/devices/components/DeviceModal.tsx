'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal, Autocomplete } from '@/components/ui'
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
  const createDevice = api.devices.create.useMutation()
  const updateDevice = api.devices.update.useMutation()
  const deviceBrandsQuery = api.deviceBrands.get.useQuery()
  const socsQuery = api.socs.get.useQuery({ limit: 1000 })

  const [brandId, setBrandId] = useState('')
  const [modelName, setModelName] = useState('')
  const [socId, setSocId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when deviceData changes
  useEffect(() => {
    if (props.deviceData) {
      setBrandId(props.deviceData.brand.id)
      setModelName(props.deviceData.modelName)
      setSocId(props.deviceData.soc?.id ?? '')
    } else {
      setBrandId('')
      setModelName('')
      setSocId('')
    }
    setError('')
    setSuccess('')
  }, [props.deviceData, props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      const deviceData = {
        brandId,
        modelName,
        socId: socId || undefined,
      }

      if (props.editId) {
        await updateDevice.mutateAsync({
          id: props.editId,
          ...deviceData,
        } satisfies RouterInput['devices']['update'])
        setSuccess('Device updated!')
      } else {
        await createDevice.mutateAsync(
          deviceData satisfies RouterInput['devices']['create'],
        )
        setSuccess('Device created!')
      }

      // Reset form
      setBrandId('')
      setModelName('')
      setSocId('')

      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save device.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit Device' : 'Add Device'}
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
            placeholder="Enter model name"
          />
        </div>

        <div>
          <label
            htmlFor="soc"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
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
          <Button type="button" variant="outline" onClick={props.onClose}>
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
    </Modal>
  )
}

export default DeviceModal
