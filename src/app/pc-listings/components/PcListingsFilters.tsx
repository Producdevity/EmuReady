'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Joystick,
  Cpu,
  HardDrive,
  Gamepad,
  Rocket,
  Search,
  ChevronLeft,
  Filter,
  Settings2,
  CircleX,
  MonitorSpeaker,
  MemoryStick,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type ChangeEvent } from 'react'
import { MultiSelect, Input } from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'
import { PcOs } from '@orm'

interface PcListingsFiltersProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function PcListingsFilters({
  isCollapsed,
  onToggleCollapse,
}: PcListingsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Parse current filters from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedSystems, setSelectedSystems] = useState<string[]>(
    parseArrayParam(searchParams.get('systemIds')),
  )
  const [selectedCpus, setSelectedCpus] = useState<string[]>(
    parseArrayParam(searchParams.get('cpuIds')),
  )
  const [selectedGpus, setSelectedGpus] = useState<string[]>(
    parseArrayParam(searchParams.get('gpuIds')),
  )
  const [selectedEmulators, setSelectedEmulators] = useState<string[]>(
    parseArrayParam(searchParams.get('emulatorIds')),
  )
  const [selectedPerformance, setSelectedPerformance] = useState<number[]>(
    parseNumberArrayParam(searchParams.get('performanceIds')),
  )
  const [selectedOs, setSelectedOs] = useState<PcOs[]>(
    parseArrayParam(searchParams.get('osFilter')) as PcOs[],
  )
  const [memoryMin, setMemoryMin] = useState(
    searchParams.get('memoryMin') || '',
  )
  const [memoryMax, setMemoryMax] = useState(
    searchParams.get('memoryMax') || '',
  )

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const debouncedMemoryMin = useDebouncedValue(memoryMin, 300)
  const debouncedMemoryMax = useDebouncedValue(memoryMax, 300)

  // Fetch filter options
  const systemsQuery = api.systems.get.useQuery()
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 100 })
  const performanceScalesQuery = api.listings.performanceScales.useQuery()
  const cpusQuery = api.cpus.get.useQuery({ search: '', limit: 500 })
  const gpusQuery = api.gpus.get.useQuery({ search: '', limit: 500 })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
    if (selectedSystems.length)
      params.set('systemIds', JSON.stringify(selectedSystems))
    if (selectedCpus.length) params.set('cpuIds', JSON.stringify(selectedCpus))
    if (selectedGpus.length) params.set('gpuIds', JSON.stringify(selectedGpus))
    if (selectedEmulators.length)
      params.set('emulatorIds', JSON.stringify(selectedEmulators))
    if (selectedPerformance.length)
      params.set('performanceIds', JSON.stringify(selectedPerformance))
    if (selectedOs.length) params.set('osFilter', JSON.stringify(selectedOs))
    if (debouncedMemoryMin) params.set('memoryMin', debouncedMemoryMin)
    if (debouncedMemoryMax) params.set('memoryMax', debouncedMemoryMax)

    const url = params.toString() ? `?${params.toString()}` : '/pc-listings'
    router.replace(url, { scroll: false })
  }, [
    debouncedSearchTerm,
    selectedSystems,
    selectedCpus,
    selectedGpus,
    selectedEmulators,
    selectedPerformance,
    selectedOs,
    debouncedMemoryMin,
    debouncedMemoryMax,
    router,
  ])

  // Filter handlers with analytics
  const handleSystemChange = (values: string[]) => {
    setSelectedSystems(values)
    if (values.length === 0) return analytics.filter.clearSystemFilter()
    analytics.filter.system(values)
  }

  const handleCpuChange = (values: string[]) => {
    setSelectedCpus(values)
    analytics.filter.device(values)
  }

  const handleGpuChange = (values: string[]) => {
    setSelectedGpus(values)
    analytics.filter.device(values)
  }

  const handleEmulatorChange = (values: string[]) => {
    setSelectedEmulators(values)
    if (values.length === 0) return analytics.filter.clearEmulatorFilter()
    analytics.filter.emulator(values)
  }

  const handlePerformanceChange = (values: string[]) => {
    const numericValues = values.map(Number)
    setSelectedPerformance(numericValues)
    analytics.filter.performance(numericValues)
  }

  const handleSearchChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(ev.target.value)
    analytics.filter.search(ev.target.value)
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedSystems([])
    setSelectedCpus([])
    setSelectedGpus([])
    setSelectedEmulators([])
    setSelectedPerformance([])
    setSelectedOs([])
    setMemoryMin('')
    setMemoryMax('')
    analytics.filter.clearAll()
  }

  const hasActiveFilters =
    searchTerm ||
    selectedSystems.length ||
    selectedCpus.length ||
    selectedGpus.length ||
    selectedEmulators.length ||
    selectedPerformance.length ||
    selectedOs.length ||
    memoryMin ||
    memoryMax

  const filterCounts = {
    search: searchTerm ? 1 : 0,
    systems: selectedSystems.length,
    cpus: selectedCpus.length,
    gpus: selectedGpus.length,
    emulators: selectedEmulators.length,
    performance: selectedPerformance.length,
    os: selectedOs.length,
    memory: memoryMin || memoryMax ? 1 : 0,
  }

  const totalActiveFilters = Object.values(filterCounts).reduce(
    (sum, count) => sum + count,
    0,
  )

  return (
    <motion.div className="relative" initial={false} style={{ zIndex: 10 }}>
      <motion.button
        onClick={onToggleCollapse}
        className="absolute -right-4 top-2 z-30 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 rounded-full p-2 shadow-xl md:flex hidden group"
        aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
        whileHover={{
          scale: 1.1,
          boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ overflow: 'visible' }}
      >
        <AnimatePresence mode="wait">
          {isCollapsed ? (
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
          width: isCollapsed
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
          borderRadius: isCollapsed ? 20 : 24,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ zIndex: 10, overflow: 'visible' }}
      >
        <div
          className={`${isCollapsed ? 'p-4' : 'p-6'} transition-all duration-400 overflow-visible`}
        >
          <AnimatePresence mode="wait">
            {isCollapsed ? (
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

                    {filterCounts.systems > 0 && (
                      <motion.div
                        key="systems-filter"
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
                            delay: 0.15,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.systems}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.cpus > 0 && (
                      <motion.div
                        key="cpus-filter"
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
                          {filterCounts.cpus}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.gpus > 0 && (
                      <motion.div
                        key="gpus-filter"
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
                          className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.25,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.gpus}
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
                          delay: 0.25,
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
                            delay: 0.3,
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
                          delay: 0.3,
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
                            delay: 0.35,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.performance}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.os > 0 && (
                      <motion.div
                        key="os-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.35,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MonitorSpeaker className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.4,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.os}
                        </motion.div>
                      </motion.div>
                    )}

                    {filterCounts.memory > 0 && (
                      <motion.div
                        key="memory-filter"
                        initial={{ x: -20, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.4,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="relative group"
                        style={{ overflow: 'visible' }}
                      >
                        <motion.div
                          className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-xl shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MemoryStick className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </motion.div>
                        <motion.div
                          className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg z-30"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.45,
                            type: 'spring',
                            stiffness: 400,
                          }}
                        >
                          {filterCounts.memory}
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
                    PC Filters
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
                        placeholder="Search games, hardware, emulators..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>

                  {/* Systems */}
                  {systemsQuery.data && (
                    <MultiSelect
                      label="Systems"
                      leftIcon={<Joystick className="w-5 h-5" />}
                      value={selectedSystems}
                      onChange={handleSystemChange}
                      options={systemsQuery.data.map((system) => ({
                        id: system.id,
                        name: system.name,
                      }))}
                      placeholder="All systems"
                      maxDisplayed={1}
                    />
                  )}

                  {/* CPUs */}
                  {cpusQuery.data && (
                    <MultiSelect
                      label="CPUs"
                      leftIcon={<Cpu className="w-5 h-5" />}
                      value={selectedCpus}
                      onChange={handleCpuChange}
                      options={cpusQuery.data.cpus.map((cpu) => ({
                        id: cpu.id,
                        name: `${cpu.brand.name} ${cpu.modelName}`,
                        badgeName: cpu.modelName,
                      }))}
                      placeholder="All CPUs"
                      maxDisplayed={1}
                    />
                  )}

                  {/* GPUs */}
                  {gpusQuery.data && (
                    <MultiSelect
                      label="GPUs"
                      leftIcon={<HardDrive className="w-5 h-5" />}
                      value={selectedGpus}
                      onChange={handleGpuChange}
                      options={gpusQuery.data.gpus.map((gpu) => ({
                        id: gpu.id,
                        name: `${gpu.brand.name} ${gpu.modelName}`,
                        badgeName: gpu.modelName,
                      }))}
                      placeholder="All GPUs"
                      maxDisplayed={1}
                    />
                  )}

                  {/* Emulators */}
                  {emulatorsQuery.data?.emulators && (
                    <MultiSelect
                      label="Emulators"
                      leftIcon={<Gamepad className="w-5 h-5" />}
                      value={selectedEmulators}
                      onChange={handleEmulatorChange}
                      options={emulatorsQuery.data.emulators.map(
                        (emulator) => ({
                          id: emulator.id,
                          name: emulator.name,
                        }),
                      )}
                      placeholder="All emulators"
                      maxDisplayed={1}
                    />
                  )}

                  {/* Performance */}
                  {performanceScalesQuery.data && (
                    <MultiSelect
                      label="Performance"
                      leftIcon={<Rocket className="w-5 h-5" />}
                      value={selectedPerformance.map(String)}
                      onChange={handlePerformanceChange}
                      options={performanceScalesQuery.data.map(
                        ({ id, label }) => ({
                          id: id.toString(),
                          name: label,
                        }),
                      )}
                      placeholder="All performance levels"
                      maxDisplayed={1}
                    />
                  )}

                  {/* Operating System */}
                  <MultiSelect
                    label="Operating System"
                    leftIcon={<MonitorSpeaker className="w-5 h-5" />}
                    value={selectedOs}
                    onChange={(values: string[]) =>
                      setSelectedOs(values as PcOs[])
                    }
                    options={[
                      { id: PcOs.WINDOWS, name: 'Windows' },
                      { id: PcOs.LINUX, name: 'Linux' },
                      { id: PcOs.MACOS, name: 'macOS' },
                    ]}
                    placeholder="All operating systems"
                    maxDisplayed={1}
                  />

                  {/* Memory Range */}
                  <div className="space-y-3">
                    <label className="block font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MemoryStick className="w-5 h-5" />
                      Memory (GB)
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Min GB"
                          value={memoryMin}
                          onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            setMemoryMin(ev.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Max GB"
                          value={memoryMax}
                          onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            setMemoryMax(ev.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
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
                        {searchTerm && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            Search: &ldquo;{searchTerm}&rdquo;
                          </motion.div>
                        )}
                        {selectedSystems.length > 0 && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            Systems: {selectedSystems.length} selected
                          </motion.div>
                        )}
                        {selectedCpus.length > 0 && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            CPUs: {selectedCpus.length} selected
                          </motion.div>
                        )}
                        {selectedGpus.length > 0 && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            GPUs: {selectedGpus.length} selected
                          </motion.div>
                        )}
                        {selectedEmulators.length > 0 && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Emulators: {selectedEmulators.length} selected
                          </motion.div>
                        )}
                        {selectedPerformance.length > 0 && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Performance: {selectedPerformance.length} selected
                          </motion.div>
                        )}
                        {selectedOs.length > 0 && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            OS: {selectedOs.length} selected
                          </motion.div>
                        )}
                        {(memoryMin || memoryMax) && (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.45 }}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            Memory: {memoryMin && `≥${memoryMin}GB`}{' '}
                            {memoryMin && memoryMax && ' & '}{' '}
                            {memoryMax && `≤${memoryMax}GB`}
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
