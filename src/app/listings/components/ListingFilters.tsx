'use client'

import { useState, useEffect } from 'react'
import { MultiSelect, Input } from '@/components/ui'
import analytics from '@/lib/analytics'
import { motion, AnimatePresence } from 'framer-motion'
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
  Filter,
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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  const filterCounts = {
    systems: props.systemIds.length,
    devices: props.deviceIds.length,
    socs: props.socIds.length,
    emulators: props.emulatorIds.length,
    performance: props.performanceIds.length,
    search: props.searchTerm ? 1 : 0,
  }

  const totalActiveFilters = Object.values(filterCounts).reduce(
    (sum, count) => sum + count,
    0,
  )

  // Calculate responsive width for animation
  const getResponsiveWidth = () => {
    if (!isClient) return props.isCollapsed ? 80 : 320
    return props.isCollapsed
      ? window.innerWidth >= 768
        ? 80
        : 0
      : window.innerWidth >= 768
        ? 320
        : '100%'
  }

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Enhanced Toggle Button */}
      <motion.button
        onClick={props.onToggleCollapse}
        className="absolute -right-3 top-8 z-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 rounded-full p-2.5 shadow-xl md:flex hidden group"
        aria-label={props.isCollapsed ? 'Expand filters' : 'Collapse filters'}
        whileHover={{
          scale: 1.15,
          rotate: props.isCollapsed ? 0 : 180,
          boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ rotate: props.isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {props.isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
        </motion.div>

        {/* Active Filter Count Badge */}
        <AnimatePresence>
          {totalActiveFilters > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {totalActiveFilters}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Enhanced Sidebar */}
      <motion.aside
        className={`
          ${props.isCollapsed ? 'w-0 md:w-20' : 'w-full md:w-80'} 
          bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 
          flex-shrink-0 shadow-xl overflow-hidden relative
        `}
        animate={{
          width: getResponsiveWidth(),
          borderRadius: props.isCollapsed ? '1rem' : '1.5rem',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{
          padding: props.isCollapsed ? '0.5rem' : '1.5rem',
        }}
      >
        <AnimatePresence mode="wait">
          {props.isCollapsed ? (
            /* Enhanced Collapsed Icons */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="hidden md:flex flex-col items-center gap-3 pt-6"
            >
              {/* Main Filter Icon */}
              <motion.div
                className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Filter className="w-6 h-6 text-white" />
              </motion.div>

              {/* Individual Filter Icons with Counts */}
              <div className="space-y-3">
                {filterCounts.systems > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative group"
                  >
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Joystick className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {filterCounts.systems}
                    </div>
                  </motion.div>
                )}

                {filterCounts.devices > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="relative"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <MonitorSmartphone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {filterCounts.devices}
                    </div>
                  </motion.div>
                )}

                {filterCounts.socs > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {filterCounts.socs}
                    </div>
                  </motion.div>
                )}

                {filterCounts.emulators > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="relative"
                  >
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Gamepad className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {filterCounts.emulators}
                    </div>
                  </motion.div>
                )}

                {filterCounts.performance > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative"
                  >
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Rocket className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {filterCounts.performance}
                    </div>
                  </motion.div>
                )}

                {filterCounts.search > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="relative"
                  >
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Search className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      1
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Clear All Button (Collapsed) */}
              {hasActiveFilters && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={clearAllFilters}
                  className="mt-4 p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200"
                  title="Clear all filters"
                >
                  <Settings2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            /* Enhanced Full Content */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.div
                className="flex items-center gap-3 mb-6"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Settings2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Filters
                </h2>
                {totalActiveFilters > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                  >
                    {totalActiveFilters}
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                className="space-y-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
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
              </motion.div>

              {/* Enhanced Active Filters Summary */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active Filters
                      </h3>
                      <motion.button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
                          transition-colors duration-150 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear All
                      </motion.button>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {props.systemIds.length > 0 && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Systems: {props.systemIds.length} selected
                        </motion.div>
                      )}
                      {props.deviceIds.length > 0 && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Devices: {props.deviceIds.length} selected
                        </motion.div>
                      )}
                      {props.socIds.length > 0 && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          SoCs: {props.socIds.length} selected
                        </motion.div>
                      )}
                      {props.emulatorIds.length > 0 && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.25 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          Emulators: {props.emulatorIds.length} selected
                        </motion.div>
                      )}
                      {props.performanceIds.length > 0 && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Performance: {props.performanceIds.length} selected
                        </motion.div>
                      )}
                      {props.searchTerm && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.35 }}
                          className="flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Search: &ldquo;{props.searchTerm}&rdquo;
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  )
}

export default ListingFilters
