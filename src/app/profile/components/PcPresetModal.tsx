'use client'

import { useCallback, useState, type SubmitEvent } from 'react'
import { Button, Input, Modal, Autocomplete, SelectInput } from '@/components/ui'
import { LOOKUP_PAGINATION } from '@/data/constants'
import { PC_OS_OPTIONS } from '@/data/pc-os'
import { getCpuLabel } from '@/features/hardware/cpu/shared/cpu-format'
import { getGpuLabel } from '@/features/hardware/gpu/shared/gpu-format'
import { api } from '@/lib/api'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { PcOs } from '@orm'

type PcPreset = RouterOutput['pcListings']['presets']['get'][number]
type PcPresetMutationResult =
  | RouterOutput['pcListings']['presets']['create']
  | RouterOutput['pcListings']['presets']['update']
type CpuSummary = RouterOutput['cpus']['options']['cpus'][number]
type GpuSummary = RouterOutput['gpus']['options']['gpus'][number]

interface Props {
  onClose: () => void
  preset: PcPreset | null
  onSuccess: (data?: PcPresetMutationResult) => void
}

function PcPresetModal(props: Props) {
  const utils = api.useUtils()
  const createPreset = api.pcListings.presets.create.useMutation()
  const updatePreset = api.pcListings.presets.update.useMutation()

  const [name, setName] = useState(props.preset?.name ?? '')
  const [cpuId, setCpuId] = useState(props.preset?.cpuId ?? '')
  const [gpuId, setGpuId] = useState(props.preset?.gpuId ?? '')
  const [memorySize, setMemorySize] = useState(props.preset?.memorySize.toString() ?? '')
  const [os, setOs] = useState<PcOs>(props.preset?.os ?? PcOs.WINDOWS)
  const [osVersion, setOsVersion] = useState(props.preset?.osVersion ?? '')
  const [error, setError] = useState('')

  const selectedCpuQuery = api.cpus.getByIds.useQuery(
    { ids: cpuId ? [cpuId] : [] },
    { enabled: cpuId !== '' },
  )
  const selectedGpuQuery = api.gpus.getByIds.useQuery(
    { ids: gpuId ? [gpuId] : [] },
    { enabled: gpuId !== '' },
  )

  const loadCpuItems = useCallback(
    async (query: string): Promise<CpuSummary[]> => {
      if (query.length < 2) return []
      try {
        const result = await utils.cpus.options.fetch({
          search: query,
          limit: LOOKUP_PAGINATION.AUTOCOMPLETE_LIMIT,
        })
        return result.cpus
      } catch (err) {
        console.error('Error fetching CPUs:', err)
        return []
      }
    },
    [utils.cpus.options],
  )

  const loadGpuItems = useCallback(
    async (query: string): Promise<GpuSummary[]> => {
      if (query.length < 2) return []
      try {
        const result = await utils.gpus.options.fetch({
          search: query,
          limit: LOOKUP_PAGINATION.AUTOCOMPLETE_LIMIT,
        })
        return result.gpus
      } catch (err) {
        console.error('Error fetching GPUs:', err)
        return []
      }
    },
    [utils.gpus.options],
  )

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()
    setError('')

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
        props.onSuccess(updated)
      } else {
        const created = await createPreset.mutateAsync(
          presetData satisfies RouterInput['pcListings']['presets']['create'],
        )
        props.onSuccess(created)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save PC preset.'))
    }
  }

  return (
    <Modal
      isOpen
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
            onChange={(ev) => setName(ev.target.value)}
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
            value={cpuId || null}
            onChange={(value) => setCpuId(value ?? '')}
            items={selectedCpuQuery.data ?? []}
            loadItems={loadCpuItems}
            optionToValue={(cpu) => cpu.id}
            optionToLabel={getCpuLabel}
            placeholder="Select a CPU..."
            className="w-full"
            minCharsToTrigger={2}
          />
        </div>

        <div>
          <label htmlFor="gpu" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            GPU
          </label>
          <Autocomplete
            value={gpuId || null}
            onChange={(value) => setGpuId(value ?? '')}
            items={selectedGpuQuery.data ?? []}
            loadItems={loadGpuItems}
            optionToValue={(gpu) => gpu.id}
            optionToLabel={getGpuLabel}
            placeholder="Select a GPU..."
            className="w-full"
            minCharsToTrigger={2}
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
            options={PC_OS_OPTIONS.map((opt) => ({
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
