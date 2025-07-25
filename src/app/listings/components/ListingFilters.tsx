'use client'

import { type inferRouterOutputs } from '@trpc/server'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Joystick,
  MonitorSmartphone,
  Cpu,
  Gamepad,
  Rocket,
  Search,
  ChevronLeft,
  Filter,
  Settings2,
  CircleX,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, type ChangeEvent } from 'react'
import { MultiSelect, Input, Button } from '@/components/ui'
import analytics from '@/lib/analytics'
import { type AppRouter } from '@/server/api/root'

type RouterOutput = inferRouterOutputs<AppRouter>
type UserPreferences = RouterOutput['userPreferences']['get']

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
  userPreferences: UserPreferences | null | undefined
  shouldUseUserDeviceFilter: boolean | undefined
  userDeviceIds: string[]
  shouldUseUserSocFilter: boolean | undefined
  userSocIds: string[]
  onEnableUserDeviceFilter?: () => void
  onEnableUserSocFilter?: () => void
  userDeviceFilterDisabled: boolean
  userSocFilterDisabled: boolean
}

function ListingFilters(props: FiltersProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSystemChange = (values: string[]) => {
    props.onSystemChange(values)
    if (values.length === 0) return analytics.filter.clearSystemFilter()
    analytics.filter.system(
      values,
      props.systems.filter((s) => values.includes(s.id)).map((s) => s.name),
    )
  }

  const handleDeviceChange = (values: string[]) => {
    props.onDeviceChange(values)
    if (values.length === 0) return analytics.filter.clearDeviceFilter()
    analytics.filter.device(
      values,
      props.devices
        .filter((d) => values.includes(d.id))
        .map((d) => `${d.brand.name} ${d.modelName}`),
    )
  }

  const handleSocChange = (values: string[]) => {
    props.onSocChange(values)
    if (values.length === 0) return analytics.filter.clearSocFilter()
    analytics.filter.soc(
      values,
      props.socs
        .filter((s) => values.includes(s.id))
        .map((s) => `${s.manufacturer} ${s.name}`),
    )
  }

  const handleEmulatorChange = (values: string[]) => {
    props.onEmulatorChange(values)
    if (values.length === 0) return analytics.filter.clearEmulatorFilter()
    analytics.filter.emulator(
      values,
      props.emulators.filter((e) => values.includes(e.id)).map((e) => e.name),
    )
  }

  const handlePerformanceChange = (values: string[]) => {
    const numericValues = values.map(Number)
    props.onPerformanceChange(numericValues)
    analytics.filter.performance(
      numericValues,
      props.performanceScales
        .filter((p) => numericValues.includes(p.id))
        .map((p) => p.label),
    )
  }

  const clearAllFilters = () => {
    props.onSystemChange([])
    props.onDeviceChange([])
    props.onSocChange([])
    props.onEmulatorChange([])
    props.onPerformanceChange([])
    props.onSearchChange('')
    analytics.filter.clearAll()
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

  return (
    <motion.div className="relative" initial={false} style={{ zIndex: 10 }}>
      <motion.button
        onClick={props.onToggleCollapse}
        className="absolute -right-4 top-2 z-30 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 rounded-full p-2 shadow-xl md:flex hidden group"
        aria-label={props.isCollapsed ? 'Expand filters' : 'Collapse filters'}
        whileHover={{
          scale: 1.1,
          boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ overflow: 'visible' }}
      >
        <AnimatePresence mode="wait">
          {props.isCollapsed ? (
            <motion.div
              key="filter-icon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Filter className="w-4 h-4 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="arrow-icon"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Count Badge */}
        <AnimatePresence>
          {totalActiveFilters > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold shadow-lg z-50"
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {totalActiveFilters}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <motion.aside
        className="bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-xl relative mr-8 md:mr-0"
        initial={false}
        animate={{
          width: props.isCollapsed
            ? isClient
              ? window.innerWidth >= 768
                ? 80
                : 0
              : 80
            : isClient
              ? window.innerWidth >= 768
                ? 320
                : '100%'
              : 320,
          borderRadius: props.isCollapsed ? 20 : 24,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ zIndex: 10, overflow: 'visible' }}
      >
        <div
          className={`${props.isCollapsed ? 'p-4' : 'p-6'} transition-all duration-400 overflow-visible`}
        >
          <AnimatePresence mode="wait">
            {props.isCollapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="hidden md:flex flex-col items-center gap-4 py-4 mt-4"
                style={{ overflow: 'visible' }}
              >
                {/* Filter Category Icons with Badges */}
                <div
                  className="flex flex-col items-center gap-4 w-full"
                  style={{ overflow: 'visible' }}
                >
                  <AnimatePresence>
                    {filterCounts.systems > 0 && (
                      <motion.div
                        key="systems-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.05,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Joystick className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.1,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.systems}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.devices > 0 && (
                      <motion.div
                        key="devices-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.1,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MonitorSmartphone className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.15,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.devices}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.socs > 0 && (
                      <motion.div
                        key="socs-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.15,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.2,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.socs}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.emulators > 0 && (
                      <motion.div
                        key="emulators-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.2,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Gamepad className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.25,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.emulators}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.performance > 0 && (
                      <motion.div
                        key="performance-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.25,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Rocket className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.3,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.performance}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.search > 0 && (
                      <motion.div
                        key="search-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.05,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Search className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.1,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.search}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Collapsed Clear All Button */}
                {hasActiveFilters && (
                  <motion.button
                    key="clear-all-button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={clearAllFilters}
                    className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    title="Clear all filters"
                  >
                    <CircleX className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{ overflow: 'visible' }}
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
                  style={{ position: 'relative', zIndex: 20 }}
                >
                  {/* Search */}
                  <div className="relative">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                      Search
                    </label>
                    <div className="relative">
                      <Input
                        leftIcon={<Search className="w-5 h-5" />}
                        type="text"
                        placeholder="Search games, notes, emulators..."
                        value={props.searchTerm}
                        onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                          props.onSearchChange(ev.target.value)
                        }
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>

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
                      badgeName: device.modelName,
                    }))}
                    placeholder="All devices"
                    maxDisplayed={1}
                  />

                  {/* User Device Filter Indicator */}
                  {props.shouldUseUserDeviceFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Filtered by your devices
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                        Showing results for {props.userDeviceIds.length} of your
                        preferred devices
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href="/profile?tab=devices"
                          className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Settings2 className="w-3 h-3" />
                          Manage devices
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeviceChange([])}
                          className="text-xs h-7 px-2"
                        >
                          Show all devices
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* User Device Preferences Available but Disabled */}
                  {!props.shouldUseUserDeviceFilter &&
                    props.userPreferences?.defaultToUserDevices &&
                    props.userDeviceIds.length > 0 &&
                    props.deviceIds.length === 0 &&
                    props.onEnableUserDeviceFilter && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/10 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {props.userDeviceFilterDisabled
                              ? 'Your device preferences (disabled)'
                              : 'Your device preferences available'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {props.userDeviceFilterDisabled
                            ? `You chose to see all devices. Click to filter by your ${props.userDeviceIds.length} preferred devices instead.`
                            : `You have ${props.userDeviceIds.length} preferred devices. Enable filtering to show only listings for your devices.`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={props.onEnableUserDeviceFilter}
                          className="text-xs h-7 px-3"
                        >
                          {props.userDeviceFilterDisabled
                            ? 'Filter by my devices'
                            : 'Use my device preferences'}
                        </Button>
                      </motion.div>
                    )}

                  <MultiSelect
                    label="SoCs"
                    leftIcon={<Cpu className="w-5 h-5" />}
                    value={props.socIds}
                    onChange={handleSocChange}
                    options={props.socs.map((soc) => ({
                      id: soc.id,
                      name: `${soc.manufacturer} ${soc.name}`,
                      badgeName: soc.name,
                    }))}
                    placeholder="All SoCs"
                    maxDisplayed={1}
                  />

                  {/* User SoC Filter Indicator */}
                  {props.shouldUseUserSocFilter && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Filtered by your SoCs
                        </span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                        Showing results for {props.userSocIds.length} of your
                        preferred SoCs
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href="/profile?tab=socs"
                          className="inline-flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Settings2 className="w-3 h-3" />
                          Manage SoCs
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSocChange([])}
                          className="text-xs h-7 px-2"
                        >
                          Show all SoCs
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* User SoC Preferences Available but Disabled */}
                  {!props.shouldUseUserSocFilter &&
                    props.userPreferences?.defaultToUserSocs &&
                    props.userSocIds.length > 0 &&
                    props.socIds.length === 0 &&
                    props.onEnableUserSocFilter && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800/50 dark:to-purple-900/10 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {props.userSocFilterDisabled
                              ? 'Your SoC preferences (disabled)'
                              : 'Your SoC preferences available'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {props.userSocFilterDisabled
                            ? `You chose to see all SoCs. Click to filter by your ${props.userSocIds.length} preferred SoCs instead.`
                            : `You have ${props.userSocIds.length} preferred SoCs. Enable filtering to show only listings for your SoCs.`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={props.onEnableUserSocFilter}
                          className="text-xs h-7 px-3"
                        >
                          {props.userSocFilterDisabled
                            ? 'Filter by my SoCs'
                            : 'Use my SoC preferences'}
                        </Button>
                      </motion.div>
                    )}

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
                </motion.div>

                {/* Active Filters Summary */}
                <AnimatePresence>
                  {hasActiveFilters && (
                    <motion.div
                      key="active-filters-summary"
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
                        {props.searchTerm && (
                          <motion.div
                            key="summary-search"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                            Search: &ldquo;{props.searchTerm}&rdquo;
                          </motion.div>
                        )}
                        {props.systemIds.length > 0 && (
                          <motion.div
                            key="summary-systems"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            Systems: {props.systemIds.length} selected
                          </motion.div>
                        )}
                        {props.deviceIds.length > 0 && (
                          <motion.div
                            key="summary-devices"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            Devices: {props.deviceIds.length} selected
                          </motion.div>
                        )}
                        {props.socIds.length > 0 && (
                          <motion.div
                            key="summary-socs"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            SoCs: {props.socIds.length} selected
                          </motion.div>
                        )}
                        {props.emulatorIds.length > 0 && (
                          <motion.div
                            key="summary-emulators"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Emulators: {props.emulatorIds.length} selected
                          </motion.div>
                        )}
                        {props.performanceIds.length > 0 && (
                          <motion.div
                            key="summary-performance"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Performance: {props.performanceIds.length} selected
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </motion.div>
  )
}

export default ListingFilters
