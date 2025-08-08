import { LRUCache } from 'lru-cache'
import { ms } from '@/utils/time'

/**
 * caching solution for SEO data
 * Uses in-memory LRU cache with Redis support when available
 * TODO: implement Redis support for distributed caching
 */

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: number // Serve stale content while revalidating
}

interface CachedItem<T> {
  data: T
  timestamp: number
  ttl: number
  staleWhileRevalidate: number
}

// In-memory LRU cache configuration
const DEFAULT_TTL = ms.hours(1)
const DEFAULT_STALE_WHILE_REVALIDATE = ms.days(1)
const MAX_CACHE_SIZE = 500 // Maximum number of items
const MAX_CACHE_AGE = ms.days(1)

// Initialize LRU cache
export const cache = new LRUCache<string, CachedItem<unknown>>({
  max: MAX_CACHE_SIZE,
  ttl: MAX_CACHE_AGE,
  // Update age on get to keep hot items in cache
  updateAgeOnGet: true,
  // Track performance metrics
  fetchMethod: async (key: string) => {
    console.log(`[SEO Cache] Cache miss for key: ${key}`)
    return undefined
  },
})

// Performance metrics
let cacheHits = 0
let cacheMisses = 0
let cacheStaleHits = 0
let deduplicatedRequests = 0

// Request deduplication - tracks in-flight requests
const inFlightRequests = new Map<string, Promise<unknown>>()

export function getCacheMetrics() {
  const hitRate = cacheHits / (cacheHits + cacheMisses) || 0
  return {
    hits: cacheHits,
    misses: cacheMisses,
    staleHits: cacheStaleHits,
    deduplicatedRequests,
    hitRate: `${(hitRate * 100).toFixed(2)}%`,
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    inFlightRequests: inFlightRequests.size,
  }
}

/**
 * Get item from cache with stale-while-revalidate support
 */
export async function getFromCache<T>(
  key: string,
  fetchFn: () => Promise<T | null>,
  options: CacheOptions = {},
): Promise<T | null> {
  const ttl = options.ttl ?? DEFAULT_TTL
  const staleWhileRevalidate =
    options.staleWhileRevalidate ?? DEFAULT_STALE_WHILE_REVALIDATE

  try {
    const cached = cache.get(key)
    const now = Date.now()

    if (cached) {
      const age = now - cached.timestamp
      const isStale = age > cached.ttl
      const isExpired = age > cached.ttl + cached.staleWhileRevalidate

      if (!isExpired) {
        if (isStale) {
          // Serve stale content and revalidate in background
          cacheStaleHits++
          console.log(`[SEO Cache] Serving stale content for: ${key}`)

          // Revalidate in background without blocking
          revalidateInBackground(key, fetchFn, ttl, staleWhileRevalidate)
        } else {
          // Fresh cache hit
          cacheHits++
        }
        return cached.data as T
      }
    }

    // Check if there's already an in-flight request for this key
    const existingRequest = inFlightRequests.get(key)
    if (existingRequest) {
      console.log(`[SEO Cache] Deduplicating request for key: ${key}`)
      deduplicatedRequests++
      return existingRequest as Promise<T | null>
    }

    // Cache miss or expired - create new request
    cacheMisses++

    // Create promise and store it for deduplication
    const requestPromise = (async () => {
      try {
        const data = await fetchFn()

        if (data !== null) {
          setCacheItem(key, data, ttl, staleWhileRevalidate)
        }

        return data
      } finally {
        // Remove from in-flight map when done
        inFlightRequests.delete(key)
      }
    })()

    // Store the promise for deduplication
    inFlightRequests.set(key, requestPromise)

    return requestPromise
  } catch (error) {
    console.error(`[SEO Cache] Error for key ${key}:`, error)
    // On error, try to return stale data if available
    const cached = cache.get(key)
    return (cached?.data as T) ?? null
  }
}

/**
 * Set item in cache
 */
function setCacheItem<T>(
  key: string,
  data: T,
  ttl: number,
  staleWhileRevalidate: number,
): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    staleWhileRevalidate,
  })
}

/**
 * Revalidate cache in background
 */
async function revalidateInBackground<T>(
  key: string,
  fetchFn: () => Promise<T | null>,
  ttl: number,
  staleWhileRevalidate: number,
): Promise<void> {
  // Check if there's already an in-flight request for this key
  if (inFlightRequests.has(key)) {
    console.log(
      `[SEO Cache] Skipping background revalidation, request already in-flight for: ${key}`,
    )
    return
  }

  // Use setImmediate to ensure this doesn't block
  setImmediate(async () => {
    // Double-check in case another request started
    if (inFlightRequests.has(key)) {
      return
    }

    const requestPromise = (async () => {
      try {
        console.log(`[SEO Cache] Revalidating in background: ${key}`)
        const data = await fetchFn()
        if (data !== null) {
          setCacheItem(key, data, ttl, staleWhileRevalidate)
        }
      } catch (error) {
        console.error(
          `[SEO Cache] Background revalidation failed for ${key}:`,
          error,
        )
      } finally {
        inFlightRequests.delete(key)
      }
    })()

    // Store the promise for deduplication
    inFlightRequests.set(key, requestPromise)
  })
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string | RegExp): number {
  let invalidated = 0

  for (const key of cache.keys()) {
    if (
      typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)
    ) {
      cache.delete(key)
      invalidated++
    }
  }

  console.log(`[SEO Cache] Invalidated ${invalidated} entries matching pattern`)
  return invalidated
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear()
  console.log('[SEO Cache] Cache cleared')
}

/**
 * Warm cache with popular content
 */
export async function warmCache<T>(
  items: Array<{ key: string; fetchFn: () => Promise<T | null> }>,
  options: CacheOptions = {},
): Promise<void> {
  console.log(`[SEO Cache] Warming cache with ${items.length} items`)

  // Process in batches to avoid overloading
  const batchSize = 10
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await Promise.all(
      batch.map(({ key, fetchFn }) => getFromCache(key, fetchFn, options)),
    )
  }
}
