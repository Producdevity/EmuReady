'use client'

import { MultiSelect, Input } from '@/components/ui'
import analytics from '@/lib/analytics'
import {
  DevicePhoneMobileIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

interface FiltersProps {
  systemIds: string[]
  deviceIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
  searchTerm: string
  systems: Array<{ id: string; name: string }>
  devices: Array<{
    id: string
    brandId: string
    modelName: string
    brand: { id: string; name: string; createdAt: Date }
  }>
  emulators: Array<{ id: string; name: string }>
  performanceScales: Array<{ id: number; label: string }>
  onSystemChange: (values: string[]) => void
  onDeviceChange: (values: string[]) => void
  onEmulatorChange: (values: string[]) => void
  onPerformanceChange: (values: number[]) => void
  onSearchChange: (value: string) => void
}

function ListingFilters(props: FiltersProps) {
  const handleSystemChange = (values: string[]) => {
    props.onSystemChange(values)
    analytics.filter.system(values.join(','))
  }

  const handleDeviceChange = (values: string[]) => {
    props.onDeviceChange(values)
    analytics.filter.device(values.join(','))
  }

  const handleEmulatorChange = (values: string[]) => {
    props.onEmulatorChange(values)
    analytics.filter.emulator(values.join(','))
  }

  const handlePerformanceChange = (values: string[]) => {
    const numericValues = values.map(Number)
    props.onPerformanceChange(numericValues)
    analytics.filter.performance(values.join(','))
  }

  const handleSearchChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.onSearchChange(ev.target.value)
    analytics.filter.search(ev.target.value)
  }

  return (
    <aside className="w-full md:w-80 bg-white dark:bg-gray-800 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-2xl shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Filters
        </h2>
      </div>

      <div className="space-y-6">
        <MultiSelect
          label="Systems"
          leftIcon={<CpuChipIcon className="w-5 h-5" />}
          value={props.systemIds}
          onChange={handleSystemChange}
          options={props.systems}
          placeholder="All systems"
          maxDisplayed={1}
        />

        <MultiSelect
          label="Devices"
          leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
          value={props.deviceIds}
          onChange={handleDeviceChange}
          options={props.devices.map((device) => ({
            id: device.id,
            name: `${device.brand.name} ${device.modelName}`,
          }))}
          placeholder="All devices"
          maxDisplayed={1}
        />

        <MultiSelect
          label="Emulators"
          leftIcon={<CpuChipIcon className="w-5 h-5" />}
          value={props.emulatorIds}
          onChange={handleEmulatorChange}
          options={props.emulators}
          placeholder="All emulators"
          maxDisplayed={1}
        />

        <MultiSelect
          label="Performance"
          leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
          value={props.performanceIds.map(String)}
          onChange={handlePerformanceChange}
          options={props.performanceScales.map(({ id, label }) => ({
            id: id.toString(),
            name: label,
          }))}
          placeholder="All performance levels"
          maxDisplayed={1}
        />

        <div className="relative">
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Search
          </label>
          <div className="relative">
            <Input
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
              type="text"
              placeholder="Search games, notes..."
              value={props.searchTerm}
              onChange={handleSearchChange}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(props.systemIds.length > 0 ||
        props.deviceIds.length > 0 ||
        props.emulatorIds.length > 0 ||
        props.performanceIds.length > 0 ||
        props.searchTerm) && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Filters
            </h3>
            <button
              onClick={() => {
                props.onSystemChange([])
                props.onDeviceChange([])
                props.onEmulatorChange([])
                props.onPerformanceChange([])
                props.onSearchChange('')
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                transition-colors duration-150 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {props.systemIds.length > 0 && (
              <div>Systems: {props.systemIds.length} selected</div>
            )}
            {props.deviceIds.length > 0 && (
              <div>Devices: {props.deviceIds.length} selected</div>
            )}
            {props.emulatorIds.length > 0 && (
              <div>Emulators: {props.emulatorIds.length} selected</div>
            )}
            {props.performanceIds.length > 0 && (
              <div>Performance: {props.performanceIds.length} selected</div>
            )}
            {props.searchTerm && (
              <div>Search: &ldquo;{props.searchTerm}&rdquo;</div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

export default ListingFilters
