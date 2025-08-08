/**
 * Cache utility functions
 */

/**
 * Creates a consistent cache key from multiple parameters
 * Handles various data types and creates a deterministic string
 * @param namespace - The namespace for the cache key
 * @param params - The parameters to include in the key
 */
export function createCacheKey(namespace: string, ...params: unknown[]): string {
  const parts = [namespace]

  for (const param of params) {
    if (param === null || param === undefined) {
      parts.push('null')
    } else if (typeof param === 'object') {
      parts.push(JSON.stringify(param, Object.keys(param as Record<string, unknown>).sort()))
    } else {
      parts.push(String(param))
    }
  }

  return parts.join(':')
}
