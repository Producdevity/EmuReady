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
    return JSON.parse(decoded)
  } catch {
    try {
      // Fallback to parsing without decoding
      return JSON.parse(param)
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
      return parsed.map(Number).filter(Boolean)
    } else if (typeof parsed === 'number') {
      return [parsed].filter(Boolean)
    } else {
      return []
    }
  } catch {
    try {
      // Fallback to parsing without decoding
      const parsed = JSON.parse(param)
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter(Boolean)
      } else if (typeof parsed === 'number') {
        return [parsed].filter(Boolean)
      } else {
        return []
      }
    } catch {
      // If both fail, treat as single number value
      return param ? [Number(param)].filter(Boolean) : []
    }
  }
}

export { parseArrayParam, parseNumberArrayParam }
