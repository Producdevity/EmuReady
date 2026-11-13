import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { type GameOption } from '../components/shared'

interface Params {
  gameIdFromUrl: string | null
  onGameSelect: (game: GameOption) => void
  onSearchTermChange: (term: string) => void
}

export function usePreSelectedGame(params: Params) {
  const { gameIdFromUrl, onGameSelect, onSearchTermChange } = params
  const preselection = useRef({ gameId: gameIdFromUrl, applied: false })
  const query = api.games.byId.useQuery(
    { id: gameIdFromUrl ?? '' },
    { enabled: Boolean(gameIdFromUrl) },
  )
  const game = query.data
  const isInitialGameLoaded = Boolean(gameIdFromUrl && game?.id === gameIdFromUrl)

  useEffect(() => {
    if (preselection.current.gameId !== gameIdFromUrl) {
      preselection.current = { gameId: gameIdFromUrl, applied: false }
    }
    if (!game || game.id !== gameIdFromUrl || preselection.current.applied) return
    preselection.current.applied = true
    onGameSelect({
      id: game.id,
      title: game.title,
      system: game.system,
      status: game.status,
      imageUrl: game.imageUrl ?? undefined,
      boxartUrl: game.boxartUrl ?? undefined,
    })
    onSearchTermChange(game.title)
  }, [game, gameIdFromUrl, onGameSelect, onSearchTermChange])

  return { isInitialGameLoaded }
}
