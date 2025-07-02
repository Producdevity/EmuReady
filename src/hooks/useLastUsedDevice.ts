import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from './useLocalStorage'
import type { DeviceOption } from '@/app/listings/components/shared'

interface UseLastUsedDeviceReturn {
  lastUsedDevice: DeviceOption | null
  setLastUsedDevice: (device: DeviceOption | null) => void
  isLoading: boolean
}

export function useLastUsedDevice(): UseLastUsedDeviceReturn {
  const [lastUsedDevice, setLastUsedDevice, isHydrated] =
    useLocalStorage<DeviceOption | null>(
      storageKeys.newListing.lastUsedDevice,
      null,
    )

  return {
    lastUsedDevice,
    setLastUsedDevice,
    isLoading: !isHydrated,
  }
}
