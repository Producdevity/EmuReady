'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  X,
  Filter,
  RotateCcw,
  Smartphone,
  Cpu,
  Gamepad,
  Zap,
  Search,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { MultiSelect, Button, Input, Badge } from '@/components/ui'
import analytics from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface PerformanceScale {
  id: number
  label: string
  rank: number
  description: string | null
}

interface FilterSection {
  id: string
  title: string
  icon: React.ReactNode
  isAdvanced?: boolean
}

interface Props {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  hasActiveFilters: boolean
  clearAllFilters: () => void
  // System filters
  systemIds: string[]
  handleSystemChange: (values: string[]) => void
  systemOptions: { id: string; name: string }[] | undefined
  // Performance filters
  performanceIds: string[]
  handlePerformanceChange: (values: string[]) => void
  performanceScales: PerformanceScale[] | undefined
  // Device filters
  deviceIds: string[]
  handleDeviceChange: (values: string[]) => void
  deviceOptions: { id: string; name: string }[] | undefined
  // Emulator filters
  emulatorIds: string[]
  handleEmulatorChange: (values: string[]) => void
  emulatorOptions: { id: string; name: string }[] | undefined
  // SoC filters
  socIds: string[]
  handleSocChange: (values: string[]) => void
  socOptions: { id: string; name: string }[] | undefined
}

const filterSections: FilterSection[] = [
  { id: 'systems', title: 'Systems', icon: <Gamepad className="w-4 h-4" /> },
  {
    id: 'performance',
    title: 'Performance',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: 'devices',
    title: 'Devices',
    icon: <Smartphone className="w-4 h-4" />,
    isAdvanced: true,
  },
  {
    id: 'emulators',
    title: 'Emulators',
    icon: <Cpu className="w-4 h-4" />,
    isAdvanced: true,
  },
  {
    id: 'socs',
    title: 'System on Chips',
    icon: <Cpu className="w-4 h-4" />,
    isAdvanced: true,
  },
]

export function ListingFilters(props: Props) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['systems', 'performance']),
  )
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate active filter count
  const activeFilterCount = [
    props.systemIds.length,
    props.deviceIds.length,
    props.emulatorIds.length,
    props.socIds.length,
    props.performanceIds.length,
    searchTerm ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleClearAll = () => {
    props.clearAllFilters()
    setSearchTerm('')
    analytics.filter.clearAll()

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const handleApplyFilters = () => {
    props.setShowFilters(false)

    // Track analytics - use existing methods
    if (props.systemIds.length > 0) analytics.filter.system(props.systemIds)
    if (props.deviceIds.length > 0) analytics.filter.device(props.deviceIds)
    if (props.emulatorIds.length > 0) analytics.filter.emulator(props.emulatorIds)
    if (props.socIds.length > 0) analytics.filter.soc(props.socIds)
    if (props.performanceIds.length > 0)
      analytics.filter.performance(props.performanceIds.map(Number))

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
  }

  if (!isClient) return null

  return (
    <AnimatePresence>
      {props.showFilters && (
        <>
          {/* Mobile Bottom Sheet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => props.setShowFilters(false)}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed inset-x-0 bottom-0 z-50 lg:relative lg:mb-6 lg:inset-auto"
          >
            <div className="bg-white dark:bg-gray-900 lg:bg-white/95 lg:dark:bg-gray-900/95 backdrop-blur-xl rounded-t-3xl lg:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] lg:max-h-none overflow-hidden">
              {/* Mobile Handle */}
              <div className="lg:hidden flex justify-center pt-3 pb-1">
                <motion.div
                  className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"
                  whileTap={{ scale: 0.95 }}
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-800/50">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filter Listings
                  </h3>
                  {activeFilterCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {activeFilterCount}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Advanced
                    <motion.div
                      animate={{ rotate: showAdvancedFilters ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </motion.div>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => props.setShowFilters(false)}
                    className="lg:hidden p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-b border-gray-200 dark:border-gray-700"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search listings by game name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Filter Content */}
              <div className="overflow-y-auto max-h-[50vh] lg:max-h-none p-6 space-y-6">
                {filterSections.map((section) => {
                  const isVisible = !section.isAdvanced || showAdvancedFilters
                  const isExpanded = expandedSections.has(section.id)

                  if (!isVisible) return null

                  return (
                    <motion.div
                      key={section.id}
                      initial={section.isAdvanced ? { opacity: 0, height: 0 } : undefined}
                      animate={section.isAdvanced ? { opacity: 1, height: 'auto' } : undefined}
                      exit={section.isAdvanced ? { opacity: 0, height: 0 } : undefined}
                      className="space-y-3"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center justify-between w-full text-left group"
                      >
                        <div className="flex items-center gap-2">
                          {section.icon}
                          <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {section.title}
                          </span>
                          {section.id === 'systems' && props.systemIds.length > 0 && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">
                              {props.systemIds.length}
                            </Badge>
                          )}
                          {section.id === 'performance' && props.performanceIds.length > 0 && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">
                              {props.performanceIds.length}
                            </Badge>
                          )}
                          {section.id === 'devices' && props.deviceIds.length > 0 && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">
                              {props.deviceIds.length}
                            </Badge>
                          )}
                          {section.id === 'emulators' && props.emulatorIds.length > 0 && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">
                              {props.emulatorIds.length}
                            </Badge>
                          )}
                          {section.id === 'socs' && props.socIds.length > 0 && (
                            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">
                              {props.socIds.length}
                            </Badge>
                          )}
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {section.id === 'systems' && props.systemOptions && (
                              <MultiSelect
                                label="Systems"
                                value={props.systemIds}
                                onChange={props.handleSystemChange}
                                placeholder="Select game systems..."
                                options={props.systemOptions}
                                maxDisplayed={3}
                                className="mobile-optimized"
                              />
                            )}

                            {section.id === 'performance' && (
                              <MultiSelect
                                label="Performance"
                                value={props.performanceIds}
                                onChange={props.handlePerformanceChange}
                                placeholder="Select performance levels..."
                                options={(props.performanceScales || []).map((scale) => ({
                                  id: scale.id.toString(),
                                  name: `${scale.label}${scale.description ? ` - ${scale.description}` : ''}`,
                                }))}
                                maxDisplayed={3}
                                className="mobile-optimized"
                              />
                            )}

                            {section.id === 'devices' && props.deviceOptions && (
                              <MultiSelect
                                label="Devices"
                                value={props.deviceIds}
                                onChange={props.handleDeviceChange}
                                placeholder="Select devices..."
                                options={props.deviceOptions}
                                maxDisplayed={3}
                                className="mobile-optimized"
                              />
                            )}

                            {section.id === 'emulators' && props.emulatorOptions && (
                              <MultiSelect
                                label="Emulators"
                                value={props.emulatorIds}
                                onChange={props.handleEmulatorChange}
                                placeholder="Select emulators..."
                                options={props.emulatorOptions}
                                maxDisplayed={3}
                                className="mobile-optimized"
                              />
                            )}

                            {section.id === 'socs' && props.socOptions && (
                              <MultiSelect
                                label="SoCs"
                                value={props.socIds}
                                onChange={props.handleSocChange}
                                placeholder="Select system on chips..."
                                options={props.socOptions}
                                maxDisplayed={3}
                                className="mobile-optimized"
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={!props.hasActiveFilters}
                  className={cn(
                    'flex items-center gap-2 transition-all duration-200',
                    props.hasActiveFilters
                      ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All
                </Button>

                <Button
                  onClick={handleApplyFilters}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Apply Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
