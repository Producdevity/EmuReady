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
    const parsed = JSON.parse(decoded)
    // Return parsed array as-is to support mixed types
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    try {
      // Fallback to parsing without decoding
      const parsed = JSON.parse(param)
      // Return parsed array as-is to support mixed types
      return Array.isArray(parsed) ? parsed : [parsed]
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
      // Convert to numbers and filter out NaN/falsy values
      return parsed.map((v) => Number(v)).filter((n) => !isNaN(n) && n !== 0)
    } else {
      const num = Number(parsed)
      return !isNaN(num) && num !== 0 ? [num] : []
    }
  } catch {
    try {
      // Fallback to parsing without decoding
      const parsed = JSON.parse(param)
      if (Array.isArray(parsed)) {
        // Convert to numbers and filter out NaN/falsy values
        return parsed.map((v) => Number(v)).filter((n) => !isNaN(n) && n !== 0)
      } else {
        const num = Number(parsed)
        return !isNaN(num) && num !== 0 ? [num] : []
      }
    } catch {
      // If both fail, treat as single number value
      const num = Number(param)
      return !isNaN(num) && num !== 0 ? [num] : []
    }
  }
}

export { parseArrayParam, parseNumberArrayParam }
