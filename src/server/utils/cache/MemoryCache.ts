/**
 * High-performance in-memory cache with TTL, LRU eviction, and memory management
 * Features: Time-to-live, Least Recently Used eviction, automatic cleanup, cache statistics
 */

interface CacheEntry<T> {
  value: T
  expires: number
  lastAccessed: number
  createdAt: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  maxSize: number
  evictions: number
}

interface CacheOptions {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum number of entries
  cleanupInterval?: number // Cleanup interval in milliseconds (default: 5 minutes)
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly options: Required<CacheOptions>
  private cleanupTimer: NodeJS.Timeout | null = null
  private entryCounter = 0 // Add counter for unique timestamps
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    maxSize: 0,
    evictions: 0,
  }

  constructor(options: CacheOptions) {
    this.options = {
      cleanupInterval: 5 * 60 * 1000, // 5 minutes default
      ...options,
    }
    this.stats.maxSize = options.maxSize
    this.startCleanupTimer()
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return undefined
    }

    const now = Date.now()

    // Check if expired
    if (entry.expires < now) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size--
      return undefined
    }

    // Update last accessed time for LRU with unique ordering
    entry.lastAccessed = now + this.entryCounter++ * 0.001
    this.stats.hits++
    return entry.value
  }

  set(key: string, value: T, customTtl?: number): void {
    const now = Date.now()
    const ttl = customTtl ?? this.options.ttl

    const entry: CacheEntry<T> = {
      value,
      expires: now + ttl,
      lastAccessed: now + this.entryCounter++ * 0.001, // Add microsecond precision
      createdAt: now,
    }

    const isExistingKey = this.cache.has(key)

    // If we're at capacity and this is a new key, evict LRU
    if (!isExistingKey && this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, entry)

    // Update stats only for new keys
    if (!isExistingKey) {
      this.stats.size++
    }
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.size--
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.stats.size = 0
  }

  invalidatePattern(pattern: string): number {
    // Escape special regex characters except for our wildcard *
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')
    const regex = new RegExp(`^${escapedPattern}$`)
    let deletedCount = 0

    // Collect keys to delete first to avoid modifying during iteration
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    // Delete the collected keys
    for (const key of keysToDelete) {
      this.cache.delete(key)
      deletedCount++
    }

    // Update stats.size to match actual cache size
    this.stats.size = this.cache.size

    return deletedCount
  }

  getStats(): Readonly<CacheStats> {
    return { ...this.stats }
  }

  getSize(): number {
    return this.cache.size
  }

  getCreatedAt(key: string): Date | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Update last accessed time
    entry.lastAccessed = Date.now()

    return new Date(entry.createdAt)
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
      this.stats.size--
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.options.cleanupInterval)
    // Allow process to exit if this is the only active timer
    this.cleanupTimer.unref?.()
  }

  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    // Update stats.size to match actual cache size
    this.stats.size = this.cache.size

    if (cleanedCount > 0) {
      console.debug(`Cache cleanup: removed ${cleanedCount} expired entries`)
    }
  }
}

export default MemoryCache
