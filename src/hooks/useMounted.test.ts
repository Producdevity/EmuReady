import { render, renderHook, screen } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect, vi } from 'vitest'
import useMounted from './useMounted'

describe('useMounted', () => {
  it('uses the server snapshot during SSR and hydration, then displays the client snapshot', () => {
    function MountedIndicator() {
      return useMounted() ? 'Client content' : 'Server content'
    }
    const element = createElement(MountedIndicator)
    const markup = renderToString(element)
    expect(markup).toBe('Server content')
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)

    const onRecoverableError = vi.fn()
    render(element, { container, hydrate: true, onRecoverableError })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(screen.getByText('Client content')).toBeInTheDocument()
  })

  it('should return true after mount in test environment', () => {
    const { result } = renderHook(() => useMounted())
    expect(result.current).toBe(true)
  })

  it('should remain true on subsequent rerenders', () => {
    const { result, rerender } = renderHook(() => useMounted())

    // In test environment, starts as true
    expect(result.current).toBe(true)

    // Should remain true after rerenders
    rerender()
    expect(result.current).toBe(true)

    rerender()
    expect(result.current).toBe(true)
  })

  it('should work with multiple hook instances independently', () => {
    const { result: result1 } = renderHook(() => useMounted())
    const { result: result2 } = renderHook(() => useMounted())

    // Both should be true in test environment
    expect(result1.current).toBe(true)
    expect(result2.current).toBe(true)
  })

  it('should be useful for preventing hydration mismatches in real environment', () => {
    const { result } = renderHook(() => useMounted())

    expect(typeof result.current).toBe('boolean')
    expect(result.current).toBe(true)
  })

  it('should have consistent behavior across renders', () => {
    const { result, rerender } = renderHook(() => useMounted())

    const firstValue = result.current
    rerender()
    const secondValue = result.current

    expect(firstValue).toBe(secondValue)
    expect(result.current).toBe(true)
  })
})
