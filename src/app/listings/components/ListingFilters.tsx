'use client'

import { MultiSelect, Input } from '@/components/ui'
import analytics from '@/lib/analytics'
import {
  ChevronLeft,
  ChevronRight,
  Gamepad,
  Settings2,
  Cpu,
  MonitorSmartphone,
  Rocket,
  Search,
  Joystick,
} from 'lucide-react'

interface FiltersProps {
  systemIds: string[]
  deviceIds: string[]
  socIds: string[]
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
  socs: Array<{ id: string; name: string; manufacturer: string }>
  emulators: Array<{ id: string; name: string }>
  performanceScales: Array<{ id: number; label: string }>
  onSystemChange: (values: string[]) => void
  onDeviceChange: (values: string[]) => void
  onSocChange: (values: string[]) => void
  onEmulatorChange: (values: string[]) => void
  onPerformanceChange: (values: number[]) => void
  onSearchChange: (value: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
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

  const handleSocChange = (values: string[]) => {
    props.onSocChange(values)
    analytics.filter.system(values.join(',')) // Using system analytics for now
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

  const clearAllFilters = () => {
    props.onSystemChange([])
    props.onDeviceChange([])
    props.onSocChange([])
    props.onEmulatorChange([])
    props.onPerformanceChange([])
    props.onSearchChange('')
  }

  const hasActiveFilters =
    props.systemIds.length > 0 ||
    props.deviceIds.length > 0 ||
    props.socIds.length > 0 ||
    props.emulatorIds.length > 0 ||
    props.performanceIds.length > 0 ||
    props.searchTerm

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={props.onToggleCollapse}
        className="absolute -right-4 top-6 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 md:flex hidden"
        aria-label={props.isCollapsed ? 'Expand filters' : 'Collapse filters'}
      >
        {props.isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          ${props.isCollapsed ? 'w-0 md:w-16' : 'w-full md:w-80'} 
          bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 
          flex-shrink-0 rounded-2xl shadow-xl transition-all duration-300 ease-in-out overflow-hidden
          ${props.isCollapsed ? 'md:p-2' : 'p-6'}
        `}
      >
        {/* Collapsed Icons */}
        {props.isCollapsed && (
          <div className="hidden md:flex flex-col items-center gap-4 pt-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            {hasActiveFilters && (
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
        )}

        {/* Full Content */}
        <div
          className={`${props.isCollapsed ? 'md:hidden' : 'block'} transition-opacity duration-300`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Filters
            </h2>
          </div>

          <div className="space-y-6">
            <MultiSelect
              label="Systems"
              leftIcon={<Joystick className="w-5 h-5" />}
              value={props.systemIds}
              onChange={handleSystemChange}
              options={props.systems}
              placeholder="All systems"
              maxDisplayed={1}
            />

            <MultiSelect
              label="Devices"
              leftIcon={<MonitorSmartphone className="w-5 h-5" />}
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
              label="SoCs"
              leftIcon={<Cpu className="w-5 h-5" />}
              value={props.socIds}
              onChange={handleSocChange}
              options={props.socs.map((soc) => ({
                id: soc.id,
                name: `${soc.manufacturer} ${soc.name}`,
              }))}
              placeholder="All SoCs"
              maxDisplayed={1}
            />

            <MultiSelect
              label="Emulators"
              leftIcon={<Gamepad className="w-5 h-5" />}
              value={props.emulatorIds}
              onChange={handleEmulatorChange}
              options={props.emulators}
              placeholder="All emulators"
              maxDisplayed={1}
            />

            <MultiSelect
              label="Performance"
              leftIcon={<Rocket className="w-5 h-5" />}
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
                  leftIcon={<Search className="w-5 h-5" />}
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
          {hasActiveFilters && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-1 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Filters
                </h3>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
                    transition-colors duration-150 font-medium hover:scale-105 transform"
                >
                  Clear All
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {props.systemIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Systems: {props.systemIds.length} selected
                  </div>
                )}
                {props.deviceIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200 delay-75">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Devices: {props.deviceIds.length} selected
                  </div>
                )}
                {props.socIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200 delay-100">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    SoCs: {props.socIds.length} selected
                  </div>
                )}
                {props.emulatorIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200 delay-150">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Emulators: {props.emulatorIds.length} selected
                  </div>
                )}
                {props.performanceIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200 delay-200">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Performance: {props.performanceIds.length} selected
                  </div>
                )}
                {props.searchTerm && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200 delay-250">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Search: &ldquo;{props.searchTerm}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

export default ListingFilters
