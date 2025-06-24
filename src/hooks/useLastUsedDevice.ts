import useLocalStorage from './useLocalStorage'
import type { DeviceOption } from '@/app/listings/components/shared'

const STORAGE_KEY = 'emuready:last-used-device'

interface UseLastUsedDeviceReturn {
  lastUsedDevice: DeviceOption | null
  setLastUsedDevice: (device: DeviceOption | null) => void
  isLoading: boolean
}

function useLastUsedDevice(): UseLastUsedDeviceReturn {
  const [lastUsedDevice, setLastUsedDevice, isHydrated] =
    useLocalStorage<DeviceOption | null>(STORAGE_KEY, null)

  return {
    lastUsedDevice,
    setLastUsedDevice,
    isLoading: !isHydrated,
  }
}

export default useLastUsedDevice
