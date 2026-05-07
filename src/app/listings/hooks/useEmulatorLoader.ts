import { useCallback, useState } from 'react'
import { api } from '@/lib/api'
import { type EmulatorOption, type GameOption } from '../components/shared'

interface Options {
  platformId?: string | null
}

export function useEmulatorLoader(selectedGame: GameOption | null, options?: Options) {
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')
  const [availableEmulators, setAvailableEmulators] = useState<EmulatorOption[]>([])
  const utils = api.useUtils()
  const platformId = options?.platformId ?? undefined

  const loadEmulatorItems = useCallback(
    async (query: string): Promise<EmulatorOption[]> => {
      setEmulatorSearchTerm(query)

      if (!selectedGame) {
        setAvailableEmulators([])
        return Promise.resolve([])
      }

      try {
        const result = await utils.emulators.get.fetch({
          search: query,
          platformId: platformId ?? undefined,
        })

        const filteredEmulators = result.emulators
          .filter((emulator) =>
            emulator.systems.some((system) => system.id === selectedGame.system.id),
          )
          .map((emulator) => ({
            id: emulator.id,
            name: emulator.name,
            systems: emulator.systems,
            logo: emulator.logo,
          }))

        setAvailableEmulators(filteredEmulators)
        return filteredEmulators
      } catch (error) {
        console.error('Error fetching emulators:', error)
        setAvailableEmulators([])
        return []
      }
    },
    [utils.emulators.get, selectedGame, platformId],
  )

  return {
    emulatorSearchTerm,
    setEmulatorSearchTerm,
    availableEmulators,
    setAvailableEmulators,
    loadEmulatorItems,
  }
}
