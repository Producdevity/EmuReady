import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
