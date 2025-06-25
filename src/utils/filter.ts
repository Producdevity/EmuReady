import { pickBy, isNullish } from 'remeda'

/**
 * Filters out undefined, null values and empty arrays from an object.
 * This is useful for cleaning up API request parameters to avoid
 * sending unnecessary data in URLs.
 *
 * @param obj - The object to filter
 * @returns A new object with undefined/null/empty values removed
 */
export function filterNullAndEmpty<T extends Record<string, unknown>>(obj: T) {
  return pickBy(obj, (value) => {
    if (isNullish(value)) return false

    if (Array.isArray(value)) return value.length > 0

    if (typeof value === 'string') return value.trim().length > 0

    return true
  })
}
