import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import storageKeys from '@/data/storageKeys'
import { isTrackingAllowed } from './isTrackingAllowed'

// Minimal in-memory localStorage mock
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

describe('isTrackingAllowed', () => {
  const originalWindow = globalThis.window
  const originalLocalStorage = (globalThis as any).localStorage
  const mem = new MemoryStorage()

  beforeEach(() => {
    // Simulate browser environment
    ;(globalThis as any).window = {} as Window
    ;(globalThis as any).localStorage = mem
    mem.clear()
  })

  afterEach(() => {
    // Restore environment
    ;(globalThis as any).window = originalWindow
    ;(globalThis as any).localStorage = originalLocalStorage
  })

  it('blocks all categories when no consent is present', () => {
    expect(isTrackingAllowed('performance')).toBe(false)
    expect(isTrackingAllowed('filter')).toBe(false)
  })

  it('allows analytics categories only when analytics consent is true', () => {
    mem.setItem(storageKeys.cookies.consent, 'true')
    mem.setItem(
      storageKeys.cookies.preferences,
      JSON.stringify({ analytics: true, performance: false }),
    )

    expect(isTrackingAllowed('filter')).toBe(true)
    expect(isTrackingAllowed('engagement')).toBe(true)
    expect(isTrackingAllowed('performance')).toBe(false)
  })

  it('allows performance category only when performance consent is true', () => {
    mem.setItem(storageKeys.cookies.consent, 'true')
    mem.setItem(
      storageKeys.cookies.preferences,
      JSON.stringify({ analytics: false, performance: true }),
    )

    expect(isTrackingAllowed('performance')).toBe(true)
    expect(isTrackingAllowed('filter')).toBe(false)
  })
})
