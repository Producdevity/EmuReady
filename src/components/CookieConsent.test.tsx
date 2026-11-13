import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { BooleanPreferenceSchema } from '@/schemas/preferences'
import CookieConsent from './CookieConsent'

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

beforeEach(() => {
  storage.clear()
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('cookie banner storage updates', () => {
  it('shows after its delay and closes when consent is saved elsewhere', () => {
    const writer = renderHook(() =>
      useLocalStorage(storageKeys.cookies.consent, false, BooleanPreferenceSchema),
    )
    render(<CookieConsent />)
    expect(screen.queryByRole('heading', { name: 'Cookie Preferences' })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('heading', { name: 'Cookie Preferences' })).toBeInTheDocument()
    act(() => writer.result.current[1](true))
    expect(screen.queryByRole('heading', { name: 'Cookie Preferences' })).not.toBeInTheDocument()
  })

  it('does not reopen for a saved consent decision', () => {
    storage.set(storageKeys.cookies.consent, 'true')
    render(<CookieConsent />)
    act(() => vi.advanceTimersByTime(2500))
    expect(screen.queryByRole('heading', { name: 'Cookie Preferences' })).not.toBeInTheDocument()
  })
})
