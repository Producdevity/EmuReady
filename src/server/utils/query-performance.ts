import { logger } from '@/lib/logger'

/**
 * Performance monitoring for database queries
 */
export class QueryPerformanceMonitor {
  private static queries: Map<string, QueryMetrics> = new Map()
  private static enabled = process.env.NODE_ENV === 'development'

  static startQuery(name: string): () => void {
    if (!this.enabled) return () => {}

    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      this.recordQuery(name, duration)
    }
  }

  static recordQuery(name: string, duration: number): void {
    const existing = this.queries.get(name) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      avgTime: 0,
    }

    existing.count++
    existing.totalTime += duration
    existing.minTime = Math.min(existing.minTime, duration)
    existing.maxTime = Math.max(existing.maxTime, duration)
    existing.avgTime = existing.totalTime / existing.count

    this.queries.set(name, existing)

    // Log slow queries
    if (duration > 1000) {
      logger.warn(`Slow query detected: ${name} took ${duration.toFixed(2)}ms`)
    }
  }

  static getMetrics(): Record<string, QueryMetrics> {
    return Object.fromEntries(this.queries)
  }

  static reset(): void {
    this.queries.clear()
  }
}

interface QueryMetrics {
  count: number
  totalTime: number
  minTime: number
  maxTime: number
  avgTime: number
}

/**
 * Optimize select fields to reduce data transfer
 */
export function optimizeSelect<T>(
  requiredFields: (keyof T)[],
  conditionalFields?: Partial<Record<keyof T, boolean>>,
): Record<string, boolean> {
  const select: Record<string, boolean> = {}

  // Always include required fields
  requiredFields.forEach((field) => {
    select[String(field)] = true
  })

  // Add conditional fields
  if (conditionalFields) {
    Object.entries(conditionalFields).forEach(([field, include]) => {
      if (include) {
        select[field] = true
      }
    })
  }

  return select
}

/**
 * Create efficient count queries that skip unnecessary joins
 */
export function createCountQuery<T>(
  model: { count: (args: { where: T }) => Promise<number>; _name?: string },
  where: T,
): Promise<number> {
  const end = QueryPerformanceMonitor.startQuery(`count:${model._name || 'unknown'}`)

  const query = model.count({ where })

  return query.finally(end)
}

/**
 * Batch multiple queries for better performance
 */
export async function batchQueries<T extends readonly unknown[]>(
  queries: [...{ [K in keyof T]: Promise<T[K]> }],
): Promise<T> {
  const end = QueryPerformanceMonitor.startQuery('batch:queries')

  try {
    return Promise.all(queries) as Promise<T>
  } finally {
    end()
  }
}

/**
 * Create indexes suggestion based on query patterns
 */
export function suggestIndexes(
  model: string,
  whereConditions: Record<string, unknown>,
  orderBy?: Record<string, unknown>,
): string[] {
  const suggestions: string[] = []
  const fields = Object.keys(whereConditions)

  // Single field indexes for equality checks
  fields.forEach((field) => {
    const condition = whereConditions[field]
    if (typeof condition !== 'object' || condition === null || (condition && 'in' in condition)) {
      suggestions.push(`CREATE INDEX idx_${model}_${field} ON ${model}(${field});`)
    }
  })

  // Composite indexes for multiple conditions
  if (fields.length > 1) {
    suggestions.push(
      `CREATE INDEX idx_${model}_${fields.join('_')} ON ${model}(${fields.join(', ')});`,
    )
  }

  // Index for sorting
  if (orderBy) {
    const sortFields = Object.keys(orderBy)
    sortFields.forEach((field) => {
      if (!fields.includes(field)) {
        suggestions.push(`CREATE INDEX idx_${model}_${field} ON ${model}(${field});`)
      }
    })
  }

  return [...new Set(suggestions)]
}

/**
 * Optimize includes to prevent N+1 queries
 */
