'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Cpu, HardDrive, Rocket, MonitorSpeaker, Gamepad2, Search, CircleX } from 'lucide-react'
import {
  ActiveFiltersSummary,
  CollapsedBadges,
  FilterSidebarShell,
} from '@/app/listings/shared/components'
import {
  getSystemNames,
  getCpuNames,
  getGpuNames,
  getEmulatorNames,
  getPerformanceLabels,
} from '@/app/listings/shared/utils/selectedLabels'
import { buildPcActiveFilterItems } from '@/app/pc-listings/utils/buildPcActiveFilterItems'
import { filterAnalytics } from '@/lib/analytics/filterAnalytics'
import PcFiltersContent from './PcFiltersContent'
import type { System, PerformanceScale, Emulator } from '@orm'

type CpuWithBrand = { id: string; modelName: string; brand: { name: string } }
type GpuWithBrand = { id: string; modelName: string; brand: { name: string } }

interface Props {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onClearAll?: () => void
  cpuIds: string[]
  gpuIds: string[]
  systemIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
  minMemory: number | null
  maxMemory: number | null
  searchTerm: string
  cpus: CpuWithBrand[]
  gpus: GpuWithBrand[]
  systems: System[]
  emulators: Emulator[]
  performanceScales: PerformanceScale[]
  onCpuChange: (values: string[]) => void
  onGpuChange: (values: string[]) => void
  onSystemChange: (values: string[]) => void
  onEmulatorChange: (values: string[]) => void
  onPerformanceChange: (values: number[]) => void
  onMinMemoryChange: (value: number | null) => void
  onMaxMemoryChange: (value: number | null) => void
  onSearchChange: (value: string) => void
}

export default function PcFiltersSidebar(props: Props) {
  const filterCounts = {
    systems: props.systemIds.length,
    cpus: props.cpuIds.length,
    gpus: props.gpuIds.length,
    emulators: props.emulatorIds.length,
    performance: props.performanceIds.length,
    memory: props.minMemory || props.maxMemory ? 1 : 0,
    search: props.searchTerm ? 1 : 0,
  }
  const totalActiveFilters = Object.values(filterCounts).reduce((sum, count) => sum + count, 0)

  const hasActiveFilters =
    props.searchTerm ||
    props.systemIds.length > 0 ||
    props.cpuIds.length > 0 ||
    props.gpuIds.length > 0 ||
    props.emulatorIds.length > 0 ||
    props.performanceIds.length > 0 ||
    props.minMemory !== null ||
    props.maxMemory !== null

  const handleClearAll = () => {
    props.onClearAll?.()
    filterAnalytics.clearAll()
  }

  const collapsedSummary = (
    <div className="flex flex-col items-center gap-4 w-full" style={{ overflow: 'visible' }}>
      <CollapsedBadges
        items={[
          {
            key: 'systems',
            count: filterCounts.systems,
            icon: <MonitorSpeaker className="w-4 h-4" />,
            cardBgClass: 'bg-purple-100 dark:bg-purple-900/30',
            iconColorClass: 'text-purple-600 dark:text-purple-400',
            badgeBgClass: 'bg-purple-500',
            delay: 0.05,
          },
          {
            key: 'cpus',
            count: filterCounts.cpus,
            icon: <Cpu className="w-4 h-4" />,
            cardBgClass: 'bg-green-100 dark:bg-green-900/30',
            iconColorClass: 'text-green-600 dark:text-green-400',
            badgeBgClass: 'bg-green-500',
            delay: 0.1,
          },
          {
            key: 'gpus',
            count: filterCounts.gpus,
            icon: <HardDrive className="w-4 h-4" />,
            cardBgClass: 'bg-blue-100 dark:bg-blue-900/30',
            iconColorClass: 'text-blue-600 dark:text-blue-400',
            badgeBgClass: 'bg-blue-500',
            delay: 0.15,
          },
          {
            key: 'emulators',
            count: filterCounts.emulators,
            icon: <Gamepad2 className="w-4 h-4" />,
            cardBgClass: 'bg-orange-100 dark:bg-orange-900/30',
            iconColorClass: 'text-orange-600 dark:text-orange-400',
            badgeBgClass: 'bg-orange-500',
            delay: 0.2,
          },
          {
            key: 'performance',
            count: filterCounts.performance,
            icon: <Rocket className="w-4 h-4" />,
            cardBgClass: 'bg-rose-100 dark:bg-rose-900/30',
            iconColorClass: 'text-rose-600 dark:text-rose-400',
            badgeBgClass: 'bg-rose-500',
            delay: 0.25,
          },
          {
            key: 'search',
            count: filterCounts.search,
            icon: <Search className="w-4 h-4" />,
            cardBgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconColorClass: 'text-yellow-600 dark:text-yellow-400',
            badgeBgClass: 'bg-yellow-500',
            delay: 0.3,
          },
        ]}
      />
      {totalActiveFilters > 0 && (
        <motion.button
          key="pc-clear-all-button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={props.onClearAll}
          className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          title="Clear all filters"
        >
          <CircleX className="w-4 h-4 text-red-600 dark:text-red-400" />
        </motion.button>
      )}
    </div>
  )

  return (
    <FilterSidebarShell
      isCollapsed={props.isCollapsed ?? false}
      onToggleCollapse={props.onToggleCollapse ?? (() => {})}
      title="PC Filters"
      totalActiveCount={totalActiveFilters}
      collapsedSummary={collapsedSummary}
      showToggle={true}
    >
      <PcFiltersContent
        {...props}
        onSystemChange={(values) => {
          props.onSystemChange(values)
          const names = getSystemNames(props.systems, values)
          filterAnalytics.systems(values, names)
        }}
        onCpuChange={(values) => {
          props.onCpuChange(values)
          const names = getCpuNames(props.cpus, values)
          filterAnalytics.devices(values, names)
        }}
        onGpuChange={(values) => {
          props.onGpuChange(values)
          const names = getGpuNames(props.gpus, values)
          filterAnalytics.devices(values, names)
        }}
        onEmulatorChange={(values) => {
          props.onEmulatorChange(values)
          const names = getEmulatorNames(props.emulators, values)
          filterAnalytics.emulators(values, names)
        }}
        onPerformanceChange={(values) => {
          const numeric = values.map(Number)
          props.onPerformanceChange(numeric)
          const labels = getPerformanceLabels(props.performanceScales, numeric)
          filterAnalytics.performance(numeric, labels)
        }}
      />
      {props.onClearAll && (
        <AnimatePresence>
          {hasActiveFilters && (
            <ActiveFiltersSummary
              showClearAll
              onClearAll={handleClearAll}
              items={buildPcActiveFilterItems({
                searchTerm: props.searchTerm,
                systemIds: props.systemIds,
                cpuIds: props.cpuIds,
                gpuIds: props.gpuIds,
                emulatorIds: props.emulatorIds,
                performanceIds: props.performanceIds,
                minMemory: props.minMemory,
                maxMemory: props.maxMemory,
              })}
            />
          )}
        </AnimatePresence>
      )}
    </FilterSidebarShell>
  )
}
