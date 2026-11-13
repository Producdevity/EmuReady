import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBookmarkBrowser } from './useBookmarkBrowser'

describe('bookmark browser state', () => {
  it('resets pagination when filters or sorting change', () => {
    const { result } = renderHook(useBookmarkBrowser)
    act(() => result.current.setPage(3))
    act(() => result.current.changeFilters({ ...result.current.filters, systemIds: ['switch2'] }))
    expect(result.current.page).toBe(1)
    expect(result.current.filters.systemIds).toEqual(['switch2'])
    act(() => result.current.setPage(2))
    act(() =>
      result.current.changeFilters({
        ...result.current.filters,
        sortField: 'title',
        sortDirection: 'asc',
      }),
    )
    expect(result.current.page).toBe(1)
    expect(result.current.filters.systemIds).toEqual(['switch2'])
  })

  it('clears variant-specific filters and search when switching report types', () => {
    const { result } = renderHook(useBookmarkBrowser)
    act(() => result.current.changeFilters({ ...result.current.filters, deviceIds: ['device'] }))
    act(() => result.current.changeSearch('Mario'))
    act(() => result.current.setPage(2))
    act(() => result.current.changeVariant('pc'))
    expect(result.current).toMatchObject({ variant: 'pc', page: 1, search: '', hasFilters: false })
    expect(result.current.filters.deviceIds).toEqual([])
  })

  it('clears search and filter selections together', () => {
    const { result } = renderHook(useBookmarkBrowser)
    act(() => result.current.changeFilters({ ...result.current.filters, performanceIds: [1] }))
    act(() => result.current.changeSearch('Mario'))
    act(() => result.current.clearFilters())
    expect(result.current).toMatchObject({ page: 1, search: '', hasFilters: false })
    expect(result.current.filters.performanceIds).toEqual([])
  })
})

it.each(['clear', 'variant'] as const)('clears the effective query immediately on %s', (reset) => {
  vi.useFakeTimers()
  try {
    const { result } = renderHook(useBookmarkBrowser)
    act(() => result.current.changeSearch('Mario'))
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.debouncedSearch).toBe('Mario')
    act(() =>
      reset === 'clear' ? result.current.clearFilters() : result.current.changeVariant('pc'),
    )
    expect(result.current.debouncedSearch).toBe('')
  } finally {
    vi.useRealTimers()
  }
})

it('preserves shared filters and sorting when switching variants', () => {
  const { result } = renderHook(useBookmarkBrowser)
  const common = {
    systemIds: ['00000000-0000-4000-a000-000000000001'],
    emulatorIds: ['00000000-0000-4000-a000-000000000002'],
    performanceIds: [1],
    sortField: 'title' as const,
    sortDirection: 'asc' as const,
  }
  act(() =>
    result.current.changeFilters({
      ...result.current.filters,
      ...common,
      deviceIds: ['00000000-0000-4000-a000-000000000003'],
      socIds: ['00000000-0000-4000-a000-000000000004'],
    }),
  )
  act(() => result.current.changeVariant('pc'))
  expect(result.current.filters).toMatchObject({
    ...common,
    deviceIds: [],
    socIds: [],
    cpuIds: [],
    gpuIds: [],
    memoryMin: null,
    memoryMax: null,
  })
})

it('keeps the current state when the active variant is clicked', () => {
  const { result } = renderHook(useBookmarkBrowser)
  act(() => result.current.changeSearch('Mario'))
  act(() => result.current.setPage(3))
  act(() => result.current.changeVariant('handheld'))
  expect(result.current).toMatchObject({ variant: 'handheld', search: 'Mario', page: 3 })
})
