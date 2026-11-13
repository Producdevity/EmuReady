import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUrlFilterState } from './useUrlFilterState'

const mocks = vi.hoisted(() => ({
  router: { replace: vi.fn(), push: vi.fn() },
  params: new URLSearchParams('page=3'),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
  useSearchParams: () => mocks.params,
  usePathname: () => '/listings',
}))

vi.mock('@/lib/analytics', () => ({ default: { filter: { page: vi.fn() } } }))

const config = { basePath: '/listings', storageKey: 'test-filter-focus', maxLimit: 100 }

describe('report filter navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem: vi.fn() })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('preserves the active filter control when replacing filter parameters', () => {
    const { result } = renderHook(() => useUrlFilterState(config))

    act(() => result.current.updateFilters({ deviceIds: ['device-a'] }))

    expect(mocks.router.replace).toHaveBeenCalledExactlyOnceWith(
      '?deviceIds=%5B%22device-a%22%5D',
      { scroll: false },
    )
    expect(mocks.router.push).not.toHaveBeenCalled()
  })

  it('retains normal navigation for pagination', () => {
    const { result } = renderHook(() => useUrlFilterState(config))

    act(() => result.current.setPage(4))

    expect(mocks.router.push).toHaveBeenCalledExactlyOnceWith('?page=4')
    expect(mocks.router.replace).not.toHaveBeenCalled()
  })
})
