'use client'

import { motion } from 'framer-motion'
import { Joystick, MonitorSmartphone, Cpu, Gamepad, Rocket } from 'lucide-react'
import { ListingsSearchBar } from '@/app/listings/shared/components'
import { MultiSelect } from '@/components/ui'
import AsyncDeviceMultiSelect from '@/components/ui/form/AsyncDeviceMultiSelect'
import AsyncSocMultiSelect from '@/components/ui/form/AsyncSocMultiSelect'
import {
  performanceOptions,
  deviceOptions,
  socOptions,
  systemOptions,
  emulatorOptions,
} from '@/utils/options'

interface Props {
  systemIds: string[]
  deviceIds: string[]
  socIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
  searchTerm: string
  systems: { id: string; name: string }[]
  devices: { id: string; modelName: string; brand: { name: string } }[]
  socs: { id: string; name: string; manufacturer: string }[]
  emulators: { id: string; name: string }[]
  performanceScales: { id: number; label: string }[]
  onSystemChange: (values: string[]) => void
  onDeviceChange: (values: string[]) => void
  onSocChange: (values: string[]) => void
  onEmulatorChange: (values: string[]) => void
  onPerformanceChange: (values: string[]) => void
  onSearchChange: (value: string) => void
}

export default function ListingsFiltersContent(props: Props) {
  const ENABLE_ASYNC_LISTINGS = process.env.NEXT_PUBLIC_ENABLE_ASYNC_LISTINGS_FILTERS === 'true'
  const hasActiveFilters =
    props.systemIds.length > 0 ||
    props.deviceIds.length > 0 ||
    props.socIds.length > 0 ||
    props.emulatorIds.length > 0 ||
    props.performanceIds.length > 0 ||
    props.searchTerm

  return (
    <motion.div
      className="space-y-6"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      style={{ position: 'relative', zIndex: 20 }}
    >
      <div className="relative">
        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Search</label>
        <ListingsSearchBar
          value={props.searchTerm}
          onChange={props.onSearchChange}
          className="transition-all duration-200 focus:scale-[1.02]"
        />
      </div>

      <MultiSelect
        label="Systems"
        leftIcon={<Joystick className="w-5 h-5" />}
        value={props.systemIds}
        onChange={props.onSystemChange}
        options={systemOptions(props.systems)}
        placeholder="All systems"
        maxDisplayed={1}
      />

      {ENABLE_ASYNC_LISTINGS ? (
        <AsyncDeviceMultiSelect
          label="Devices"
          leftIcon={<MonitorSmartphone className="w-5 h-5" />}
          value={props.deviceIds}
          onChange={props.onDeviceChange}
          placeholder="All devices"
          maxDisplayed={1}
        />
      ) : (
        <MultiSelect
          label="Devices"
          leftIcon={<MonitorSmartphone className="w-5 h-5" />}
          value={props.deviceIds}
          onChange={props.onDeviceChange}
          options={deviceOptions(props.devices)}
          placeholder="All devices"
          maxDisplayed={1}
        />
      )}

      {ENABLE_ASYNC_LISTINGS ? (
        <AsyncSocMultiSelect
          label="SoCs"
          leftIcon={<Cpu className="w-5 h-5" />}
          value={props.socIds}
          onChange={props.onSocChange}
          placeholder="All SoCs"
          maxDisplayed={1}
        />
      ) : (
        <MultiSelect
          label="SoCs"
          leftIcon={<Cpu className="w-5 h-5" />}
          value={props.socIds}
          onChange={props.onSocChange}
          options={socOptions(props.socs)}
          placeholder="All SoCs"
          maxDisplayed={1}
        />
      )}

      <MultiSelect
        label="Emulators"
        leftIcon={<Gamepad className="w-5 h-5" />}
        value={props.emulatorIds}
        onChange={props.onEmulatorChange}
        options={emulatorOptions(props.emulators)}
        placeholder="All emulators"
        maxDisplayed={1}
      />

      <MultiSelect
        label="Performance"
        leftIcon={<Rocket className="w-5 h-5" />}
        value={props.performanceIds.map(String)}
        onChange={props.onPerformanceChange}
        options={performanceOptions(props.performanceScales)}
        placeholder="All performance levels"
        maxDisplayed={1}
      />

      {hasActiveFilters && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters</h3>
          </div>
        </div>
      )}
    </motion.div>
  )
}
