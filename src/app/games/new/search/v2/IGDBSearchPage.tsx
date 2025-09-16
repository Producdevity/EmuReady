'use client'

import { useUser } from '@clerk/nextjs'
import { AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import {
  GameSearchForm,
  GameSearchResults,
  GameSearchHeader,
  type BaseGameResult,
} from '@/components/game-search'
import { LoadingSpinner, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasRolePermission } from '@/utils/permissions'
import { getIGDBPlatformId } from '@/utils/system-platform-mapping'
import { ms } from '@/utils/time'
import { Role } from '@orm'
import IGDBGamePreviewModal from './components/IGDBGamePreviewModal'
import NotSignedInMessage from '../../components/NotSignedInMessage'

// Extended IGDB game result that extends BaseGameResult
interface IGDBGameResult extends BaseGameResult {
  id: number
  summary?: string | null
  storyline?: string
  themes?: { id: number; name: string }[]
  cover?: { url: string }
  artworks?: { url: string }[]
  screenshots?: { url: string }[]
}

function IGDBSearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  // Get values directly from URL
  const urlQuery = searchParams.get('q') ?? ''
  const urlSystemId = searchParams.get('system') ?? ''

  const [searchResults, setSearchResults] = useState<{
    games: IGDBGameResult[]
    count: number
  } | null>(null)
  const [selectedGame, setSelectedGame] = useState<IGDBGameResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })
  const createGame = api.games.create.useMutation()
  const systemsQuery = api.systems.get.useQuery()
  const confirm = useConfirmDialog()

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
      // Require system selection for game creation
      if (!systemId) {
        toast.warning('Please select a system before searching for games')
        return
      }

      setIsSearching(true)

      // Update URL with search parameters
      updateSearchParams(query, systemId)

      try {
        const results = await utils.igdb.searchGames.fetch({
          query,
          platformId,
          limit: 20,
        })
        // Map the results to ensure consistent types
        setSearchResults({
          games: results.games.map((game) => ({
            ...game,
            summary: game.summary ?? null,
          })),
          count: results.count,
        })
      } catch (error) {
        console.error('Search error:', error)
        toast.error(getErrorMessage(error, 'Failed to search games'))
      } finally {
        setIsSearching(false)
      }
    },
    [utils, updateSearchParams],
  )

  // Auto-search on page load if URL has parameters
  useEffect(() => {
    if (urlQuery && urlSystemId && systemsQuery.data && !searchResults) {
      const selectedSystem = systemsQuery.data.find((system) => system.id === urlSystemId)

      if (selectedSystem) {
        const igdbPlatformId = getIGDBPlatformId(selectedSystem)
        void handleSearch(urlQuery, igdbPlatformId, selectedSystem.id)
      }
    }
  }, [urlQuery, urlSystemId, systemsQuery.data, searchResults, handleSearch])

  const showGameCreatedConfirmation = useCallback(
    async (gameId: string) => {
      const confirmViewGame = await confirm({
        title: 'Game Added Successfully!',
        description: 'Would you like to add a handheld device listing or PC listing for this game?',
        confirmText: 'View Game',
      })

      if (!confirmViewGame) return
      router.push(`/games/${gameId}`)
    },
    [confirm, router],
  )

  const handleGamePreview = useCallback(
    (game: BaseGameResult) => {
      // The game from search results is already an IGDBGameResult
      const igdbGame = searchResults?.games.find((g) => g.id === game.id)
      if (igdbGame) {
        setSelectedGame(igdbGame)
        setIsModalOpen(true)
      }
    },
    [searchResults],
  )

  const handleGameSelect = useCallback(
    async (systemId: string) => {
      if (!selectedGame || !user) return

      setIsSelecting(true)
      try {
        const newGame = await createGame.mutateAsync({
          title: selectedGame.name,
          systemId,
          imageUrl: selectedGame.imageUrl ?? null,
          boxartUrl: selectedGame.boxartUrl ?? null,
          bannerUrl: selectedGame.bannerUrl ?? null,
          isErotic: selectedGame.isErotic ?? false,
          igdbGameId: Number(selectedGame.id),
        })

        // Invalidate the existing games cache to ensure the new game is reflected
        await utils.games.checkExistingByNamesAndSystems.invalidate()

        toast.success('Game added successfully!')
        await showGameCreatedConfirmation(newGame.id)
      } catch (error) {
        // Check if the game already exists and get the existing game ID
        const errorMessage = getErrorMessage(error, 'Failed to add game')

        // Check if this is a duplicate game error
        if (errorMessage.includes('already exists for the system')) {
          // Extract the existing game ID from the error if available
          const cause = (error as Error & { cause?: { existingGameId?: string } })?.cause
          if (cause?.existingGameId) {
            toast.info('Game already exists.')
            await showGameCreatedConfirmation(cause.existingGameId)
          } else {
            // Show error if ID is unavailable
            toast.error(errorMessage)
          }
        } else {
          toast.error(errorMessage)
        }
      } finally {
        setIsSelecting(false)
      }
    },
    [selectedGame, user, createGame, utils, showGameCreatedConfirmation],
  )

  const isModeratorOrHigher = useMemo(() => {
    return userQuery.data ? hasRolePermission(userQuery.data.role, Role.MODERATOR) : false
  }, [userQuery.data])

  const isAdmin = useMemo(() => {
    return userQuery.data ? hasRolePermission(userQuery.data.role, Role.ADMIN) : false
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
        provider="igdb"
        showBackButton={isAdmin}
        showAlternativeSearch={isAdmin}
        isAdmin={isAdmin}
      />

      <GameSearchForm
        provider="igdb"
        onSearch={handleSearch}
        systems={systemsQuery.data ?? []}
        initialQuery={urlQuery}
        initialSystemId={urlSystemId}
        isSearching={isSearching}
        showModeratorFeatures={isModeratorOrHigher}
      />

      {searchResults && !urlSystemId && (
        <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 dark:text-amber-200">System Required</h3>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Please select a system from the dropdown above before searching for games. Games
                must be associated with a specific system to be added to the database.
              </p>
            </div>
          </div>
        </div>
      )}

      {searchResults && urlSystemId && (
        <GameSearchResults<IGDBGameResult>
          provider="igdb"
          results={searchResults}
          onGameSelect={handleGamePreview}
          existingGames={existingGamesQuery.data ?? {}}
          currentSystemId={urlSystemId}
        />
      )}

      <IGDBGamePreviewModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleGameSelect}
        systems={systemsQuery.data ?? []}
        isSelecting={isSelecting}
        existingGames={existingGamesQuery.data ?? {}}
        currentSystemId={urlSystemId}
      />
    </div>
  )
}

export default function IGDBSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <IGDBSearchContent />
    </Suspense>
  )
}
