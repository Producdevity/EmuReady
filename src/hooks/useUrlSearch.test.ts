import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUrlSearch } from './useUrlSearch'

const navigation = vi.hoisted(() => ({
  pathname: '/games',
  params: new URLSearchParams('search=Zelda&systemId=switch&page=3'),
  router: { replace: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.params,
  useRouter: () => navigation.router,
}))

describe('URL search updates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    navigation.pathname = '/games'
    navigation.params = new URLSearchParams('search=Zelda&systemId=switch&page=3')
    navigation.router.replace.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps newer keystrokes and their remaining debounce when an earlier search commits', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    act(() => vi.advanceTimersByTime(300))
    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      '/games?search=Dark&systemId=switch',
      { scroll: false },
    )

    act(() => view.result.current[1]('Dark Souls'))
    act(() => vi.advanceTimersByTime(100))
    navigation.params = new URLSearchParams('search=Dark&systemId=switch')
    view.rerender()
    expect(view.result.current[0]).toBe('Dark Souls')
    expect(view.result.current[2]).toBe('Dark')

    act(() => vi.advanceTimersByTime(199))
    expect(navigation.router.replace).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1))
    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      '/games?search=Dark+Souls&systemId=switch',
      { scroll: false },
    )
  })

  it.each([0, 300])('keeps pagination for a whitespace-only search change (%ims)', (delay) => {
    const view = renderHook(() => useUrlSearch(delay))
    act(() => view.result.current[1]('  Zelda  '))
    act(() => vi.advanceTimersByTime(delay))

    expect(view.result.current[0]).toBe('  Zelda  ')
    expect(navigation.router.replace).not.toHaveBeenCalled()
  })

  it('does not navigate for whitespace added to an empty search', () => {
    navigation.params = new URLSearchParams('systemId=switch&page=3')
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('   '))
    act(() => vi.advanceTimersByTime(300))

    expect(navigation.router.replace).not.toHaveBeenCalled()
  })

  it('still submits a return to the current URL search while another value is in flight', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    act(() => vi.advanceTimersByTime(300))
    act(() => view.result.current[1]('Zelda'))
    act(() => vi.advanceTimersByTime(300))

    expect(navigation.router.replace).toHaveBeenCalledTimes(2)
    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      '/games?search=Zelda&systemId=switch',
      { scroll: false },
    )
  })

  it('cancels a newer draft when an unrelated search is navigated to', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    act(() => vi.advanceTimersByTime(300))
    act(() => view.result.current[1]('Dark Souls'))
    navigation.params = new URLSearchParams('search=Mario&systemId=switch')
    view.rerender()
    act(() => vi.advanceTimersByTime(300))

    expect(view.result.current[0]).toBe('Mario')
    expect(navigation.router.replace).toHaveBeenCalledTimes(1)
  })

  it('cancels a draft when the pathname changes even if its search is unchanged', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    navigation.pathname = '/listings'
    view.rerender()
    act(() => vi.advanceTimersByTime(300))

    expect(view.result.current[0]).toBe('Zelda')
    expect(navigation.router.replace).not.toHaveBeenCalled()
  })

  it('does not repeat an acknowledged search when its newer draft differs only in whitespace', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    act(() => vi.advanceTimersByTime(300))
    act(() => view.result.current[1](' Dark '))
    navigation.params = new URLSearchParams('search=Dark&systemId=switch')
    view.rerender()
    act(() => vi.advanceTimersByTime(300))

    expect(view.result.current[0]).toBe(' Dark ')
    expect(navigation.router.replace).toHaveBeenCalledTimes(1)
  })

  it('preserves further typing when the latest superseding navigation commits', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    act(() => vi.advanceTimersByTime(300))
    act(() => view.result.current[1]('Dark Souls'))
    act(() => vi.advanceTimersByTime(300))
    act(() => view.result.current[1]('Dark Souls II'))
    act(() => vi.advanceTimersByTime(100))
    navigation.params = new URLSearchParams('search=Dark+Souls&systemId=switch')
    view.rerender()

    expect(view.result.current[0]).toBe('Dark Souls II')
    act(() => vi.advanceTimersByTime(200))
    expect(navigation.router.replace).toHaveBeenCalledTimes(3)
    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      '/games?search=Dark+Souls+II&systemId=switch',
      { scroll: false },
    )
  })

  it('uses the latest unrelated URL filters when the debounce completes', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    navigation.params = new URLSearchParams('search=Zelda&systemId=ps2&page=4')
    view.rerender()
    act(() => vi.advanceTimersByTime(300))

    expect(navigation.router.replace).toHaveBeenLastCalledWith('/games?search=Dark&systemId=ps2', {
      scroll: false,
    })
  })

  it('cancels a pending search on unmount', () => {
    const view = renderHook(() => useUrlSearch())
    act(() => view.result.current[1]('Dark'))
    view.unmount()
    act(() => vi.advanceTimersByTime(300))

    expect(navigation.router.replace).not.toHaveBeenCalled()
  })
})
