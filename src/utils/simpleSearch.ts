/**
 * Simple search utility that matches all search terms
 */
export function searchItems<T>(
  items: T[],
  searchQuery: string,
  getSearchableText: (item: T) => string,
): T[] {
  if (!searchQuery.trim()) return items

  const searchWords = searchQuery.trim().toLowerCase().split(/\s+/)

  return items.filter((item) => {
    const text = getSearchableText(item).toLowerCase()
    return searchWords.every((word) => text.includes(word))
  })
}

/**
 * Creates searchable text for a device
 */
export function getDeviceSearchText(device: {
  modelName: string
  brand: { name: string }
  soc?: { name?: string; manufacturer?: string } | null
}): string {
  return [device.brand.name, device.modelName, device.soc?.name, device.soc?.manufacturer]
    .filter(Boolean)
    .join(' ')
}
