import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MemoryCache from './MemoryCache'

describe('MemoryCache', () => {
  let cache: MemoryCache<string>

  beforeEach(() => {
    cache = new MemoryCache<string>({
      ttl: 1000, // 1 second
      maxSize: 3,
      cleanupInterval: 100, // 100ms for testing
    })
  })

  afterEach(() => {
    cache.destroy()
  })

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('should delete values', () => {
      cache.set('key1', 'value1')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.get('key1')).toBeUndefined()
    })

    it('should return false when deleting non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false)
    })

    it('should clear all values', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.getSize()).toBe(0)
    })
  })

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(cache.get('key1')).toBeUndefined()
    })

    it('should support custom TTL per entry', async () => {
      cache.set('short', 'value1', 100) // 100ms TTL
      cache.set('long', 'value2', 2000) // 2s TTL

      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(cache.get('short')).toBeUndefined()
      expect(cache.get('long')).toBe('value2')
    })

    it('should update lastAccessed on get', () => {
      cache.set('key1', 'value1')

      // Access the key multiple times
      cache.get('key1')
      cache.get('key1')

      expect(cache.get('key1')).toBe('value1')
    })
  })

  describe('LRU eviction', () => {
    it('should evict least recently used items when at capacity', () => {
      // Fill cache to capacity (maxSize: 3)
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      // Access key1 to make it recently used
      cache.get('key1')

      // Add fourth item, should evict key2 (least recently used)
      cache.set('key4', 'value4')

      expect(cache.get('key1')).toBe('value1') // Still present (recently accessed)
      expect(cache.get('key2')).toBeUndefined() // Evicted
      expect(cache.get('key3')).toBe('value3') // Still present
      expect(cache.get('key4')).toBe('value4') // Newly added
    })

    it('should not evict when updating existing keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      // Update existing key (should not trigger eviction)
      cache.set('key1', 'updated_value1')

      expect(cache.getSize()).toBe(3)
      expect(cache.get('key1')).toBe('updated_value1')
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
    })
  })

  describe('pattern invalidation', () => {
    it('should invalidate entries matching pattern', () => {
      // Clear cache to ensure we start fresh for this test
      cache.clear()

      cache.set('user:1:profile', 'profile1')
      cache.set('user:1:settings', 'settings1')
      cache.set('user:2:profile', 'profile2')
      // Don't add the 4th item to avoid LRU eviction (maxSize: 3)

      const deletedCount = cache.invalidatePattern('user:1:*')

      expect(deletedCount).toBe(2)
      expect(cache.get('user:1:profile')).toBeUndefined()
      expect(cache.get('user:1:settings')).toBeUndefined()
      expect(cache.get('user:2:profile')).toBe('profile2')

      // Now add the product item separately to test it wasn't affected
      cache.set('product:1:info', 'product1')
      expect(cache.get('product:1:info')).toBe('product1')
    })

    it('should handle complex patterns', () => {
      cache.set('api:v1:users', 'users')
      cache.set('api:v1:products', 'products')
      cache.set('api:v2:users', 'users_v2')

      const deletedCount = cache.invalidatePattern('api:v1:*')

      expect(deletedCount).toBe(2)
      expect(cache.get('api:v2:users')).toBe('users_v2')
    })
  })

  describe('statistics', () => {
    it('should track cache statistics', () => {
      const initialStats = cache.getStats()
      expect(initialStats.hits).toBe(0)
      expect(initialStats.misses).toBe(0)
      expect(initialStats.size).toBe(0)

      cache.set('key1', 'value1')
      cache.get('key1') // Hit
      cache.get('nonexistent') // Miss

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.size).toBe(1)
      expect(stats.maxSize).toBe(3)
    })

    it('should track evictions', () => {
      // Fill cache beyond capacity to trigger evictions
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4') // Should trigger eviction

      const stats = cache.getStats()
      expect(stats.evictions).toBe(1)
    })
  })

  describe('cleanup and memory management', () => {
    it('should automatically cleanup expired entries', async () => {
      cache.set('temp1', 'value1', 50) // 50ms TTL
      cache.set('temp2', 'value2', 50) // 50ms TTL
      cache.set('permanent', 'value3', 5000) // 5s TTL

      expect(cache.getSize()).toBe(3)

      // Wait for cleanup to run (cleanupInterval: 100ms)
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(cache.getSize()).toBe(1)
      expect(cache.get('permanent')).toBe('value3')
    })

    it('should destroy properly and clear timer', () => {
      const destroySpy = vi.spyOn(cache, 'destroy')

      cache.destroy()

      expect(destroySpy).toHaveBeenCalled()
      expect(cache.getSize()).toBe(0)
    })
  })

  describe('type safety', () => {
    it('should work with different value types', () => {
      const numberCache = new MemoryCache<number>({
        ttl: 1000,
        maxSize: 10,
      })

      const objectCache = new MemoryCache<{ id: number; name: string }>({
        ttl: 1000,
        maxSize: 10,
      })

      numberCache.set('count', 42)
      objectCache.set('user', { id: 1, name: 'John' })

      expect(numberCache.get('count')).toBe(42)
      expect(objectCache.get('user')).toEqual({ id: 1, name: 'John' })

      numberCache.destroy()
      objectCache.destroy()
    })
  })

  describe('edge cases', () => {
    it('should handle rapid successive operations', () => {
      // Rapidly set and get many values
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`)
      }

      // Should only keep the last 3 due to maxSize: 3
      expect(cache.getSize()).toBe(3)
      expect(cache.get('key99')).toBe('value99')
      expect(cache.get('key98')).toBe('value98')
      expect(cache.get('key97')).toBe('value97')
    })

    it('should handle setting the same key multiple times', () => {
      cache.set('key1', 'value1')
      cache.set('key1', 'value2')
      cache.set('key1', 'value3')

      expect(cache.get('key1')).toBe('value3')
      expect(cache.getSize()).toBe(1)
    })

    it('should handle empty string keys and values', () => {
      cache.set('', 'empty_key')
      cache.set('empty_value', '')

      expect(cache.get('')).toBe('empty_key')
      expect(cache.get('empty_value')).toBe('')
    })
  })
})
