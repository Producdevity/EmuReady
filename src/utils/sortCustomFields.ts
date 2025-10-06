/**
 * Grouped fields by category with metadata
 */
export interface GroupedCustomFields<T> {
  categoryId: string
  categoryName: string
  displayOrder: number
  fields: T[]
}

/**
 * Minimal interface for custom field values that can be sorted
 */
interface SortableCustomField {
  id: string
  customFieldDefinition: {
    categoryId?: string | null
    categoryOrder?: number
    displayOrder?: number
    category?: {
      name?: string
      displayOrder?: number
    } | null
  }
}

/**
 * Sort custom fields by category displayOrder and field categoryOrder
 *
 * This ensures consistent ordering across all pages:
 * 1. Categories are sorted by their displayOrder (as set in admin drag-and-drop)
 * 2. Within each category, fields are sorted by categoryOrder (their position in the category)
 * 3. Uncategorized fields appear last
 *
 * @param fields Array of custom field values with their definitions
 * @returns Array of grouped and sorted fields by category
 */
export function sortCustomFieldsByCategory<T extends SortableCustomField>(
  fields: T[],
): GroupedCustomFields<T>[] {
  // Group fields by category
  const fieldsByCategory = fields.reduce(
    (acc, field) => {
      const categoryId = field.customFieldDefinition.categoryId || 'uncategorized'
      const categoryName = field.customFieldDefinition.category?.name || 'Uncategorized'
      const displayOrder = field.customFieldDefinition.category?.displayOrder ?? 999999

      if (!acc[categoryId]) {
        acc[categoryId] = { categoryName, displayOrder, fields: [] }
      }
      acc[categoryId].fields.push(field)
      return acc
    },
    {} as Record<string, { categoryName: string; displayOrder: number; fields: T[] }>,
  )

  // Sort fields within each category by categoryOrder
  Object.values(fieldsByCategory).forEach((group) => {
    group.fields.sort(
      (a, b) =>
        (a.customFieldDefinition.categoryOrder ?? 0) -
          (b.customFieldDefinition.categoryOrder ?? 0) ||
        (a.customFieldDefinition.displayOrder ?? 0) - (b.customFieldDefinition.displayOrder ?? 0),
    )
  })

  // Convert to array and sort: by displayOrder, uncategorized last
  return Object.entries(fieldsByCategory)
    .map(([categoryId, data]) => ({ categoryId, ...data }))
    .sort((a, b) => {
      if (a.categoryId === 'uncategorized') return 1
      if (b.categoryId === 'uncategorized') return -1
      return a.displayOrder - b.displayOrder
    })
}
