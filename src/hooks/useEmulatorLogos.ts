import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { BooleanPreferenceSchema } from '@/schemas/preferences'

export function useEmulatorLogos() {
  const [showEmulatorLogos, setShowEmulatorLogos, isHydrated] = useLocalStorage(
    storageKeys.showEmulatorLogos,
    true,
    BooleanPreferenceSchema,
  )

  return {
    showEmulatorLogos,
    setShowEmulatorLogos,
    isHydrated,
    toggleEmulatorLogos: () => setShowEmulatorLogos(!showEmulatorLogos),
  }
}
