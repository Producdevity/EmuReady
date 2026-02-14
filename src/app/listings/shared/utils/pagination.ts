import { PAGE_SIZE_OPTIONS, type PageSizeOption, PAGINATION } from '@/data/constants'

/**
 * Parse and validate limit from URL or localStorage
 * Returns closest valid PAGE_SIZE_OPTION or default
 */
export function parseLimit(value: string | null, maxLimit: number): PageSizeOption {
  if (!value) return PAGINATION.PUBLIC_DEFAULT_LIMIT as PageSizeOption
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 1) return PAGINATION.PUBLIC_DEFAULT_LIMIT as PageSizeOption

  // Find closest valid option that doesn't exceed maxLimit
  const validOptions = PAGE_SIZE_OPTIONS.filter((opt) => opt <= maxLimit)
  if (validOptions.includes(parsed as PageSizeOption)) {
    return parsed as PageSizeOption
  }

  // Find closest valid option
  return validOptions.reduce((prev, curr) =>
    Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev,
  )
}
