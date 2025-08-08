'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
import { Smartphone, Search, Loader2, ChevronDown, Check } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'

interface Device {
  id: string
  modelName: string
  brand: {
    id: string
    name: string
  }
  soc?: {
    id: string
    name: string
    manufacturer: string
  } | null
}

interface Props {
  selectedDevices: Device[]
  onDevicesChange: (devices: Device[]) => void
  className?: string
}

// Create search data for fuzzy matching
interface SearchableDevice extends Device {
  fullName: string // "Retroid Pocket 5"
  brandModel: string // "retroid pocket 5"
  abbreviation: string // "rp5"
  searchableText: string // combined searchable text
}

// TODO: this just needs to be fuzzy searching server side
function createSearchableDevice(device: Device): SearchableDevice {
  const fullName = `${device.brand.name} ${device.modelName}`
  const brandModel = fullName.toLowerCase()

  // Create abbreviation (first letter of brand + model words)
  const brandWords = device.brand.name.toLowerCase().split(' ')
  const modelWords = device.modelName.toLowerCase().split(' ')
  const abbreviation = (brandWords[0]?.[0] || '') + modelWords.map((word) => word[0]).join('')

  const searchableText = [
    device.brand.name,
    device.modelName,
    fullName,
    abbreviation,
    device.soc?.name || '',
    device.soc?.manufacturer || '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    ...device,
    fullName,
    brandModel,
    abbreviation,
    searchableText,
  }
}

