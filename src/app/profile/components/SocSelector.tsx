'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, Cpu, ChevronDown } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'

interface Soc {
  id: string
  name: string
  manufacturer: string
}

interface Props {
  selectedSocs: Soc[]
  onSocsChange: (socs: Soc[]) => void
}

function SocSelector(props: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedManufacturers, setExpandedManufacturers] = useState<
    Set<string>
  >(new Set())
  // Fetch all SoCs from the backend
  const socsQuery = api.socs.get.useQuery({ limit: 1000 })

  const filteredSocs = useMemo(() => {
    const allSocs: Soc[] =
      socsQuery.data?.socs?.map((soc) => ({
        id: soc.id,
        name: soc.name,
        manufacturer: soc.manufacturer,
      })) ?? []

    if (!searchTerm) return allSocs
    return allSocs.filter(
      (soc) =>
        soc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        soc.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, socsQuery.data?.socs])

  const socsByManufacturer = useMemo(() => {
    const grouped = filteredSocs.reduce<Record<string, Soc[]>>((acc, soc) => {
      if (!acc[soc.manufacturer]) {
        acc[soc.manufacturer] = []
      }
      acc[soc.manufacturer].push(soc)
      return acc
    }, {})

    // Sort manufacturers alphabetically and SOCs within each manufacturer
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce<Record<string, Soc[]>>((acc, [manufacturer, socs]) => {
        acc[manufacturer] = socs.sort((a, b) => a.name.localeCompare(b.name))
        return acc
      }, {})
  }, [filteredSocs])

  if (socsQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Cpu className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (socsQuery.error || !socsQuery.data?.socs) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          Failed to load SOCs: {getErrorMessage(socsQuery.error)}
        </p>
      </div>
    )
  }

  const selectedSocIds = new Set(props.selectedSocs.map((soc) => soc.id))

  const toggleSoc = (soc: Soc) => {
    if (selectedSocIds.has(soc.id)) {
      const newSelection = props.selectedSocs.filter(
        (selected) => selected.id !== soc.id,
      )
      props.onSocsChange(newSelection)
    } else {
      const newSelection = [...props.selectedSocs, soc]
      props.onSocsChange(newSelection)
    }
  }

  const toggleManufacturer = (manufacturer: string) => {
    const newExpanded = new Set(expandedManufacturers)
    if (newExpanded.has(manufacturer)) {
      newExpanded.delete(manufacturer)
    } else {
      newExpanded.add(manufacturer)
    }
    setExpandedManufacturers(newExpanded)
  }

  const selectAllFromManufacturer = (manufacturer: string) => {
    const manufacturerSocs = socsByManufacturer[manufacturer] || []
    const allSelected = manufacturerSocs.every((soc) =>
      selectedSocIds.has(soc.id),
    )

    if (allSelected) {
      // Deselect all from this manufacturer
      const remaining = props.selectedSocs.filter(
        (selected) => !manufacturerSocs.some((soc) => soc.id === selected.id),
      )
      props.onSocsChange(remaining)
    } else {
      // Select all from this manufacturer
      const toAdd = manufacturerSocs.filter(
        (soc) => !selectedSocIds.has(soc.id),
      )
      props.onSocsChange([...props.selectedSocs, ...toAdd])
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Input
          leftIcon={<Search className="w-4 h-4" />}
          type="text"
          placeholder="Search SOCs by name or manufacturer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Selected SOCs Summary */}
      {props.selectedSocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected SOCs ({props.selectedSocs.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {props.selectedSocs.map((soc) => (
              <motion.button
                key={soc.id}
                onClick={() => toggleSoc(soc)}
                className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {soc.manufacturer} {soc.name}
                <span className="text-blue-600 dark:text-blue-400">×</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* SOC List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(socsByManufacturer).map(([manufacturer, socs]) => {
          const isExpanded = expandedManufacturers.has(manufacturer)
          const allSelected = socs.every((soc) => selectedSocIds.has(soc.id))
          const someSelected = socs.some((soc) => selectedSocIds.has(soc.id))

          return (
            <motion.div
              key={manufacturer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              {/* Manufacturer Header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleManufacturer(manufacturer)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </motion.div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {manufacturer}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({socs.length} SOC{socs.length !== 1 ? 's' : ''})
                    </span>
                  </button>
                  <button
                    onClick={() => selectAllFromManufacturer(manufacturer)}
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

              {/* SOC List */}
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
                      {socs.map((soc) => {
                        const isSelected = selectedSocIds.has(soc.id)

                        return (
                          <motion.button
                            key={soc.id}
                            onClick={() => toggleSoc(soc)}
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
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {soc.name}
                                </span>
                              </div>
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
        })}
      </div>

      {filteredSocs.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No SOCs found matching your search.</p>
        </div>
      )}
    </div>
  )
}

export default SocSelector
