import storageKeys from '@/data/storageKeys'
import { LastUsedDeviceSchema } from '@/schemas/preferences'
import { useLocalStorage } from './useLocalStorage'

export function useLastUsedDevice() {
  const [lastUsedDevice, setLastUsedDevice, isHydrated] = useLocalStorage(
    storageKeys.newListing.lastUsedDevice,
    null,
    LastUsedDeviceSchema,
  )

  return {
    lastUsedDevice,
    setLastUsedDevice,
    isLoading: !isHydrated,
  }
}
