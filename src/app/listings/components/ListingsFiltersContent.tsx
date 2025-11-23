'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Joystick, MonitorSmartphone, Cpu, Gamepad, Rocket } from 'lucide-react'
import { ActiveFiltersSummary, ListingsSearchBar } from '@/app/listings/shared/components'
import { buildActiveFilterItems } from '@/app/listings/shared/utils/buildActiveFilterItems'
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
  onClearAll?: () => void
  showActiveFilters?: boolean
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
        color="blue"
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
          color="green"
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
          color="purple"
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
        color="orange"
        placeholder="All emulators"
        maxDisplayed={1}
      />

      <MultiSelect
        label="Performance"
        leftIcon={<Rocket className="w-5 h-5" />}
        value={props.performanceIds.map(String)}
        onChange={props.onPerformanceChange}
        options={performanceOptions(props.performanceScales)}
        color="red"
        placeholder="All performance levels"
        maxDisplayed={1}
      />

      {props.showActiveFilters && props.onClearAll && (
        <AnimatePresence>
          {hasActiveFilters && (
            <ActiveFiltersSummary
              showClearAll
              onClearAll={props.onClearAll}
              items={buildActiveFilterItems({
                searchTerm: props.searchTerm,
                systemIds: props.systemIds,
                deviceIds: props.deviceIds,
                socIds: props.socIds,
                emulatorIds: props.emulatorIds,
                performanceIds: props.performanceIds,
              })}
            />
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
