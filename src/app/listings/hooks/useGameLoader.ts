import { useCallback, useState } from 'react'
import { api } from '@/lib/api'
import { type GameOption } from '../components/shared'

export function useGameLoader() {
  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const utils = api.useUtils()

  const loadGameItems = useCallback(
    async (query: string): Promise<GameOption[]> => {
      setGameSearchTerm(query)
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.games.get.fetch({
          search: query,
          limit: 20,
          listingFilter: 'all',
        })
        return (
          result.games.map((game) => ({
            id: game.id,
            title: game.title,
            system: game.system || {
              id: game.systemId,
              name: 'Unknown',
            },
            status: game.status,
            imageUrl: game.imageUrl ?? undefined,
            boxartUrl: game.boxartUrl ?? undefined,
          })) ?? []
        )
      } catch (error) {
        console.error('Error fetching games:', error)
        return []
      }
    },
    [utils.games.get],
  )

  return { gameSearchTerm, setGameSearchTerm, loadGameItems }
}
