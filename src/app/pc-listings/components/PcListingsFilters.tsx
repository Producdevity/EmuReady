'use client'

import {
  Search,
  Cpu,
  HardDrive,
  Rocket,
  Filter,
  MonitorSpeaker,
  Gamepad2,
  MemoryStick,
} from 'lucide-react'
import { type ChangeEvent } from 'react'
import { MultiSelect, Input } from '@/components/ui'
import analytics from '@/lib/analytics'
import { type System, type PerformanceScale, type Emulator } from '@orm'

type CpuWithBrand = {
  id: string
  modelName: string
  brand: {
    name: string
  }
}

type GpuWithBrand = {
  id: string
  modelName: string
  brand: {
    name: string
  }
}

interface PcListingsFiltersProps {
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
  onPerformanceChange: (values: number[]) => void
  onMinMemoryChange: (value: number | null) => void
  onMaxMemoryChange: (value: number | null) => void
  onSearchChange: (value: string) => void
}

export default function PcListingsFilters({
  cpuIds,
  gpuIds,
  systemIds,
  emulatorIds,
  performanceIds,
  minMemory,
  maxMemory,
  searchTerm,
  cpus,
  gpus,
  systems,
  emulators,
  performanceScales,
  onCpuChange,
  onGpuChange,
  onSystemChange,
  onEmulatorChange,
  onPerformanceChange,
  onMinMemoryChange,
  onMaxMemoryChange,
  onSearchChange,
}: PcListingsFiltersProps) {
  const handleSystemChange = (values: string[]) => {
    onSystemChange(values)
    if (values.length === 0) return analytics.filter.clearSystemFilter()
    analytics.filter.system(values)
  }

  const handleCpuChange = (values: string[]) => {
    onCpuChange(values)
    analytics.filter.device(values)
  }

  const handleGpuChange = (values: string[]) => {
    onGpuChange(values)
    analytics.filter.device(values)
  }

  const handleEmulatorChange = (values: string[]) => {
    onEmulatorChange(values)
    analytics.filter.emulator(values)
  }

  const handleMinMemoryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value === '' ? null : Number(ev.target.value)
    onMinMemoryChange(value)
    analytics.filter.performance([value || 0])
  }

  const handleMaxMemoryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value === '' ? null : Number(ev.target.value)
    onMaxMemoryChange(value)
    analytics.filter.performance([value || 0])
  }

  const handlePerformanceChange = (values: string[]) => {
    const numericValues = values.map(Number)
    onPerformanceChange(numericValues)
    analytics.filter.performance(numericValues)
  }

  const clearAllFilters = () => {
    onSearchChange('')
    onSystemChange([])
    onCpuChange([])
    onGpuChange([])
    onEmulatorChange([])
    onPerformanceChange([])
    onMinMemoryChange(null)
    onMaxMemoryChange(null)
    analytics.filter.clearAll()
  }

  const hasActiveFilters =
    searchTerm ||
    systemIds.length > 0 ||
    cpuIds.length > 0 ||
    gpuIds.length > 0 ||
    emulatorIds.length > 0 ||
    performanceIds.length > 0 ||
    minMemory !== null ||
    maxMemory !== null

  const totalActiveFilters = [
    searchTerm ? 1 : 0,
    systemIds.length,
    cpuIds.length,
    gpuIds.length,
    emulatorIds.length,
    performanceIds.length,
    minMemory !== null ? 1 : 0,
    maxMemory !== null ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <aside className="w-full lg:w-80 h-full lg:sticky lg:top-0 bg-white dark:bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              PC Filters
            </h2>
            {totalActiveFilters > 0 && (
              <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                {totalActiveFilters}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Search */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <Input
              leftIcon={<Search className="w-5 h-5" />}
              type="text"
              placeholder="Search games, notes, emulators..."
              value={searchTerm}
              onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                onSearchChange(ev.target.value)
              }
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          {/* Systems */}
          <MultiSelect
            label="Systems"
            leftIcon={<MonitorSpeaker className="w-5 h-5" />}
            value={systemIds}
            onChange={handleSystemChange}
            options={systems.map((system) => ({
              id: system.id,
              name: system.name,
            }))}
            placeholder="All systems"
            maxDisplayed={2}
          />

          {/* CPUs */}
          <MultiSelect
            label="CPUs"
            leftIcon={<Cpu className="w-5 h-5" />}
            value={cpuIds}
            onChange={handleCpuChange}
            options={cpus.map((cpu) => ({
              id: cpu.id,
              name: `${cpu.brand.name} ${cpu.modelName}`,
              badgeName: cpu.modelName,
            }))}
            placeholder="All CPUs"
            maxDisplayed={2}
          />

          {/* GPUs */}
          <MultiSelect
            label="GPUs"
            leftIcon={<HardDrive className="w-5 h-5" />}
            value={gpuIds}
            onChange={handleGpuChange}
            options={gpus.map((gpu) => ({
              id: gpu.id,
              name: `${gpu.brand.name} ${gpu.modelName}`,
              badgeName: gpu.modelName,
            }))}
            placeholder="All GPUs"
            maxDisplayed={2}
          />

          {/* Emulators */}
          <MultiSelect
            label="Emulators"
            leftIcon={<Gamepad2 className="w-5 h-5" />}
            value={emulatorIds}
            onChange={handleEmulatorChange}
            options={emulators.map((emulator) => ({
              id: emulator.id,
              name: emulator.name,
            }))}
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
                value={minMemory?.toString() ?? ''}
                onChange={handleMinMemoryChange}
                min={1}
                max={128}
                className="transition-all duration-200 focus:scale-[1.02]"
              />
              <Input
                leftIcon={<MemoryStick className="w-5 h-5" />}
                type="number"
                placeholder="Max memory"
                value={maxMemory?.toString() ?? ''}
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
            value={performanceIds.map(String)}
            onChange={handlePerformanceChange}
            options={performanceScales.map(({ id, label }) => ({
              id: id.toString(),
              name: label,
            }))}
            placeholder="All performance levels"
            maxDisplayed={2}
          />
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Filters
              </h3>
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
                  transition-colors duration-150 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Clear All
              </button>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {searchTerm && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Search: &ldquo;{searchTerm}&rdquo;
                </div>
              )}
              {systemIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Systems: {systemIds.length} selected
                </div>
              )}
              {cpuIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  CPUs: {cpuIds.length} selected
                </div>
              )}
              {gpuIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  GPUs: {gpuIds.length} selected
                </div>
              )}
              {emulatorIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Emulators: {emulatorIds.length} selected
                </div>
              )}
              {(minMemory !== null || maxMemory !== null) && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Memory: {minMemory ?? '?'} - {maxMemory ?? '?'} GB
                </div>
              )}
              {performanceIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Performance: {performanceIds.length} selected
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
