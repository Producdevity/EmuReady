import { z } from 'zod'
import { validateClientData } from '@/utils/client-validation'

// Validation schemas for URL parameters
const StringArraySchema = z.array(z.string())
const NumberArraySchema = z.array(z.number())
const SingleNumberSchema = z.number()

/**
 * Parses a URL parameter that can be either a JSON array or a single string value
 * @param param - The URL parameter value (string or null)
 * @returns Array of strings
 */
function parseArrayParam(param: string | null): string[] {
  if (!param) return []
  try {
    // Try to decode URL-encoded JSON first
    const decoded = decodeURIComponent(param)
    return validateClientData(JSON.parse(decoded), StringArraySchema, [])
  } catch {
    try {
      // Fallback to parsing without decoding
      return validateClientData(JSON.parse(param), StringArraySchema, [])
    } catch {
      // If both fail, treat as single string value
      return param ? [param] : []
    }
  }
}

/**
 * Parses a URL parameter that can be either a JSON array of numbers or a single number value
 * @param param - The URL parameter value (string or null)
 * @returns Array of numbers (filtered to remove falsy values like 0, NaN, null, undefined)
 */
function parseNumberArrayParam(param: string | null): number[] {
  if (!param) return []
  try {
    // Try to decode URL-encoded JSON first
    const decoded = decodeURIComponent(param)
    const parsed = JSON.parse(decoded)
    if (Array.isArray(parsed)) {
      const validated = validateClientData(
        parsed.map(Number),
        NumberArraySchema,
        [],
      )
      return validated.filter(Boolean)
    } else {
      const validated = validateClientData(
        Number(parsed),
        SingleNumberSchema,
        0,
      )
      return [validated].filter(Boolean)
    }
  } catch {
    try {
      // Fallback to parsing without decoding
      const parsed = JSON.parse(param)
      if (Array.isArray(parsed)) {
        const validated = validateClientData(
          parsed.map(Number),
          NumberArraySchema,
          [],
        )
        return validated.filter(Boolean)
      } else {
        const validated = validateClientData(
          Number(parsed),
          SingleNumberSchema,
          0,
        )
        return [validated].filter(Boolean)
      }
    } catch {
      // If both fail, treat as single number value
      try {
        const validated = validateClientData(
          Number(param),
          SingleNumberSchema,
          0,
        )
        return [validated].filter(Boolean)
      } catch {
        return []
      }
    }
  }
}

export { parseArrayParam, parseNumberArrayParam }
