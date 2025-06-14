'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
import { Smartphone, Search, X, Loader2 } from 'lucide-react'
import { useState, useMemo } from 'react'
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

function createSearchableDevice(device: Device): SearchableDevice {
  const fullName = `${device.brand.name} ${device.modelName}`
  const brandModel = fullName.toLowerCase()

  // Create abbreviation (first letter of brand + model words)
  const brandWords = device.brand.name.toLowerCase().split(' ')
  const modelWords = device.modelName.toLowerCase().split(' ')
  const abbreviation =
    (brandWords[0]?.[0] || '') + modelWords.map((word) => word[0]).join('')

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
  const [selectedBrand, setSelectedBrand] = useState<string>('')

  // Get all devices (with high limit to get all)
  const devicesQuery = api.devices.get.useQuery({ limit: 1000 })
  const brandsQuery = api.deviceBrands.get.useQuery({ limit: 1000 })

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

  // Filter devices based on search and brand
  const filteredDevices = useMemo(() => {
    if (!searchableDevices.length) return []

    // Create a pipeline of transformations
    const applyFuzzySearch = (devices: SearchableDevice[]) =>
      searchQuery.trim() && fuse
        ? fuse.search(searchQuery.trim()).map((result) => result.item)
        : devices

    const applyBrandFilter = (devices: SearchableDevice[]) =>
      selectedBrand
        ? devices.filter((device) => device.brand.id === selectedBrand)
        : devices

    // Apply transformations in sequence without mutation
    return [searchableDevices].map(applyFuzzySearch).map(applyBrandFilter)[0]
  }, [searchableDevices, searchQuery, selectedBrand, fuse])

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

    return groups
  }, [filteredDevices])

  function isDeviceSelected(device: Device) {
    return props.selectedDevices.some((selected) => selected.id === device.id)
  }

  function handleDeviceToggle(device: Device) {
    if (isDeviceSelected(device)) {
      props.onDevicesChange(
        props.selectedDevices.filter((selected) => selected.id !== device.id),
      )
    } else {
      props.onDevicesChange([...props.selectedDevices, device])
    }
  }

  function handleRemoveDevice(device: Device) {
    props.onDevicesChange(
      props.selectedDevices.filter((selected) => selected.id !== device.id),
    )
  }

  function handleClearAll() {
    props.onDevicesChange([])
  }

  if (devicesQuery.isLoading || brandsQuery.isLoading) {
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

  return (
    <div className={cn('space-y-6', props.className)}>
      {/* Selected Devices */}
      {props.selectedDevices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected Devices ({props.selectedDevices.length})
            </h4>
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
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>
                    {device.brand.name} {device.modelName}
                  </span>
                  <button
                    onClick={() => handleRemoveDevice(device)}
                    className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full transition-colors duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices... (e.g., 'rp5' for Retroid Pocket 5)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Brands</option>
          {brandsQuery.data?.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

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
          Object.entries(devicesByBrand).map(([brandName, devices]) => (
            <motion.div
              key={brandName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                {brandName}
              </h4>

              <div className="space-y-1">
                {devices.map((device) => {
                  const isSelected = isDeviceSelected(device)

                  return (
                    <motion.button
                      key={device.id}
                      onClick={() => handleDeviceToggle(device)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200',
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-500',
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                        )}
                      </div>

                      <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {device.modelName}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {device.brand.name}
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
          ))
        )}
      </div>
    </div>
  )
}

export default DeviceSelector
