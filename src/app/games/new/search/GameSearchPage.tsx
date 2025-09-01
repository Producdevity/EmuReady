'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import {
  GameSearchForm,
  GameSearchResults,
  GameSearchHeader,
  type BaseGameResult,
} from '@/components/game-search'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { ms } from '@/utils/time'
import { Role } from '@orm'
import GamePreviewModal from './components/GamePreviewModal'
import NotSignedInMessage from '../components/NotSignedInMessage'
import { extractBoxartUrl } from './utils/boxartHelpers'
import type { TGDBGame, TGDBGamesByNameResponse } from '@/types/tgdb'

// Extended TGDB game result that extends BaseGameResult
interface TGDBGameResult extends BaseGameResult {
  id: string
  overview?: string
  developers?: number[]
  publishers?: number[]
  alternates?: string[]
  boxart?: string
}

interface TGDBGameWithBoxart extends Omit<TGDBGame, 'genres'> {
  boxart?: string
  platform_name?: string
  genre_names?: string[]
  genres?: number[]
}

function mapTGDBToBaseGame(game: TGDBGameWithBoxart): TGDBGameResult {
  return {
    id: String(game.id),
    name: game.game_title,
    releaseDate: game.release_date ?? null,
    platforms: game.platform_name ? [{ name: game.platform_name }] : [],
    genres: game.genre_names?.map((g) => ({ name: g })) ?? [],
    imageUrl: game.boxart ?? null,
    boxartUrl: game.boxart ?? null,
    bannerUrl: null,
    summary: game.overview ?? null,
    isErotic: false,
    overview: game.overview,
    developers: game.developers,
    publishers: game.publishers,
    alternates: game.alternates,
    boxart: game.boxart,
  }
}

function TGDBSearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  // Get values directly from URL
  const urlQuery = searchParams.get('q') ?? ''
  const urlSystemId = searchParams.get('system') ?? ''

  const [searchResults, setSearchResults] = useState<{
    games: TGDBGameResult[]
    count: number
  } | null>(null)
  const [selectedGame, setSelectedGame] = useState<TGDBGameWithBoxart | null>(null)
  const [searchResponse, setSearchResponse] = useState<TGDBGamesByNameResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })
  const createGame = api.games.create.useMutation()
  const systemsQuery = api.systems.get.useQuery()

  // Check for existing games by name and system
  const gameNamesAndSystems = useMemo(() => {
    if (!searchResults?.games || !urlSystemId) return []
    return searchResults.games.map((game) => ({
      name: game.name,
      systemId: urlSystemId,
    }))
  }, [searchResults, urlSystemId])

  const existingGamesQuery = api.games.checkExistingByNamesAndSystems.useQuery(
    { games: gameNamesAndSystems },
    {
      enabled: gameNamesAndSystems.length > 0,
      staleTime: ms.seconds(30),
      refetchOnWindowFocus: true,
    },
  )

  // Update URL when search parameters change
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

  const handleSearch = useCallback(
    async (query: string, platformId: number | null, systemId: string | null) => {
      setIsSearching(true)

      // Update URL with search parameters
      updateSearchParams(query, systemId)

      // Get system key from systemId
      const selectedSystem = systemId ? systemsQuery.data?.find((s) => s.id === systemId) : null

      try {
        const results = await utils.tgdb.searchGames.fetch({
          query,
          systemKey: selectedSystem?.key,
        })

        setSearchResponse(results) // Store for modal

        // Map TGDB games to our unified format
        const gameData = results.data?.games ?? []
        const mappedGames = gameData.map((game) => {
          // Extract boxart URL from the search response
          const boxartUrl = extractBoxartUrl(game, results)

          const enrichedGame: TGDBGameWithBoxart = {
            ...game,
            boxart: boxartUrl || undefined,
            platform_name: typeof game.platform === 'string' ? game.platform : undefined,
            genre_names:
              Array.isArray(game.genres) &&
              game.genres.length > 0 &&
              typeof game.genres[0] === 'string'
                ? game.genres.map(String)
                : undefined,
          }
          return mapTGDBToBaseGame(enrichedGame)
        })
        setSearchResults({
          games: mappedGames,
          count: results.data?.count ?? 0,
        })
      } catch (error) {
        console.error('Search error:', error)
        toast.error(getErrorMessage(error, 'Failed to search games'))
      } finally {
        setIsSearching(false)
      }
    },
    [utils, updateSearchParams, systemsQuery.data],
  )

  // Auto-search on page load if URL has parameters
  useEffect(() => {
    if (urlQuery && systemsQuery.data && !searchResults) {
      const selectedSystem = urlSystemId
        ? systemsQuery.data.find((system) => system.id === urlSystemId)
        : null

      if (selectedSystem) {
        handleSearch(urlQuery, null, selectedSystem.id).catch(console.error)
      }
    }
  }, [urlQuery, urlSystemId, systemsQuery.data, searchResults, handleSearch])

  const handleGamePreview = useCallback(
    (game: BaseGameResult) => {
      // Find the original TGDB game for the modal
      const tgdbGame = searchResults?.games.find((g) => g.id === game.id)
      if (tgdbGame) {
        const originalGame: TGDBGameWithBoxart = {
          id: Number(tgdbGame.id),
          game_title: tgdbGame.name,
          release_date: typeof tgdbGame.releaseDate === 'string' ? tgdbGame.releaseDate : undefined,
          platform_name: tgdbGame.platforms?.[0]?.name,
          genre_names: tgdbGame.genres?.map((g) => g.name) ?? [],
          boxart: tgdbGame.boxart,
          overview: tgdbGame.overview,
          developers: tgdbGame.developers,
          publishers: tgdbGame.publishers,
          alternates: tgdbGame.alternates,
        }
        setSelectedGame(originalGame)
        setIsModalOpen(true)
      }
    },
    [searchResults],
  )

  const handleGameSelect = useCallback(
    async (game: TGDBGameWithBoxart, systemId: string) => {
      if (!user) return

      setIsSelecting(true)
      try {
        const newGame = await createGame.mutateAsync({
          title: game.game_title,
          systemId,
          imageUrl: game.boxart ?? null,
          boxartUrl: game.boxart ?? null,
          bannerUrl: null,
          isErotic: false,
          tgdbGameId: game.id,
        })

        // Invalidate the existing games cache to ensure the new game is reflected
        await utils.games.checkExistingByNamesAndSystems.invalidate()

        toast.success('Game added successfully!')
        router.push(`/listings/new?gameId=${newGame.id}`)
      } catch (error) {
        // Check if the game already exists and get the existing game ID
        const errorMessage = getErrorMessage(error, 'Failed to add game')

        // Check if this is a duplicate game error
        if (errorMessage.includes('already exists for the system')) {
          // Extract the existing game ID from the error if available
          const cause = (error as Error & { cause?: { existingGameId?: string } })?.cause
          if (cause?.existingGameId) {
            toast.info('Game already exists. Redirecting...')
            router.push(`/listings/new?gameId=${cause.existingGameId}`)
          } else {
            // If we can't get the ID, just show the error
            toast.error(errorMessage)
          }
        } else {
          toast.error(errorMessage)
        }
      } finally {
        setIsSelecting(false)
      }
    },
    [user, createGame, router, utils],
  )

  const isModeratorOrHigher = useMemo(() => {
    return userQuery.data ? hasPermission(userQuery.data.role, Role.MODERATOR) : false
  }, [userQuery.data])

  const isAdmin = useMemo(() => {
    return userQuery.data ? hasPermission(userQuery.data.role, Role.ADMIN) : false
  }, [userQuery.data])

  if (!isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return <NotSignedInMessage />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <GameSearchHeader
        provider="tgdb"
        showBackButton={isAdmin}
        showAlternativeSearch={isAdmin}
        isAdmin={isAdmin}
      />

      <GameSearchForm
        provider="tgdb"
        onSearch={handleSearch}
        systems={systemsQuery.data ?? []}
        initialQuery={urlQuery}
        initialSystemId={urlSystemId}
        isSearching={isSearching}
        showModeratorFeatures={isModeratorOrHigher}
      />

      {searchResults && (
        <GameSearchResults<TGDBGameResult>
          provider="tgdb"
          results={searchResults}
          onGameSelect={handleGamePreview}
          existingGames={existingGamesQuery.data ?? {}}
          currentSystemId={urlSystemId}
        />
      )}

      <GamePreviewModal
        game={selectedGame}
        searchResponse={searchResponse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(game) => {
          const gameWithBoxart = { ...game, boxart: selectedGame?.boxart }
          handleGameSelect(gameWithBoxart, urlSystemId)
        }}
        isSelecting={isSelecting}
      />
    </div>
  )
}

export default function GameSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <TGDBSearchContent />
    </Suspense>
  )
}
