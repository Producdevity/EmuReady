import { renderHook, act } from '@testing-library/react'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { useLastUsedDevice } from './useLastUsedDevice'
import { useLocalStorage } from './useLocalStorage'
import type { DeviceOption } from '@/app/listings/components/shared'

vi.mock('./useLocalStorage', () => ({
  default: vi.fn(() => [null, vi.fn(), true]),
}))

describe('useLastUsedDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial state with no device', () => {
    vi.mocked(useLocalStorage).mockReturnValue([null, vi.fn(), true])

    const { result } = renderHook(() => useLastUsedDevice())

    expect(result.current.lastUsedDevice).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(typeof result.current.setLastUsedDevice).toBe('function')
  })

  it('should return loading state when not hydrated', () => {
    vi.mocked(useLocalStorage).mockReturnValue([null, vi.fn(), false])

    const { result } = renderHook(() => useLastUsedDevice())

    expect(result.current.isLoading).toBe(true)
  })

  it('should return stored device from localStorage', () => {
    const mockDevice: DeviceOption = {
      id: 'device-1',
      modelName: 'Steam Deck',
      brand: { id: 'brand-1', name: 'Valve' },
      soc: { id: 'soc-1', name: 'Zen 2', manufacturer: 'AMD' },
    }

    vi.mocked(useLocalStorage).mockReturnValue([mockDevice, vi.fn(), true])

    const { result } = renderHook(() => useLastUsedDevice())

    expect(result.current.lastUsedDevice).toEqual(mockDevice)
    expect(result.current.isLoading).toBe(false)
  })

  it('should allow setting a new device', async () => {
    const mockSetDevice = vi.fn()
    vi.mocked(useLocalStorage).mockReturnValue([null, mockSetDevice, true])

    const mockDevice: DeviceOption = {
      id: 'device-2',
      modelName: 'ROG Ally',
      brand: { id: 'brand-2', name: 'ASUS' },
      soc: { id: 'soc-2', name: 'Z1 Extreme', manufacturer: 'AMD' },
    }

    const { result } = renderHook(() => useLastUsedDevice())

    act(() => {
      result.current.setLastUsedDevice(mockDevice)
    })

    expect(mockSetDevice).toHaveBeenCalledWith(mockDevice)
  })

  it('should allow clearing the device', async () => {
    const mockSetDevice = vi.fn()
    vi.mocked(useLocalStorage).mockReturnValue([null, mockSetDevice, true])

    const { result } = renderHook(() => useLastUsedDevice())

    act(() => {
      result.current.setLastUsedDevice(null)
    })

    expect(mockSetDevice).toHaveBeenCalledWith(null)
  })
})