function DeviceSelector(props: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())

  // Get all devices (with high limit to get all)
  // TODO: this needs to handled server-side for performance
  const devicesQuery = api.devices.get.useQuery({ limit: 1000 })

  // Prepare searchable devices
  const searchableDevices = useMemo(() => {
    if (!devicesQuery.data?.devices) return []
    return devicesQuery.data.devices.map(createSearchableDevice)
  }, [devicesQuery.data?.devices])

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (searchableDevices.length === 0) return null

    return new Fuse(searchableDevices, {
      keys: [
        { name: 'brand.name', weight: 0.3 },
        { name: 'modelName', weight: 0.3 },
        { name: 'fullName', weight: 0.2 },
        { name: 'abbreviation', weight: 0.15 },
        { name: 'searchableText', weight: 0.05 },
      ],
      threshold: 0.4, // More lenient matching
      distance: 100,
      includeScore: true,
      minMatchCharLength: 1,
    })
  }, [searchableDevices])

  // Filter devices based on search
  const filteredDevices = useMemo(() => {
    if (!searchableDevices.length) return []

    return searchQuery.trim() && fuse
      ? fuse.search(searchQuery.trim()).map((result) => result.item)
      : searchableDevices
  }, [searchableDevices, searchQuery, fuse])

  // Group devices by brand for better organization
  const devicesByBrand = useMemo(() => {
    const groups: Record<string, Device[]> = {}

    filteredDevices.forEach((device) => {
      const brandName = device.brand.name
      if (!groups[brandName]) {
        groups[brandName] = []
      }
      groups[brandName].push(device)
    })

    // Sort brands alphabetically and devices within each brand
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce<Record<string, Device[]>>((acc, [brandName, devices]) => {
        acc[brandName] = devices.sort((a, b) => a.modelName.localeCompare(b.modelName))
        return acc
      }, {})
  }, [filteredDevices])

  function isDeviceSelected(device: Device) {
    return props.selectedDevices.some((selected) => selected.id === device.id)
  }

  function handleDeviceToggle(device: Device) {
    // Normalize the device data to match the expected structure
    const normalizedDevice = {
      id: device.id,
      modelName: device.modelName,
      brand: {
        id: device.brand.id,
        name: device.brand.name,
      },
      soc: device.soc
        ? {
            id: device.soc.id,
            name: device.soc.name,
            manufacturer: device.soc.manufacturer,
          }
        : null,
    }

    if (isDeviceSelected(device)) {
      const newSelection = props.selectedDevices.filter((selected) => selected.id !== device.id)
      props.onDevicesChange(newSelection)
    } else {
      const newSelection = [...props.selectedDevices, normalizedDevice]
      props.onDevicesChange(newSelection)
    }
  }

  function handleRemoveDevice(device: Device) {
    props.onDevicesChange(props.selectedDevices.filter((selected) => selected.id !== device.id))
  }

  function handleClearAll() {
    props.onDevicesChange([])
  }

  function toggleBrand(brandName: string) {
    const newExpanded = new Set(expandedBrands)
    if (newExpanded.has(brandName)) {
      newExpanded.delete(brandName)
    } else {
      newExpanded.add(brandName)
    }
    setExpandedBrands(newExpanded)
  }

  function selectAllFromBrand(brandName: string) {
    const brandDevices = devicesByBrand[brandName] || []
    const allSelected = brandDevices.every((device) => isDeviceSelected(device))

    if (allSelected) {
      // Deselect all from this brand
      const remaining = props.selectedDevices.filter(
        (selected) => !brandDevices.some((device) => device.id === selected.id),
      )
      props.onDevicesChange(remaining)
    } else {
      // Select all from this brand - normalize the device data
      const toAdd = brandDevices
        .filter((device) => !isDeviceSelected(device))
        .map((device) => ({
          id: device.id,
          modelName: device.modelName,
          brand: {
            id: device.brand.id,
            name: device.brand.name,
          },
          soc: device.soc
            ? {
                id: device.soc.id,
                name: device.soc.name,
                manufacturer: device.soc.manufacturer,
              }
            : null,
        }))
      props.onDevicesChange([...props.selectedDevices, ...toAdd])
    }
  }

  if (devicesQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (devicesQuery.error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          Failed to load devices: {getErrorMessage(devicesQuery.error)}
        </p>
      </div>
    )
  }

  const selectedDeviceIds = new Set(props.selectedDevices.map((device) => device.id))

  return (
    <div className={cn('space-y-6', props.className)}>
      {/* Search */}
      <div className="relative">
        <Input
          leftIcon={<Search className="w-4 h-4" />}
          type="text"
          placeholder="Search devices... (e.g., 'rp5' for Retroid Pocket 5)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Selected Devices Summary */}
      {props.selectedDevices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Selected Devices ({props.selectedDevices.length})
              </span>
            </div>
            <button
              onClick={handleClearAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
            >
              Clear All
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {props.selectedDevices.map((device) => (
                <motion.button
                  key={device.id}
                  onClick={() => handleRemoveDevice(device)}
                  className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {device.brand.name} {device.modelName}
                  <span className="text-blue-600 dark:text-blue-400">×</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Device List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.keys(devicesByBrand).length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No devices found matching your criteria
            </p>
          </div>
        ) : (
          Object.entries(devicesByBrand).map(([brandName, devices]) => {
            const isExpanded = expandedBrands.has(brandName)
            const allSelected = devices.every((device) => selectedDeviceIds.has(device.id))
            const someSelected = devices.some((device) => selectedDeviceIds.has(device.id))

            return (
              <motion.div
                key={brandName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                {/* Brand Header */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleBrand(brandName)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </motion.div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {brandName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({devices.length} device
                        {devices.length !== 1 ? 's' : ''})
                      </span>
                    </button>
                    <button
                      onClick={() => selectAllFromBrand(brandName)}
                      className={cn(
                        'text-xs px-3 py-1 rounded-lg transition-colors',
                        allSelected
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : someSelected
                            ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
                      )}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Device List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        {devices.map((device) => {
                          const isSelected = selectedDeviceIds.has(device.id)

                          return (
                            <motion.button
                              key={device.id}
                              onClick={() => handleDeviceToggle(device)}
                              className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300 dark:border-gray-600',
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>

                              <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {device.modelName}
                                  </span>
                                </div>

                                {device.soc && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {device.soc.manufacturer} {device.soc.name}
                                  </p>
                                )}
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default DeviceSelector
