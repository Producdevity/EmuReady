'use client'

import React, { type ChangeEventHandler } from 'react'
import { Input } from '@/components/ui'
import {
  DevicePhoneMobileIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import type { ChangeEvent } from 'react'
import SelectInput from '../ui/SelectInput'

interface FiltersProps {
  systemId: string
  deviceId: string
  emulatorId: string
  performanceId: string
  searchTerm: string
  systems: Array<{ id: string; name: string }>
  devices: Array<{ id: string; brand: string; modelName: string }>
  emulators: Array<{ id: string; name: string }>
  performanceScales: Array<{ id: number; label: string }>
  onSystemChange: ChangeEventHandler<HTMLInputElement>
  onDeviceChange: ChangeEventHandler<HTMLInputElement>
  onEmulatorChange: ChangeEventHandler<HTMLInputElement>
  onPerformanceChange: ChangeEventHandler<HTMLInputElement>
  onSearchChange: ChangeEventHandler<HTMLInputElement>
}

export function ListingFilters({
  systemId,
  deviceId,
  emulatorId,
  performanceId,
  searchTerm,
  systems = [],
  devices = [],
  emulators = [],
  performanceScales = [],
  onSystemChange,
  onDeviceChange,
  onEmulatorChange,
  onPerformanceChange,
  onSearchChange,
}: FiltersProps) {
  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" /> Filters
      </h2>

      <div className="space-y-4">
        <SelectInput
          label="System"
          leftIcon={<CpuChipIcon className="w-5 h-5" />}
          value={systemId}
          onChange={onSystemChange}
          options={systems}
        />

        <SelectInput
          label="Device"
          leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
          value={deviceId}
          onChange={onDeviceChange}
          options={devices.map((device) => ({
            id: device.id,
            name: `${device.brand} ${device.modelName}`,
          }))}
        />

        <SelectInput
          label="Emulator"
          leftIcon={<CpuChipIcon className="w-5 h-5" />}
          value={emulatorId}
          onChange={onEmulatorChange}
          options={emulators}
        />

        <SelectInput
          label="Performance"
          leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
          value={performanceId}
          onChange={onPerformanceChange}
          options={performanceScales.map(({ id, label }) => ({
            id: id.toString(),
            name: label,
          }))}
        />

        <div>
          <label className="block mb-1 font-medium">Search</label>
          <Input
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            type="text"
            placeholder="Search games or notes..."
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>
    </aside>
  )
}
