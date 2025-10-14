import { useEffect, useState } from 'react'
import { type UseFormReturn, type Path } from 'react-hook-form'
import { api } from '@/lib/api'
import { type GameOption } from '../components/shared'

interface UsePreSelectedGameParams<TFormValues extends { gameId: string }> {
  gameIdFromUrl: string | null
  form: UseFormReturn<TFormValues>
  onGameSelect: (game: GameOption) => void
  onSearchTermChange: (term: string) => void
}

export function usePreSelectedGame<TFormValues extends { gameId: string }>({
  gameIdFromUrl,
  form,
  onGameSelect,
  onSearchTermChange,
}: UsePreSelectedGameParams<TFormValues>) {
  const [isInitialGameLoaded, setIsInitialGameLoaded] = useState(false)

  const preSelectedGameQuery = api.games.byId.useQuery(
    { id: gameIdFromUrl! },
    { enabled: !!gameIdFromUrl && !isInitialGameLoaded },
  )

  useEffect(() => {
    if (preSelectedGameQuery.data && gameIdFromUrl && !isInitialGameLoaded) {
      const gameOption: GameOption = {
        id: preSelectedGameQuery.data.id,
        title: preSelectedGameQuery.data.title,
        system: preSelectedGameQuery.data.system,
        status: preSelectedGameQuery.data.status,
        imageUrl: preSelectedGameQuery.data.imageUrl ?? undefined,
        boxartUrl: preSelectedGameQuery.data.boxartUrl ?? undefined,
      }
      onGameSelect(gameOption)
      form.setValue('gameId' as Path<TFormValues>, preSelectedGameQuery.data.id as never)
      setIsInitialGameLoaded(true)
      onSearchTermChange(preSelectedGameQuery.data.title)
    }
  }, [
    preSelectedGameQuery.data,
    gameIdFromUrl,
    isInitialGameLoaded,
    form,
    onGameSelect,
    onSearchTermChange,
  ])

  return { isInitialGameLoaded, preSelectedGameQuery }
}
