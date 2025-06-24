'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { AsyncMultiSelect, Button } from '@/components/ui'

// Extended PerformanceScale type with description
interface PerformanceScale {
  id: number
  label: string
  rank: number
  description: string | null
}

interface Props {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  hasActiveFilters: boolean
  clearAllFilters: () => void
  // System filters
  systemIds: string[]
  handleSystemChange: (values: string[]) => void
  fetchSystems: (search: string) => Promise<{ id: string; name: string }[]>
  // Performance filters
  performanceIds: string[]
  handlePerformanceChange: (values: string[]) => void
  performanceScales: PerformanceScale[] | undefined
  // Device filters
  deviceIds: string[]
  handleDeviceChange: (values: string[]) => void
  fetchDevices: (search: string) => Promise<{ id: string; name: string }[]>
  // Emulator filters
  emulatorIds: string[]
  handleEmulatorChange: (values: string[]) => void
  fetchEmulators: (search: string) => Promise<{ id: string; name: string }[]>
  // SoC filters
  socIds: string[]
  handleSocChange: (values: string[]) => void
  fetchSocs: (search: string) => Promise<{ id: string; name: string }[]>
}

export function ListingFilters(props: Props) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  return (
    <AnimatePresence>
      {props.showFilters && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 lg:relative lg:mb-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-xl lg:rounded-xl p-4 shadow-lg border max-h-[80vh] overflow-y-auto">
            {/* Handle for bottom sheet */}
            <div className="lg:hidden flex justify-center mb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-1"
                >
                  Advanced
                  {showAdvancedFilters ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Systems - Always visible with AsyncMultiSelect */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Systems</label>
              <AsyncMultiSelect
                label="Systems"
                value={props.systemIds}
                onChange={props.handleSystemChange}
                placeholder="Select systems..."
                loadOptions={async (search) => {
                  const result = await props.fetchSystems(search)
                  return result
                }}
                emptyMessage="No systems found"
              />
            </div>

            {/* Performance - Always visible */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Performance
              </label>
              <AsyncMultiSelect
                label="Performance"
                value={props.performanceIds}
                onChange={props.handlePerformanceChange}
                placeholder="Select performance levels..."
                loadOptions={async (search) => {
                  const scales = props.performanceScales || []
                  const filtered = search
                    ? scales.filter(
                        (s) =>
                          s.label
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          (s.description &&
                            s.description
                              .toLowerCase()
                              .includes(search.toLowerCase())),
                      )
                    : scales

                  return filtered.map((scale) => ({
                    id: scale.id.toString(),
                    name: `${scale.label} ${
                      scale.description ? `- ${scale.description}` : ''
                    }`,
                  }))
                }}
                emptyMessage="No performance levels found"
              />
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Devices - With AsyncMultiSelect */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Devices
                    </label>
                    <AsyncMultiSelect
                      label="Devices"
                      value={props.deviceIds}
                      onChange={props.handleDeviceChange}
                      placeholder="Select devices..."
                      loadOptions={async (search) => {
                        const result = await props.fetchDevices(search)
                        return result
                      }}
                      maxSelected={3}
                      emptyMessage="No devices found"
                    />
                  </div>

                  {/* Emulators - With AsyncMultiSelect */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Emulators
                    </label>
                    <AsyncMultiSelect
                      label="Emulators"
                      value={props.emulatorIds}
                      onChange={props.handleEmulatorChange}
                      placeholder="Select emulators..."
                      loadOptions={async (search) => {
                        const result = await props.fetchEmulators(search)
                        return result
                      }}
                      emptyMessage="No emulators found"
                    />
                  </div>

                  {/* SoCs - With AsyncMultiSelect */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      System on Chips (SoCs)
                    </label>
                    <AsyncMultiSelect
                      label="SoCs"
                      value={props.socIds}
                      onChange={props.handleSocChange}
                      placeholder="Select SoCs..."
                      loadOptions={async (search) => {
                        const result = await props.fetchSocs(search)
                        return result
                      }}
                      maxSelected={3}
                      emptyMessage="No SoCs found"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between pt-4 border-t mt-4">
              <Button
                variant="outline"
                onClick={() => props.setShowFilters(false)}
              >
                Apply Filters
              </Button>
              {props.hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={props.clearAllFilters}
                  className="text-red-600"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/60 -z-10 lg:hidden"
            onClick={() => props.setShowFilters(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
