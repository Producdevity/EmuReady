import storageKeys from '@/data/storageKeys'
import useLocalStorage from '@/hooks/useLocalStorage'

function useEmulatorLogos() {
  const [showEmulatorLogos, setShowEmulatorLogos, isHydrated] = useLocalStorage(
    storageKeys.showEmulatorLogos,
    false,
  )

  return {
    showEmulatorLogos,
    setShowEmulatorLogos,
    isHydrated,
    toggleEmulatorLogos: () => setShowEmulatorLogos(!showEmulatorLogos),
  }
}

export default useEmulatorLogos
