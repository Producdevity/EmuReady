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
  Settings2,
  CircleX,
  User,
} from 'lucide-react'
import Link from 'next/link'
import {
  ActiveFiltersSummary,
  CollapsedBadges,
  FilterSidebarShell,
} from '@/app/listings/shared/components'
import {
  getSystemNames,
  getDeviceNames,
  getSocNames,
  getEmulatorNames,
  getPerformanceLabels,
} from '@/app/listings/shared/utils/selectedLabels'
import { Button } from '@/components/ui'
import analytics from '@/lib/analytics'
import { filterAnalytics } from '@/lib/analytics/filterAnalytics'
import ListingsFiltersContent from './ListingsFiltersContent'
import type { AppRouter } from '@/types/trpc'

type RouterOutput = inferRouterOutputs<AppRouter>
type UserPreferences = RouterOutput['userPreferences']['get']

interface FiltersProps {
  systemIds: string[]
  deviceIds: string[]
  socIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
  searchTerm: string
  systems: { id: string; name: string }[]
  devices: {
    id: string
    brandId: string
    modelName: string
    brand: { id: string; name: string; createdAt: Date }
  }[]
  socs: { id: string; name: string; manufacturer: string }[]
  emulators: { id: string; name: string }[]
  performanceScales: { id: number; label: string }[]
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

function ListingsFiltersSidebar(props: FiltersProps) {
  const handleSystemChange = (values: string[]) => {
    props.onSystemChange(values)
    const names = getSystemNames(props.systems, values)
    filterAnalytics.systems(values, names)
  }

  const handleDeviceChange = (values: string[]) => {
    props.onDeviceChange(values)
    const names = getDeviceNames(props.devices, values)
    filterAnalytics.devices(values, names)
  }

  const handleSocChange = (values: string[]) => {
    props.onSocChange(values)
    const names = getSocNames(props.socs, values)
    filterAnalytics.socs(values, names)
  }

  const handleEmulatorChange = (values: string[]) => {
    props.onEmulatorChange(values)
    const names = getEmulatorNames(props.emulators, values)
    filterAnalytics.emulators(values, names)
  }

  const handlePerformanceChange = (values: string[]) => {
    const numericValues = values.map(Number)
    props.onPerformanceChange(numericValues)
    const labels = getPerformanceLabels(props.performanceScales, numericValues)
    filterAnalytics.performance(numericValues, labels)
  }

  const handleSearchChange = (value: string) => {
    props.onSearchChange(value)
    analytics.filter.search(value)
  }

  const clearAllFilters = () => {
    props.onSystemChange([])
    props.onDeviceChange([])
    props.onSocChange([])
    props.onEmulatorChange([])
    props.onPerformanceChange([])
    props.onSearchChange('')
    filterAnalytics.clearAll()
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

  const totalActiveFilters = Object.values(filterCounts).reduce((sum, count) => sum + count, 0)

  const collapsedSummary = (
    <>
      <CollapsedBadges
        items={[
          {
            key: 'systems',
            count: filterCounts.systems,
            icon: <Joystick className="w-4 h-4" />,
            cardBgClass: 'bg-purple-100 dark:bg-purple-900/30',
            iconColorClass: 'text-purple-600 dark:text-purple-400',
            badgeBgClass: 'bg-purple-500',
            delay: 0.05,
          },
          {
            key: 'devices',
            count: filterCounts.devices,
            icon: <MonitorSmartphone className="w-4 h-4" />,
            cardBgClass: 'bg-green-100 dark:bg-green-900/30',
            iconColorClass: 'text-green-600 dark:text-green-400',
            badgeBgClass: 'bg-green-500',
            delay: 0.1,
          },
          {
            key: 'socs',
            count: filterCounts.socs,
            icon: <Cpu className="w-4 h-4" />,
            cardBgClass: 'bg-blue-100 dark:bg-blue-900/30',
            iconColorClass: 'text-blue-600 dark:text-blue-400',
            badgeBgClass: 'bg-blue-500',
            delay: 0.15,
          },
          {
            key: 'emulators',
            count: filterCounts.emulators,
            icon: <Gamepad className="w-4 h-4" />,
            cardBgClass: 'bg-orange-100 dark:bg-orange-900/30',
            iconColorClass: 'text-orange-600 dark:text-orange-400',
            badgeBgClass: 'bg-orange-500',
            delay: 0.2,
          },
          {
            key: 'performance',
            count: filterCounts.performance,
            icon: <Rocket className="w-4 h-4" />,
            cardBgClass: 'bg-red-100 dark:bg-red-900/30',
            iconColorClass: 'text-red-600 dark:text-red-400',
            badgeBgClass: 'bg-red-500',
            delay: 0.25,
          },
          {
            key: 'search',
            count: filterCounts.search,
            icon: <Search className="w-4 h-4" />,
            cardBgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconColorClass: 'text-yellow-600 dark:text-yellow-400',
            badgeBgClass: 'bg-yellow-500',
            delay: 0.05,
          },
        ]}
      />

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
    </>
  )

  const expandedContent = (
    <>
      <motion.div
        className="space-y-6"
        {...{ initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } }}
        transition={{ delay: 0.3 }}
        style={{ position: 'relative', zIndex: 20 }}
      >
        <ListingsFiltersContent
          systemIds={props.systemIds}
          deviceIds={props.deviceIds}
          socIds={props.socIds}
          emulatorIds={props.emulatorIds}
          performanceIds={props.performanceIds}
          searchTerm={props.searchTerm}
          systems={props.systems}
          devices={props.devices}
          socs={props.socs}
          emulators={props.emulators}
          performanceScales={props.performanceScales}
          onSystemChange={handleSystemChange}
          onDeviceChange={handleDeviceChange}
          onSocChange={handleSocChange}
          onEmulatorChange={handleEmulatorChange}
          onPerformanceChange={handlePerformanceChange}
          onSearchChange={handleSearchChange}
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
              Showing results for {props.userDeviceIds.length} of your preferred devices
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
              Showing results for {props.userSocIds.length} of your preferred SoCs
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
                {props.userSocFilterDisabled ? 'Filter by my SoCs' : 'Use my SoC preferences'}
              </Button>
            </motion.div>
          )}

