import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUrlFilterState } from './useUrlFilterState'

let query = new URLSearchParams()
const navigation = vi.hoisted(() => ({ push: vi.fn<(url: string) => void>(), replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => query,
  usePathname: () => '/listings',
}))
vi.mock('@/lib/toast', () => ({ default: { warning: vi.fn() } }))
vi.mock('@/lib/analytics', () => ({
  default: { filter: { page: vi.fn(), sort: vi.fn(), myListings: vi.fn() } },
}))
const storage = new Map<string, string>()
const local = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: (key: string) => storage.delete(key),
}
Object.defineProperty(window, 'localStorage', { configurable: true, value: local })
const config = { basePath: '/listings', storageKey: 'page-size', maxLimit: 100 }

beforeEach(() => {
  query = new URLSearchParams()
  storage.clear()
  vi.clearAllMocks()
})
afterEach(() => vi.restoreAllMocks())

describe('report page size preference', () => {
  it('reads a saved page size without mirroring it into local state', () => {
    storage.set('page-size', '25')
    const { result } = renderHook(() => useUrlFilterState(config))
    expect(result.current.limit).toBe(25)
  })

  it('persists a URL page size and retains it after the URL parameter is removed', () => {
    storage.set('page-size', '25')
    query = new URLSearchParams('limit=50')
    const { result, rerender } = renderHook(() => useUrlFilterState(config))
    expect(result.current.limit).toBe(50)
    expect(storage.get('page-size')).toBe('50')
    query = new URLSearchParams()
    rerender()
    expect(result.current.limit).toBe(50)
  })

  it('does not write the old URL size back over a pending user selection', () => {
    query = new URLSearchParams('limit=10')
    const { result, rerender } = renderHook(() => useUrlFilterState(config))
    act(() => result.current.setLimit(25))
    expect(storage.get('page-size')).toBe('25')
    const pushed = navigation.push.mock.lastCall?.[0]
    expect(pushed).toBeDefined()
    const params = new URLSearchParams(pushed?.split('?')[1])
    expect(params.get('limit')).toBe('25')
    expect(params.get('page')).toBe('1')
    query = params
    rerender()
    expect(result.current.limit).toBe(25)
    expect(storage.get('page-size')).toBe('25')
  })

  it('keeps the requested URL size usable when saving preferences is blocked', () => {
    query = new URLSearchParams('limit=50')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(local, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage blocked')
    })
    const { result } = renderHook(() => useUrlFilterState(config))
    expect(result.current.limit).toBe(50)
    expect(warning).toHaveBeenCalledWith('Failed to save report page size:', expect.any(Error))
  })
})
