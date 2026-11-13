import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
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
  it('offers a new save when preferences were persisted without the consent marker', () => {
    storage.set(
      storageKeys.cookies.preferences,
      JSON.stringify({ necessary: true, analytics: false, performance: false }),
    )
    render(<CookieConsent />)
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('heading', { name: 'Cookie Preferences' })).toBeInTheDocument()
  })

  it.each(Object.values(storageKeys.cookies))(
    'keeps retry controls available when saving %s fails',
    (failedKey) => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const writer = vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, value) => {
        if (key === failedKey) throw new Error('Storage blocked')
        storage.set(key, value)
      })
      try {
        render(<CookieConsent />)
        act(() => vi.advanceTimersByTime(2000))
        fireEvent.click(screen.getByRole('button', { name: 'Necessary Only' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Please try again')
        expect(screen.getByRole('button', { name: 'Necessary Only' })).toBeInTheDocument()
        writer.mockRestore()
        fireEvent.click(screen.getByRole('button', { name: 'Necessary Only' }))
        expect(
          screen.queryByRole('heading', { name: 'Cookie Preferences' }),
        ).not.toBeInTheDocument()
        expect(storage.get(storageKeys.cookies.consent)).toBe('true')
      } finally {
        writer.mockRestore()
        warning.mockRestore()
      }
    },
  )

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
