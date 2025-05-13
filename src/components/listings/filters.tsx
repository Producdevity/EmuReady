'use client'

import React from 'react'
import { Input } from '@/components/ui'
import {
  DevicePhoneMobileIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import type { ChangeEvent } from 'react'

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
  onSystemChange: (e: ChangeEvent<HTMLSelectElement>) => void
  onDeviceChange: (e: ChangeEvent<HTMLSelectElement>) => void
  onEmulatorChange: (e: ChangeEvent<HTMLSelectElement>) => void
  onPerformanceChange: (e: ChangeEvent<HTMLSelectElement>) => void
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
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
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />{' '}
        Filters
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">System</label>
          <Input
            leftIcon={<CpuChipIcon className="w-5 h-5" />}
            as="select"
            value={systemId}
            onChange={(e: React.SyntheticEvent) => 
              onSystemChange(e as unknown as ChangeEvent<HTMLSelectElement>)
            }
            className="mb-0"
          >
            <option value="">All Systems</option>
            {systems?.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.name}
              </option>
            ))}
          </Input>
        </div>

        <div>
          <label className="block mb-1 font-medium">Device</label>
          <Input
            leftIcon={<DevicePhoneMobileIcon className="w-5 h-5" />}
            as="select"
            value={deviceId}
            onChange={(e: React.SyntheticEvent) => 
              onDeviceChange(e as unknown as ChangeEvent<HTMLSelectElement>)
            }
            className="mb-0"
          >
            <option value="">All Devices</option>
            {devices?.map((device) => (
              <option key={device.id} value={device.id}>
                {device.brand} {device.modelName}
              </option>
            ))}
          </Input>
        </div>

        <div>
          <label className="block mb-1 font-medium">Emulator</label>
          <Input
            leftIcon={<CpuChipIcon className="w-5 h-5" />}
            as="select"
            value={emulatorId}
            onChange={(e: React.SyntheticEvent) => 
              onEmulatorChange(e as unknown as ChangeEvent<HTMLSelectElement>)
            }
            className="mb-0"
          >
            <option value="">All Emulators</option>
            {emulators?.map((emulator) => (
              <option key={emulator.id} value={emulator.id}>
                {emulator.name}
              </option>
            ))}
          </Input>
        </div>

        <div>
          <label className="block mb-1 font-medium">Performance</label>
          <Input
            leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
            as="select"
            value={performanceId}
            onChange={(e: React.SyntheticEvent) => 
              onPerformanceChange(e as unknown as ChangeEvent<HTMLSelectElement>)
            }
            className="mb-0"
          >
            <option value="">All Performance</option>
            {performanceScales?.map((perf) => (
              <option key={perf.id} value={perf.id.toString()}>
                {perf.label}
              </option>
            ))}
          </Input>
        </div>

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