export function optimizeIncludes(
  baseInclude: Record<string, unknown>,
  maxDepth = 3,
  currentDepth = 0,
): Record<string, unknown> {
  if (currentDepth >= maxDepth) {
    // Convert deep includes to select with minimal fields
    const optimized: Record<string, unknown> = {}

    Object.entries(baseInclude).forEach(([key, value]) => {
      if (value === true) {
        optimized[key] = { select: { id: true, name: true } }
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'include' in value &&
        value.include
      ) {
        optimized[key] = {
          select: {
            id: true,
            ...Object.keys(value.include as Record<string, unknown>).reduce(
              (acc, k) => {
                acc[k] = { select: { id: true } }
                return acc
              },
              {} as Record<string, unknown>,
            ),
          },
        }
      } else {
        optimized[key] = value
      }
    })

    return optimized
  }

  // Recursively optimize nested includes
  const optimized: Record<string, unknown> = {}

  Object.entries(baseInclude).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && 'include' in value && value.include) {
      optimized[key] = {
        ...value,
        include: optimizeIncludes(
          value.include as Record<string, unknown>,
          maxDepth,
          currentDepth + 1,
        ),
      }
    } else {
      optimized[key] = value
    }
  })

  return optimized
}

/**
 * Create a query cache key based on parameters
 */
export function createQueryCacheKey(
  model: string,
  operation: string,
  params: Record<string, unknown>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key]
        return acc
      },
      {} as Record<string, unknown>,
    )

  return `${model}:${operation}:${JSON.stringify(sortedParams)}`
}

/**
 * Analyze query complexity and warn about potential issues
 */
export function analyzeQueryComplexity(
  include?: Record<string, unknown>,
  where?: Record<string, unknown>,
): QueryComplexityResult {
  let score = 0
  const warnings: string[] = []

  // Analyze includes depth
  if (include) {
    const depth = getIncludeDepth(include)
    score += depth * 10

    if (depth > 3) {
      warnings.push(`Deep nesting detected (${depth} levels). Consider splitting queries.`)
    }

    // Count total relations
    const relationCount = countRelations(include)
    score += relationCount * 5

    if (relationCount > 10) {
      warnings.push(
        `Many relations included (${relationCount}). This may cause performance issues.`,
      )
    }
  }

  // Analyze where conditions
  if (where) {
    const orConditions = countOrConditions(where)
    score += orConditions * 15

    if (orConditions > 5) {
      warnings.push(`Many OR conditions (${orConditions}). Consider using indexed fields.`)
    }
  }

  return {
    score,
    complexity: score < 50 ? 'low' : score < 100 ? 'medium' : 'high',
    warnings,
  }
}

function getIncludeDepth(include: Record<string, unknown>, currentDepth = 1): number {
  let maxDepth = currentDepth

  Object.values(include).forEach((value) => {
    if (typeof value === 'object' && value !== null && 'include' in value && value.include) {
      const depth = getIncludeDepth(value.include as Record<string, unknown>, currentDepth + 1)
      maxDepth = Math.max(maxDepth, depth)
    }
  })

  return maxDepth
}

function countRelations(include: Record<string, unknown>): number {
  let count = Object.keys(include).length

  Object.values(include).forEach((value) => {
    if (typeof value === 'object' && value !== null && 'include' in value && value.include) {
      count += countRelations(value.include as Record<string, unknown>)
    }
  })

  return count
}

function countOrConditions(where: Record<string, unknown>): number {
  let count = 0

  if (where.OR && Array.isArray(where.OR)) count += where.OR.length

  Object.values(where).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      count += countOrConditions(value as Record<string, unknown>)
    }
  })

  return count
}

interface QueryComplexityResult {
  score: number
  complexity: 'low' | 'medium' | 'high'
  warnings: string[]
}

/**
 * Connection pool optimization settings
 */
export function getOptimizedPoolSettings() {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    // Connection pool size based on environment
    connection_limit: isProduction ? 10 : 5,

    // Timeout settings
    pool_timeout: 10,
    timeout: 20000,

    // Idle timeout to free up connections
    idle_in_transaction_session_timeout: 10000,

    // Statement timeout for long queries
    statement_timeout: 60000,
  }
}

/**
 * Generate optimized DATABASE_URL with connection pool parameters
 *
 * NOTE: Returns the URL as-is without modifications for now.
 * Custom parameters can cause issues with pgBouncer and interactive transactions.
 * Use DATABASE_URL and DATABASE_DIRECT_URL from environment variables.
 */
export function getOptimizedDatabaseUrl(baseUrl?: string): string {
  const url = baseUrl || process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required')
  }

  // Return URL as-is - let environment variables handle pgBouncer configuration
  return url
}
