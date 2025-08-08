/**
 * Recursively filter out undefined and null values from an object
 * @param obj
 */
export function filterUndefinedValues(
  obj: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const filtered: Record<string, string | number | boolean> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(filtered, filterUndefinedValues(value as Record<string, unknown>))
      } else {
        filtered[key] = value as string | number | boolean
      }
    }
  })
  return filtered
}
