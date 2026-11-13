import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
  it('rejects incomplete saved preferences consistently with the consent hook', () => {
    localStorage.setItem(storageKeys.cookies.consent, 'true')
    localStorage.setItem(storageKeys.cookies.preferences, JSON.stringify({ analytics: true }))
    expect(isTrackingAllowed('filter')).toBe(false)
  })

  const mem = new MemoryStorage()

  beforeEach(() => {
    vi.stubGlobal('localStorage', mem)
    mem.clear()
  })

  afterEach(() => vi.unstubAllGlobals())

  it.each(['false', '0', 'null', 'invalid'])(
    'blocks all categories when consent is %s',
    (consent) => {
      mem.setItem(storageKeys.cookies.consent, consent)
      mem.setItem(
        storageKeys.cookies.preferences,
        JSON.stringify({ necessary: true, analytics: true, performance: true }),
      )
      expect(isTrackingAllowed('filter')).toBe(false)
      expect(isTrackingAllowed('performance')).toBe(false)
    },
  )

  it('blocks all categories when no consent is present', () => {
    expect(isTrackingAllowed('performance')).toBe(false)
    expect(isTrackingAllowed('filter')).toBe(false)
  })

  it('allows analytics categories only when analytics consent is true', () => {
    mem.setItem(storageKeys.cookies.consent, 'true')
    mem.setItem(
      storageKeys.cookies.preferences,
      JSON.stringify({ necessary: true, analytics: true, performance: false }),
    )

    expect(isTrackingAllowed('filter')).toBe(true)
    expect(isTrackingAllowed('engagement')).toBe(true)
    expect(isTrackingAllowed('performance')).toBe(false)
  })

  it('allows performance category only when performance consent is true', () => {
    mem.setItem(storageKeys.cookies.consent, 'true')
    mem.setItem(
      storageKeys.cookies.preferences,
      JSON.stringify({ necessary: true, analytics: false, performance: true }),
    )

    expect(isTrackingAllowed('performance')).toBe(true)
    expect(isTrackingAllowed('filter')).toBe(false)
  })
})
