'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal, Autocomplete, SelectInput } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { PcOs } from '@orm'

type PcPreset = RouterOutput['pcListings']['presets']['get'][number]
type PcPresetMutationResult =
  | RouterOutput['pcListings']['presets']['create']
  | RouterOutput['pcListings']['presets']['update']

interface Props {
  isOpen: boolean
  onClose: () => void
  preset: PcPreset | null
  onSuccess: (data?: PcPresetMutationResult) => void
}

const OS_OPTIONS = [
  { value: PcOs.WINDOWS, label: 'Windows' },
  { value: PcOs.LINUX, label: 'Linux' },
  { value: PcOs.MACOS, label: 'macOS' },
]

function PcPresetModal(props: Props) {
  const createPreset = api.pcListings.presets.create.useMutation()
  const updatePreset = api.pcListings.presets.update.useMutation()
  const cpusQuery = api.cpus.get.useQuery({ limit: 500 }) // TODO: make this async
  const gpusQuery = api.gpus.get.useQuery({ limit: 500 }) // TODO: make this async

  const [name, setName] = useState('')
  const [cpuId, setCpuId] = useState('')
  const [gpuId, setGpuId] = useState('')
  const [memorySize, setMemorySize] = useState('')
  const [os, setOs] = useState<PcOs>(PcOs.WINDOWS)
  const [osVersion, setOsVersion] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when preset changes
  useEffect(() => {
    if (props.preset) {
      setName(props.preset.name)
      setCpuId(props.preset.cpuId)
      setGpuId(props.preset.gpuId || '')
      setMemorySize(props.preset.memorySize.toString())
      setOs(props.preset.os)
      setOsVersion(props.preset.osVersion)
    } else {
      setName('')
      setCpuId('')
      setGpuId('')
      setMemorySize('')
      setOs(PcOs.WINDOWS)
      setOsVersion('')
    }
    setError('')
    setSuccess('')
  }, [props.preset, props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')

    const memorySizeNum = parseInt(memorySize)
    if (isNaN(memorySizeNum) || memorySizeNum < 1 || memorySizeNum > 256) {
      setError('Memory size must be between 1 and 256 GB')
      return
    }

    try {
      const presetData = {
        name,
        cpuId,
        gpuId,
        memorySize: memorySizeNum,
        os,
        osVersion,
      }

      if (props.preset) {
        const updated = await updatePreset.mutateAsync({
          id: props.preset.id,
          ...presetData,
        } satisfies RouterInput['pcListings']['presets']['update'])
        setSuccess('PC preset updated!')
        props.onSuccess(updated)
      } else {
        const created = await createPreset.mutateAsync(
          presetData satisfies RouterInput['pcListings']['presets']['create'],
        )
        setSuccess('PC preset created!')
        props.onSuccess(created)
      }

      // Reset form
      setName('')
      setCpuId('')
      setGpuId('')
      setMemorySize('')
      setOs(PcOs.WINDOWS)
      setOsVersion('')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save PC preset.'))
    }
  }

  const formatCpuLabel = (cpu: RouterOutput['cpus']['get']['cpus'][number]) =>
    `${cpu.brand.name} ${cpu.modelName}`
  const formatGpuLabel = (gpu: RouterOutput['gpus']['get']['gpus'][number]) =>
    `${gpu.brand.name} ${gpu.modelName}`

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.preset ? 'Edit PC Preset' : 'Add PC Preset'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Preset Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full"
            placeholder="e.g., Gaming Rig, Work PC"
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="cpu" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            CPU
          </label>
          <Autocomplete
            value={cpuId}
            onChange={(value) => setCpuId(value ?? '')}
            items={cpusQuery.data?.cpus ?? []}
            optionToValue={(cpu) => cpu.id}
            optionToLabel={formatCpuLabel}
            placeholder="Select a CPU..."
            className="w-full"
            filterKeys={['modelName']}
          />
        </div>

        <div>
          <label htmlFor="gpu" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            GPU
          </label>
          <Autocomplete
            value={gpuId}
            onChange={(value) => setGpuId(value ?? '')}
            items={gpusQuery.data?.gpus ?? []}
            optionToValue={(gpu) => gpu.id}
            optionToLabel={formatGpuLabel}
            placeholder="Select a GPU..."
            className="w-full"
            filterKeys={['modelName']}
          />
        </div>

        <div>
          <label
            htmlFor="memorySize"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            RAM (GB)
          </label>
          <Input
            id="memorySize"
            type="number"
            value={memorySize}
            onChange={(e) => setMemorySize(e.target.value)}
            required
            min="1"
            max="256"
            className="w-full"
            placeholder="e.g., 16"
          />
        </div>

        <div>
          <label htmlFor="os" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Operating System
          </label>
          <SelectInput
            label="Operating System"
            hideLabel
            options={OS_OPTIONS.map((opt) => ({
              id: opt.value,
              name: opt.label,
            }))}
            value={os}
            onChange={(ev) => setOs(ev.target.value as PcOs)}
          />
        </div>

        <div>
          <label
            htmlFor="osVersion"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            OS Version
          </label>
          <Input
            id="osVersion"
            value={osVersion}
            onChange={(e) => setOsVersion(e.target.value)}
            required
            className="w-full"
            placeholder="e.g., Windows 11 Pro, Ubuntu 22.04, macOS Sonoma"
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
            isLoading={createPreset.isPending || updatePreset.isPending}
            disabled={createPreset.isPending || updatePreset.isPending}
          >
            {props.preset ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default PcPresetModal
