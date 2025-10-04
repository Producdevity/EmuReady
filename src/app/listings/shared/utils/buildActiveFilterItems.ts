interface ActiveFilterItem {
  key: string
  content: string
  colorClass: string
  delay: number
}

interface FilterState {
  searchTerm: string
  systemIds: string[]
  deviceIds: string[]
  socIds: string[]
  emulatorIds: string[]
  performanceIds: number[]
}

/**
 * Builds an array of active filter items based on the provided filter state.
 * @param filters
 */
export function buildActiveFilterItems(filters: FilterState): ActiveFilterItem[] {
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

  if (filters.deviceIds.length > 0) {
    items.push({
      key: 'devices',
      content: `Devices: ${filters.deviceIds.length} selected`,
      colorClass: 'bg-green-500',
      delay: 0.2,
    })
  }

  if (filters.socIds.length > 0) {
    items.push({
      key: 'socs',
      content: `SoCs: ${filters.socIds.length} selected`,
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

  return items
}
