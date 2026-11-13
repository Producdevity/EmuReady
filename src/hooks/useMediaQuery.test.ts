import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

function mediaQuery(media: string, matches: boolean) {
  return Object.assign(new EventTarget(), {
    media,
    matches,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }) satisfies MediaQueryList
}

afterEach(() => vi.restoreAllMocks())

describe('useMediaQuery', () => {
  it('reads the current browser match and responds to changes', () => {
    const media = mediaQuery('(min-width: 1024px)', true)
    vi.spyOn(window, 'matchMedia').mockReturnValue(media)
    const view = renderHook(() => useMediaQuery(media.media))
    expect(view.result.current).toBe(true)

    act(() => {
      media.matches = false
      media.dispatchEvent(new Event('change'))
    })
    expect(view.result.current).toBe(false)
  })

  it('unsubscribes from the previous query and cleans up on unmount', () => {
    const desktop = mediaQuery('(min-width: 1024px)', true)
    const mobile = mediaQuery('(max-width: 767px)', false)
    const removeDesktop = vi.spyOn(desktop, 'removeEventListener')
    const removeMobile = vi.spyOn(mobile, 'removeEventListener')
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      query === desktop.media ? desktop : mobile,
    )
    const view = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: desktop.media },
    })

    view.rerender({ query: mobile.media })
    expect(view.result.current).toBe(false)
    expect(removeDesktop).toHaveBeenCalledOnce()
    view.unmount()
    expect(removeMobile).toHaveBeenCalledOnce()
  })
})
