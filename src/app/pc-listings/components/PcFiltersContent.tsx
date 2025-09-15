'use client'

import { Cpu, HardDrive, Rocket, MonitorSpeaker, Gamepad2, MemoryStick } from 'lucide-react'
import { type ChangeEvent } from 'react'
import { ListingsSearchBar } from '@/app/listings/shared/components'
import { MultiSelect, Input } from '@/components/ui'
import AsyncCpuMultiSelect from '@/components/ui/form/AsyncCpuMultiSelect'
import AsyncGpuMultiSelect from '@/components/ui/form/AsyncGpuMultiSelect'
import {
  cpuOptions,
  emulatorOptions,
  gpuOptions,
  performanceOptions,
  systemOptions,
} from '@/utils/options'
import { type System, type PerformanceScale, type Emulator } from '@orm'

type CpuWithBrand = { id: string; modelName: string; brand: { name: string } }
type GpuWithBrand = { id: string; modelName: string; brand: { name: string } }

interface Props {
  cpuIds: string[]
  gpuIds: string[]
  systemIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
  minMemory: number | null
  maxMemory: number | null
  searchTerm: string
  cpus: CpuWithBrand[]
  gpus: GpuWithBrand[]
  systems: System[]
  emulators: Emulator[]
  performanceScales: PerformanceScale[]
  onCpuChange: (values: string[]) => void
  onGpuChange: (values: string[]) => void
  onSystemChange: (values: string[]) => void
  onEmulatorChange: (values: string[]) => void
  onPerformanceChange: (values: string[]) => void
  onMinMemoryChange: (value: number | null) => void
  onMaxMemoryChange: (value: number | null) => void
  onSearchChange: (value: string) => void
}

export default function PcFiltersContent(props: Props) {
  const handleMinMemoryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value === '' ? null : Number(ev.target.value)
    props.onMinMemoryChange(value)
  }

  const handleMaxMemoryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value === '' ? null : Number(ev.target.value)
    props.onMaxMemoryChange(value)
  }

  const handlePerformanceChange = (values: string[]) => {
    props.onPerformanceChange(values)
  }

  const ENABLE_ASYNC = process.env.NEXT_PUBLIC_ENABLE_ASYNC_PC_FILTERS === 'true'

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Search</label>
        <ListingsSearchBar
          value={props.searchTerm}
          onChange={props.onSearchChange}
          className="transition-all duration-200 focus:scale-[1.02]"
        />
      </div>

      {/* Systems */}
      <MultiSelect
        label="Systems"
        leftIcon={<MonitorSpeaker className="w-5 h-5" />}
        value={props.systemIds}
        onChange={props.onSystemChange}
        options={systemOptions(props.systems)}
        placeholder="All systems"
        maxDisplayed={2}
      />

      {/* CPUs */}
      {ENABLE_ASYNC ? (
        <AsyncCpuMultiSelect
          label="CPUs"
          leftIcon={<Cpu className="w-5 h-5" />}
          value={props.cpuIds}
          onChange={props.onCpuChange}
          placeholder="All CPUs"
          maxDisplayed={2}
        />
      ) : (
        <MultiSelect
          label="CPUs"
          leftIcon={<Cpu className="w-5 h-5" />}
          value={props.cpuIds}
          onChange={props.onCpuChange}
          options={cpuOptions(props.cpus)}
          placeholder="All CPUs"
          maxDisplayed={2}
        />
      )}

      {/* GPUs */}
      {ENABLE_ASYNC ? (
        <AsyncGpuMultiSelect
          label="GPUs"
          leftIcon={<HardDrive className="w-5 h-5" />}
          value={props.gpuIds}
          onChange={props.onGpuChange}
          placeholder="All GPUs"
          maxDisplayed={2}
        />
      ) : (
        <MultiSelect
          label="GPUs"
          leftIcon={<HardDrive className="w-5 h-5" />}
          value={props.gpuIds}
          onChange={props.onGpuChange}
          options={gpuOptions(props.gpus)}
          placeholder="All GPUs"
          maxDisplayed={2}
        />
      )}

      {/* Emulators */}
      <MultiSelect
        label="Emulators"
        leftIcon={<Gamepad2 className="w-5 h-5" />}
        value={props.emulatorIds}
        onChange={props.onEmulatorChange}
        options={emulatorOptions(props.emulators)}
        placeholder="All emulators"
        maxDisplayed={2}
      />

      {/* Memory Range */}
      <div>
        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          Memory (GB)
        </label>
        <div className="space-y-3">
          <Input
            leftIcon={<MemoryStick className="w-5 h-5" />}
            type="number"
            placeholder="Min memory"
            value={props.minMemory?.toString() ?? ''}
            onChange={handleMinMemoryChange}
            min={1}
            max={128}
            className="transition-all duration-200 focus:scale-[1.02]"
          />
          <Input
            leftIcon={<MemoryStick className="w-5 h-5" />}
            type="number"
            placeholder="Max memory"
            value={props.maxMemory?.toString() ?? ''}
            onChange={handleMaxMemoryChange}
            min={1}
            max={128}
            className="transition-all duration-200 focus:scale-[1.02]"
          />
        </div>
      </div>

      {/* Performance */}
      <MultiSelect
        label="Performance"
        leftIcon={<Rocket className="w-5 h-5" />}
        value={props.performanceIds.map(String)}
        onChange={handlePerformanceChange}
        options={performanceOptions(props.performanceScales)}
        placeholder="All performance levels"
        maxDisplayed={2}
      />
    </div>
  )
}
