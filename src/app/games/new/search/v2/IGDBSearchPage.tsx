'use client'

import { useUser } from '@clerk/nextjs'
import { AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect, useMemo, Suspense } from 'react'
import { toast } from 'sonner'
import {
  GameSearchForm,
  GameSearchResults,
  GameSearchHeader,
  type BaseGameResult,
} from '@/components/game-search'
import { LoadingSpinner, useConfirmDialog } from '@/components/ui'
import { useSubmitWithHumanVerification } from '@/features/human-verification/client'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasRolePermission } from '@/utils/permissions'
import { getIGDBPlatformId } from '@/utils/system-platform-mapping'
import { Role } from '@orm'
import NotSignedInMessage from '../../components/NotSignedInMessage'
import { useGameSearch } from '../hooks/useGameSearch'
import { handleGameCreationError } from '../utils/gameCreationErrors'
import IGDBGamePreviewModal from './components/IGDBGamePreviewModal'

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
  const { user, isLoaded } = useUser()

  // Get values directly from URL
  const urlQuery = searchParams.get('q') ?? ''
  const urlSystemId = searchParams.get('system') ?? ''

  const [submittedSearch, setSubmittedSearch] = useState<{
    urlKey: string
    systemId: string
    input: RouterInput['igdb']['searchGames']
  } | null>(null)
  const urlKey = JSON.stringify([urlQuery, urlSystemId || null])
  const [formKey, setFormKey] = useState(urlKey)
  const [previousUrlKey, setPreviousUrlKey] = useState(urlKey)
  if (previousUrlKey !== urlKey) {
    setPreviousUrlKey(urlKey)
    if (submittedSearch?.urlKey !== urlKey) {
      setSubmittedSearch(null)
      setFormKey(urlKey)
    }
  }
  const [selectedGame, setSelectedGame] = useState<IGDBGameResult | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })
  const createGame = api.games.create.useMutation()
  const submitWithHumanVerification = useSubmitWithHumanVerification()
  const systemsQuery = api.systems.get.useQuery()
  const confirm = useConfirmDialog()

  const selectedSystem = systemsQuery.data?.find((system) => system.id === urlSystemId)
  const searchInput =
    submittedSearch?.input ??
    (urlQuery && selectedSystem
      ? { query: urlQuery, platformId: getIGDBPlatformId(selectedSystem), limit: 20 }
      : null)
  const searchQuery = api.igdb.searchGames.useQuery(searchInput ?? { query: '', limit: 20 }, {
    enabled: Boolean(user && searchInput),
    refetchOnWindowFocus: false,
    retry: false,
  })
  const searchResults = useMemo(
    () =>
      searchQuery.data
        ? {
            games: searchQuery.data.games.map((game) => ({
              ...game,
              summary: game.summary ?? null,
            })),
            count: searchQuery.data.count,
          }
        : null,
    [searchQuery.data],
  )
  const currentSystemId = submittedSearch?.systemId ?? urlSystemId
  const { existingGames, updateSearchParams } = useGameSearch({
    searchResults,
    urlSystemId: currentSystemId,
  })

  function handleSearch(query: string, platformId: number | null, systemId: string | null) {
    if (!systemId) {
      toast.warning('Please select a system before searching for games')
      return
    }
    const input = { query, platformId, limit: 20 }
    setSubmittedSearch({ urlKey: JSON.stringify([query, systemId]), systemId, input })
    updateSearchParams(query, systemId)
    if (searchInput?.query === query && searchInput.platformId === platformId) {
      void searchQuery.refetch()
    }
  }

  useEffect(() => {
    if (!searchQuery.error) return
    logger.error('Search error:', searchQuery.error)
    toast.error(getErrorMessage(searchQuery.error, 'Failed to search games'))
  }, [searchQuery.error])

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
        const newGame = await submitWithHumanVerification((humanVerificationToken) =>
          createGame.mutateAsync({
            title: selectedGame.name,
            systemId,
            imageUrl: selectedGame.imageUrl ?? null,
            boxartUrl: selectedGame.boxartUrl ?? null,
            bannerUrl: selectedGame.bannerUrl ?? null,
            isErotic: selectedGame.isErotic ?? false,
            igdbGameId: Number(selectedGame.id),
            humanVerificationToken,
          }),
        )

        await utils.games.checkExistingByNamesAndSystems.invalidate()

        toast.success('Game added successfully!')
        await showGameCreatedConfirmation(newGame.id)
      } catch (error) {
        const result = handleGameCreationError(error)
        if (result.type === 'duplicate') {
          await showGameCreatedConfirmation(result.existingGameId)
        }
      } finally {
        setIsSelecting(false)
      }
    },
    [
      selectedGame,
      user,
      submitWithHumanVerification,
      createGame,
      utils,
      showGameCreatedConfirmation,
    ],
  )

  const isModeratorOrHigher = hasRolePermission(userQuery?.data?.role, Role.MODERATOR)
  const isAdmin = hasRolePermission(userQuery?.data?.role, Role.ADMIN)

  if (!isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return <NotSignedInMessage />

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <GameSearchHeader
          provider="igdb"
          showBackButton={isAdmin}
          showAlternativeSearch={isAdmin}
          isAdmin={isAdmin}
        />

        <GameSearchForm
          key={formKey}
          provider="igdb"
          onSearch={handleSearch}
          systems={systemsQuery.data ?? []}
          initialQuery={urlQuery}
          initialSystemId={urlSystemId}
          isSearching={searchQuery.isFetching}
          showModeratorFeatures={isModeratorOrHigher}
        />

        {searchResults && !currentSystemId && (
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

        {searchResults && currentSystemId && (
          <GameSearchResults<IGDBGameResult>
            provider="igdb"
            results={searchResults}
            onGameSelect={handleGamePreview}
            existingGames={existingGames}
            currentSystemId={currentSystemId}
          />
        )}

        <IGDBGamePreviewModal
          game={selectedGame}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleGameSelect}
          systems={systemsQuery.data ?? []}
          isSelecting={isSelecting}
          existingGames={existingGames}
          currentSystemId={currentSystemId}
        />
      </div>
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
