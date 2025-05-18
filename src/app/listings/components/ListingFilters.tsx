'use client'

import { type ChangeEvent, type ChangeEventHandler } from 'react'
import { SelectInput, Input } from '@/components/ui'
import analytics from '@/lib/analytics'
import {
  DevicePhoneMobileIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

interface FiltersProps {
  systemId: string
  deviceId: string
  emulatorId: string
  performanceId: string
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
  onSystemChange: ChangeEventHandler<HTMLInputElement>
  onDeviceChange: ChangeEventHandler<HTMLInputElement>
  onEmulatorChange: ChangeEventHandler<HTMLInputElement>
  onPerformanceChange: ChangeEventHandler<HTMLInputElement>
  onSearchChange: ChangeEventHandler<HTMLInputElement>
}

export type SelectInputEvent = ChangeEvent<HTMLInputElement>

function ListingFilters(props: FiltersProps) {
  const handleSystemChange = (ev: SelectInputEvent) => {
    props.onSystemChange(ev)
    analytics.filter.system(ev.target.value)
  }

  const handleDeviceChange = (ev: SelectInputEvent) => {
    props.onDeviceChange(ev)
    analytics.filter.device(ev.target.value)
  }

  const handleEmulatorChange = (ev: SelectInputEvent) => {
    props.onEmulatorChange(ev)
    analytics.filter.emulator(ev.target.value)
  }

  const handlePerformanceChange = (ev: SelectInputEvent) => {
    props.onPerformanceChange(ev)
    analytics.filter.performance(ev.target.value)
  }

  const handleSearchChange = (ev: SelectInputEvent) => {
    props.onSearchChange(ev)
    analytics.filter.search(ev.target.value)
  }

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" /> Filters
      </h2>

      <div className="space-y-4">
        <SelectInput
          label="System"
          leftIcon={<CpuChipIcon className="w-5 h-5" />}
          value={props.systemId}
          onChange={handleSystemChange}
          options={props.systems}
        />

        <SelectInput
          label="Device"
          leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
          value={props.deviceId}
          onChange={handleDeviceChange}
          options={props.devices.map((device) => ({
            id: device.id,
            name: `${device.brand.name} ${device.modelName}`,
          }))}
        />

        <SelectInput
          label="Emulator"
          leftIcon={<CpuChipIcon className="w-5 h-5" />}
          value={props.emulatorId}
          onChange={handleEmulatorChange}
          options={props.emulators}
        />

        <SelectInput
          label="Performance"
          leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
          value={props.performanceId}
          onChange={handlePerformanceChange}
          options={props.performanceScales.map(({ id, label }) => ({
            id: id.toString(),
            name: label,
          }))}
        />

        <div>
          <label className="block mb-1 font-medium">Search</label>
          <Input
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            type="text"
            placeholder="Search..."
            value={props.searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
    </aside>
  )
}
export default ListingFilters