        {/* Fields rendered above in ListingsFiltersContent */}
      </motion.div>

      <AnimatePresence>
        {hasActiveFilters && (
          <ActiveFiltersSummary
            showClearAll
            onClearAll={clearAllFilters}
            items={[
              ...(props.searchTerm
                ? [
                    {
                      key: 'search',
                      content: `Search: “${props.searchTerm}”`,
                      colorClass: 'bg-yellow-500',
                      delay: 0.1,
                    },
                  ]
                : []),
              ...(props.systemIds.length > 0
                ? [
                    {
                      key: 'systems',
                      content: `Systems: ${props.systemIds.length} selected`,
                      colorClass: 'bg-blue-500',
                      delay: 0.15,
                    },
                  ]
                : []),
              ...(props.deviceIds.length > 0
                ? [
                    {
                      key: 'devices',
                      content: `Devices: ${props.deviceIds.length} selected`,
                      colorClass: 'bg-green-500',
                      delay: 0.2,
                    },
                  ]
                : []),
              ...(props.socIds.length > 0
                ? [
                    {
                      key: 'socs',
                      content: `SoCs: ${props.socIds.length} selected`,
                      colorClass: 'bg-purple-500',
                      delay: 0.25,
                    },
                  ]
                : []),
              ...(props.emulatorIds.length > 0
                ? [
                    {
                      key: 'emulators',
                      content: `Emulators: ${props.emulatorIds.length} selected`,
                      colorClass: 'bg-orange-500',
                      delay: 0.3,
                    },
                  ]
                : []),
              ...(props.performanceIds.length > 0
                ? [
                    {
                      key: 'performance',
                      content: `Performance: ${props.performanceIds.length} selected`,
                      colorClass: 'bg-red-500',
                      delay: 0.35,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </AnimatePresence>
    </>
  )

  return (
    <FilterSidebarShell
      isCollapsed={props.isCollapsed}
      onToggleCollapse={props.onToggleCollapse}
      title="Filters"
      totalActiveCount={totalActiveFilters}
      collapsedSummary={collapsedSummary}
    >
      {expandedContent}
    </FilterSidebarShell>
  )
}

export default ListingsFiltersSidebar
