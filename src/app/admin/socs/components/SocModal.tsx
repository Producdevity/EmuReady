'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type SocData = RouterOutput['socs']['get']['socs'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  editId: string | null
  socData: SocData | null
  onSuccess: () => void
}

function SocModal(props: Props) {
  const createSoC = api.socs.create.useMutation()
  const updateSoC = api.socs.update.useMutation()

  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [architecture, setArchitecture] = useState('')
  const [processNode, setProcessNode] = useState('')
  const [cpuCores, setCpuCores] = useState('')
  const [gpuModel, setGpuModel] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when socData changes
  useEffect(() => {
    if (props.socData) {
      setName(props.socData.name)
      setManufacturer(props.socData.manufacturer)
      setArchitecture(props.socData.architecture ?? '')
      setProcessNode(props.socData.processNode ?? '')
      setCpuCores(props.socData.cpuCores?.toString() ?? '')
      setGpuModel(props.socData.gpuModel ?? '')
    } else {
      setName('')
      setManufacturer('')
      setArchitecture('')
      setProcessNode('')
      setCpuCores('')
      setGpuModel('')
    }
    setError('')
    setSuccess('')
  }, [props.socData, props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      const socData = {
        name,
        manufacturer,
        architecture: architecture || undefined,
        processNode: processNode || undefined,
        cpuCores: cpuCores ? parseInt(cpuCores, 10) : undefined,
        gpuModel: gpuModel || undefined,
      }

      if (props.editId) {
        await updateSoC.mutateAsync({
          id: props.editId,
          ...socData,
        } satisfies RouterInput['socs']['update'])
        setSuccess('SoC updated!')
      } else {
        await createSoC.mutateAsync(
          socData satisfies RouterInput['socs']['create'],
        )
        setSuccess('SoC created!')
      }

      // Reset form
      setName('')
      setManufacturer('')
      setArchitecture('')
      setProcessNode('')
      setCpuCores('')
      setGpuModel('')

      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save SoC.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit SoC' : 'Add SoC'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label
              htmlFor="name"
              className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
            >
              Name *
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
              placeholder="e.g., Snapdragon 8 Gen 3"
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="manufacturer"
              className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
            >
              Manufacturer *
            </label>
            <Input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              required
              className="w-full"
              placeholder="e.g., Qualcomm"
            />
          </div>

          <div>
            <label
              htmlFor="architecture"
              className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
            >
              Architecture
            </label>
            <Input
              id="architecture"
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
              className="w-full"
              placeholder="e.g., ARM64"
            />
          </div>

          <div>
            <label
              htmlFor="processNode"
              className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
            >
              Process Node
            </label>
            <Input
              id="processNode"
              value={processNode}
              onChange={(e) => setProcessNode(e.target.value)}
              className="w-full"
              placeholder="e.g., 4nm"
            />
          </div>

          <div>
            <label
              htmlFor="cpuCores"
              className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
            >
              CPU Cores
            </label>
            <Input
              id="cpuCores"
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
            <label
              htmlFor="gpuModel"
              className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
            >
              GPU Model
            </label>
            <Input
              id="gpuModel"
              value={gpuModel}
              onChange={(e) => setGpuModel(e.target.value)}
              className="w-full"
              placeholder="e.g., Adreno 750"
            />
          </div>
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
            isLoading={createSoC.isPending || updateSoC.isPending}
            disabled={createSoC.isPending || updateSoC.isPending}
          >
            {props.editId ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SocModal
