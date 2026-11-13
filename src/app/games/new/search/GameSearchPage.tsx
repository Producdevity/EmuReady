'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import {
  GameSearchForm,
  GameSearchResults,
  GameSearchHeader,
  type BaseGameResult,
} from '@/components/game-search'
import { LoadingSpinner } from '@/components/ui'
import { useSubmitWithHumanVerification } from '@/features/human-verification/client'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import GamePreviewModal from './components/GamePreviewModal'
import { useGameSearch } from './hooks/useGameSearch'
import { extractBoxartUrl } from './utils/boxartHelpers'
import { handleGameCreationError } from './utils/gameCreationErrors'
import NotSignedInMessage from '../components/NotSignedInMessage'
import type { TGDBGame } from '@/types/tgdb'

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
  const { user, isLoaded } = useUser()

  const urlQuery = searchParams.get('q') ?? ''
  const urlSystemId = searchParams.get('system') ?? ''

  const [submittedSearch, setSubmittedSearch] = useState<{
    urlKey: string
    systemId: string | null
    input: RouterInput['tgdb']['searchGames']
  } | null>(null)
  const urlKey = JSON.stringify([urlQuery, urlSystemId || null])
  const [previousUrlKey, setPreviousUrlKey] = useState(urlKey)
  if (previousUrlKey !== urlKey) {
    setPreviousUrlKey(urlKey)
    if (submittedSearch?.urlKey !== urlKey) setSubmittedSearch(null)
  }
  const [selectedGame, setSelectedGame] = useState<TGDBGameWithBoxart | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })
  const createGame = api.games.create.useMutation()
  const submitWithHumanVerification = useSubmitWithHumanVerification()
  const systemsQuery = api.systems.get.useQuery()

  const selectedSystem = systemsQuery.data?.find((system) => system.id === urlSystemId)
  const searchInput =
    submittedSearch?.input ??
    (urlQuery && selectedSystem ? { query: urlQuery, systemKey: selectedSystem.key } : null)
  const searchQuery = api.tgdb.searchGames.useQuery(searchInput ?? { query: '' }, {
    enabled: Boolean(user && searchInput),
    refetchOnWindowFocus: false,
    retry: false,
  })
  const searchResponse = searchQuery.data ?? null
  const searchResults = useMemo(() => {
    if (!searchResponse) return null
    return {
      games: (searchResponse.data?.games ?? []).map((game) => {
        const enrichedGame: TGDBGameWithBoxart = {
          ...game,
          boxart: extractBoxartUrl(game, searchResponse) || undefined,
          platform_name: typeof game.platform === 'string' ? game.platform : undefined,
          genre_names:
            Array.isArray(game.genres) && typeof game.genres[0] === 'string'
              ? game.genres.map(String)
              : undefined,
        }
        return mapTGDBToBaseGame(enrichedGame)
      }),
      count: searchResponse.data?.count ?? 0,
    }
  }, [searchResponse])
  const currentSystemId = submittedSearch?.systemId ?? urlSystemId
  const { existingGames, updateSearchParams } = useGameSearch({
    searchResults,
    urlSystemId: currentSystemId,
  })

  function handleSearch(query: string, _platformId: number | null, systemId: string | null) {
    const system = systemsQuery.data?.find((item) => item.id === systemId)
    const input = { query, systemKey: system?.key }
    setSubmittedSearch({ urlKey: JSON.stringify([query, systemId]), systemId, input })
    updateSearchParams(query, systemId)
    if (searchInput?.query === query && searchInput.systemKey === input.systemKey) {
      void searchQuery.refetch()
    }
  }

  useEffect(() => {
    if (!searchQuery.error) return
    logger.error('Search error:', searchQuery.error)
    toast.error(getErrorMessage(searchQuery.error, 'Failed to search games'))
  }, [searchQuery.error])

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
        const newGame = await submitWithHumanVerification((humanVerificationToken) =>
          createGame.mutateAsync({
            title: game.game_title,
            systemId,
            imageUrl: game.boxart ?? null,
            boxartUrl: game.boxart ?? null,
            bannerUrl: null,
            isErotic: false,
            tgdbGameId: game.id,
            humanVerificationToken,
          }),
        )

        // Invalidate the existing games cache to ensure the new game is reflected
        await utils.games.checkExistingByNamesAndSystems.invalidate()

        toast.success('Game added successfully!')
        router.push(`/listings/new?gameId=${newGame.id}`)
      } catch (error) {
        const result = handleGameCreationError(error)
        if (result.type === 'duplicate') {
          router.push(`/listings/new?gameId=${result.existingGameId}`)
        }
      } finally {
        setIsSelecting(false)
      }
    },
    [user, submitWithHumanVerification, createGame, router, utils],
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
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <GameSearchHeader
          provider="tgdb"
          showBackButton={isAdmin}
          showAlternativeSearch={isAdmin}
          isAdmin={isAdmin}
        />

        <GameSearchForm
          key={urlKey}
          provider="tgdb"
          onSearch={handleSearch}
          systems={systemsQuery.data ?? []}
          initialQuery={urlQuery}
          initialSystemId={urlSystemId}
          isSearching={searchQuery.isFetching}
          showModeratorFeatures={isModeratorOrHigher}
        />

        {searchResults && (
          <GameSearchResults<TGDBGameResult>
            provider="tgdb"
            results={searchResults}
            onGameSelect={handleGamePreview}
            existingGames={existingGames}
            currentSystemId={currentSystemId}
          />
        )}

        <GamePreviewModal
          game={selectedGame}
          searchResponse={searchResponse}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={(game) => {
            const gameWithBoxart = { ...game, boxart: selectedGame?.boxart }
            handleGameSelect(gameWithBoxart, currentSystemId)
          }}
          isSelecting={isSelecting}
        />
      </div>
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
