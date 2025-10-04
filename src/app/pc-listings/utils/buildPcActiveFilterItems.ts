interface ActiveFilterItem {
  key: string
  content: string
  colorClass: string
  delay: number
}

interface PcFilterState {
  searchTerm: string
  systemIds: string[]
  cpuIds: string[]
  gpuIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
  minMemory: number | null
  maxMemory: number | null
}

/**
 * Builds an array of active filter items for PC listings based on the provided filter state.
 */
export function buildPcActiveFilterItems(filters: PcFilterState): ActiveFilterItem[] {
  const items: ActiveFilterItem[] = []

  if (filters.searchTerm) {
    items.push({
      key: 'search',
      content: `Search: "${filters.searchTerm}"`,
      colorClass: 'bg-yellow-500',
      delay: 0.1,
    })
  }

  if (filters.systemIds.length > 0) {
    items.push({
      key: 'systems',
      content: `Systems: ${filters.systemIds.length} selected`,
      colorClass: 'bg-blue-500',
      delay: 0.15,
    })
  }

  if (filters.cpuIds.length > 0) {
    items.push({
      key: 'cpus',
      content: `CPUs: ${filters.cpuIds.length} selected`,
      colorClass: 'bg-green-500',
      delay: 0.2,
    })
  }

  if (filters.gpuIds.length > 0) {
    items.push({
      key: 'gpus',
      content: `GPUs: ${filters.gpuIds.length} selected`,
      colorClass: 'bg-purple-500',
      delay: 0.25,
    })
  }

  if (filters.emulatorIds.length > 0) {
    items.push({
      key: 'emulators',
      content: `Emulators: ${filters.emulatorIds.length} selected`,
      colorClass: 'bg-orange-500',
      delay: 0.3,
    })
  }

  if (filters.performanceIds.length > 0) {
    items.push({
      key: 'performance',
      content: `Performance: ${filters.performanceIds.length} selected`,
      colorClass: 'bg-red-500',
      delay: 0.35,
    })
  }

  if (filters.minMemory !== null || filters.maxMemory !== null) {
    const memoryText =
      filters.minMemory !== null && filters.maxMemory !== null
        ? `${filters.minMemory}GB - ${filters.maxMemory}GB`
        : filters.minMemory !== null
          ? `Min: ${filters.minMemory}GB`
          : `Max: ${filters.maxMemory}GB`

    items.push({
      key: 'memory',
      content: `Memory: ${memoryText}`,
      colorClass: 'bg-pink-500',
      delay: 0.4,
    })
  }

  return items
}
