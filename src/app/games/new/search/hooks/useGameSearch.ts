import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { api } from '@/lib/api'
import { ms } from '@/utils/time'

interface UseGameSearchOptions<TGame extends { name: string }> {
  searchResults: { games: TGame[] } | null
  urlSystemId: string
}

export function useGameSearch<TGame extends { name: string }>(
  options: UseGameSearchOptions<TGame>,
) {
  const router = useRouter()
  const pathname = usePathname()

  const gameNamesAndSystems = useMemo(() => {
    if (!options.searchResults?.games || !options.urlSystemId) return []
    return options.searchResults.games.map((game) => ({
      name: game.name,
      systemId: options.urlSystemId,
    }))
  }, [options.searchResults, options.urlSystemId])

  const existingGamesQuery = api.games.checkExistingByNamesAndSystems.useQuery(
    { games: gameNamesAndSystems },
    {
      enabled: gameNamesAndSystems.length > 0,
      staleTime: ms.seconds(30),
      refetchOnWindowFocus: true,
    },
  )

  const updateSearchParams = useCallback(
    (query: string, systemId: string | null) => {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (systemId) params.set('system', systemId)
      const searchString = params.toString()
      const newUrl = searchString ? `?${searchString}` : pathname
      router.replace(newUrl, { scroll: false })
    },
    [router, pathname],
  )

  return {
    existingGames: existingGamesQuery.data ?? {},
    updateSearchParams,
  }
}
