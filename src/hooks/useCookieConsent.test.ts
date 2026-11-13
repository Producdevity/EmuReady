import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import storageKeys from '@/data/storageKeys'
import { BooleanPreferenceSchema, SavedCookiePreferencesSchema } from '@/schemas/preferences'
import { useCookieConsent } from './useCookieConsent'
import { useLocalStorage } from './useLocalStorage'

vi.mock('@/lib/toast', () => ({ default: { warning: vi.fn() } }))
const storage = new Map<string, string>()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
})
beforeEach(() => storage.clear())

describe('cookie consent subscription', () => {
  it('blocks analytics without a stored consent decision', () => {
    const { result } = renderHook(useCookieConsent)
    expect(result.current.analyticsAllowed).toBe(false)
  })

  it('requires a true consent value even when saved preferences allow analytics', () => {
    storage.set(
      storageKeys.cookies.preferences,
      JSON.stringify({ necessary: true, analytics: true, performance: false }),
    )
    storage.set(storageKeys.cookies.consent, 'false')
    const { result } = renderHook(useCookieConsent)
    expect(result.current.analyticsAllowed).toBe(false)
  })

  it('reflects a decision saved by another mounted component without a page reload', () => {
    const observer = renderHook(useCookieConsent)
    const writer = renderHook(() => ({
      preferences: useLocalStorage(
        storageKeys.cookies.preferences,
        null,
        SavedCookiePreferencesSchema,
      ),
      consent: useLocalStorage(storageKeys.cookies.consent, false, BooleanPreferenceSchema),
    }))
    act(() => {
      writer.result.current.preferences[1]({ necessary: true, analytics: true, performance: false })
      writer.result.current.consent[1](true)
    })
    expect(observer.result.current.analyticsAllowed).toBe(true)
    act(() => writer.result.current.consent[1](false))
    expect(observer.result.current.analyticsAllowed).toBe(false)
  })
})
