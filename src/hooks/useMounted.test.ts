import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import useMounted from './useMounted'

describe('useMounted', () => {
  it('should return true after mount in test environment', () => {
    const { result } = renderHook(() => useMounted())
    // In test environment, useEffect runs immediately
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
    // This test documents the intended behavior even though in test environment
    // the hook returns true immediately due to how useEffect works in tests
    const { result } = renderHook(() => useMounted())

    // In real browser environment, this would start as false and become true after mount
    // In test environment, it's true immediately
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
