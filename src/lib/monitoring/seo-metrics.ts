import { cache } from '@/lib/cache/seo-cache'

/**
 * SEO Performance Monitoring
 * Integrates with existing monitoring infrastructure
 */

interface PerformanceMetrics {
  cacheLookupTime: number
  databaseQueryTime: number
  totalTime: number
  cacheHit: boolean
  staleServed: boolean
}

// Type guard for cached items
interface CachedItem<T> {
  data: T
  timestamp: number
  ttl: number
  staleWhileRevalidate: number
}

function isCachedItem(value: unknown): value is CachedItem<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'data' in value &&
    'timestamp' in value &&
    'ttl' in value &&
    'staleWhileRevalidate' in value &&
    typeof (value as Record<string, unknown>).timestamp === 'number' &&
    typeof (value as Record<string, unknown>).ttl === 'number'
  )
}

class SEOMetricsCollector {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 1000 // Keep last 1000 operations

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow queries
    if (metric.totalTime > 100) {
      console.warn('[SEO Performance] Slow operation detected:', {
        totalTime: `${metric.totalTime}ms`,
        cacheHit: metric.cacheHit,
        dbTime: `${metric.databaseQueryTime}ms`,
      })
    }
  }

  getAggregatedMetrics() {
    if (this.metrics.length === 0) {
      return {
        avgCacheLookupTime: 0,
        avgDatabaseQueryTime: 0,
        avgTotalTime: 0,
        cacheHitRate: 0,
        staleServeRate: 0,
        sampleSize: 0,
      }
    }

    const cacheHits = this.metrics.filter((m) => m.cacheHit).length
    const staleServed = this.metrics.filter((m) => m.staleServed).length

    const sumMetrics = this.metrics.reduce(
      (acc, m) => ({
        cacheLookup: acc.cacheLookup + m.cacheLookupTime,
        dbQuery: acc.dbQuery + m.databaseQueryTime,
        total: acc.total + m.totalTime,
      }),
      { cacheLookup: 0, dbQuery: 0, total: 0 },
    )

    return {
      avgCacheLookupTime: Math.round(
        sumMetrics.cacheLookup / this.metrics.length,
      ),
      avgDatabaseQueryTime: Math.round(
        sumMetrics.dbQuery / this.metrics.length,
      ),
      avgTotalTime: Math.round(sumMetrics.total / this.metrics.length),
      cacheHitRate: (cacheHits / this.metrics.length) * 100,
      staleServeRate: (staleServed / this.metrics.length) * 100,
      sampleSize: this.metrics.length,
    }
  }

  reset() {
    this.metrics = []
  }
}

export const seoMetrics = new SEOMetricsCollector()

/**
 * Performance monitoring wrapper
 */
export async function withMetrics<T>(
  operation: string,
  fn: () => Promise<T>,
  options: { cacheKey?: string } = {},
): Promise<T> {
  const startTime = performance.now()
  let cacheHit = false
  let staleServed = false
  let dbQueryTime = 0

  try {
    // Check if this is a cache operation
    if (options.cacheKey) {
      const cachedValue = cache.get(options.cacheKey)
      if (isCachedItem(cachedValue)) {
        cacheHit = true
        const age = Date.now() - cachedValue.timestamp
        staleServed = age > cachedValue.ttl
      }
    }

    const dbStart = performance.now()
    const result = await fn()
    dbQueryTime = performance.now() - dbStart

    return result
  } finally {
    const totalTime = performance.now() - startTime

    seoMetrics.recordMetric({
      cacheLookupTime: cacheHit ? totalTime - dbQueryTime : 0,
      databaseQueryTime: cacheHit ? 0 : dbQueryTime,
      totalTime,
      cacheHit,
      staleServed,
    })
  }
}

/**
 * Export metrics for external monitoring systems
 */
export function exportMetrics() {
  const cacheMetrics = cache.dump().map(([key, value]) => {
    // Safely access the cached item properties
    let age = 0
    if (isCachedItem(value.value)) {
      age = Date.now() - value.value.timestamp
    }

    return {
      key,
      size: JSON.stringify(value).length,
      age,
    }
  })

  return {
    cache: {
      entries: cacheMetrics,
      totalSize: cacheMetrics.reduce((sum, m) => sum + m.size, 0),
      oldestEntry: Math.max(...cacheMetrics.map((m) => m.age)),
    },
    performance: seoMetrics.getAggregatedMetrics(),
    timestamp: new Date().toISOString(),
  }
}
