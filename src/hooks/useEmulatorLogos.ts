import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export function useEmulatorLogos() {
  const [showEmulatorLogos, setShowEmulatorLogos, isHydrated] = useLocalStorage(
    storageKeys.showEmulatorLogos,
    true,
  )

  return {
    showEmulatorLogos,
    setShowEmulatorLogos,
    isHydrated,
    toggleEmulatorLogos: () => setShowEmulatorLogos(!showEmulatorLogos),
  }
}
