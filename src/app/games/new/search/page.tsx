'use client'

import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import GamePreviewModal from './components/GamePreviewModal'
import SearchForm from './components/SearchForm'
import SearchHeader from './components/SearchHeader'
import SearchResults from './components/SearchResults'
import NotSignedInMessage from '../components/NotSignedInMessage'
import type { TGDBGame, TGDBGamesByNameResponse } from '@/types/tgdb'

function GameSearchPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [searchResults, setSearchResults] =
    useState<TGDBGamesByNameResponse | null>(null)
  const [selectedGame, setSelectedGame] = useState<TGDBGame | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const utils = api.useUtils()
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })
  const createGame = api.games.create.useMutation()
  const systemsQuery = api.systems.get.useQuery()

  // Check for existing games by TGDB IDs
  const tgdbGameIds = useMemo(() => {
    if (!searchResults?.data?.games) return []
    return Object.values(searchResults.data.games).map((game) => game.id)
  }, [searchResults])

  const existingGamesQuery = api.games.checkExistingByTgdbIds.useQuery(
    { tgdbGameIds },
    {
      enabled: tgdbGameIds.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  )

  const handleSearch = useCallback(
    async (query: string, platformId?: number) => {
      setIsSearching(true)
      try {
        const results = await utils.tgdb.searchGames.fetch({
          query,
          tgdbPlatformId: platformId,
        })
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        toast.error(getErrorMessage(error, 'Failed to search games'))
      } finally {
        setIsSearching(false)
      }
    },
    [utils],
  )

  const handlePreview = useCallback((game: TGDBGame) => {
    setSelectedGame(game)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedGame(null)
  }, [])

  const handleSelectGame = useCallback(
    async (game: TGDBGame) => {
      if (!userQuery.data || !systemsQuery.data) {
        toast.error('Please sign in to add games')
        return
      }

      setIsSelecting(true)

      try {
        // Get platform name from search results
        const platforms = searchResults?.include?.platform?.data
          ? Object.values(searchResults.include.platform.data).filter(
              (platform) => platform.id === game.platform,
            )
          : []

        const platformName =
          platforms.length > 0 ? platforms[0].name : undefined

        // Find matching system
        const matchingSystem = systemsQuery.data.find(
          (system) =>
            system.name === platformName ||
            (system.tgdbPlatformId && system.tgdbPlatformId === game.platform),
        )

        if (!matchingSystem) {
          const errorMsg = platformName
            ? `System "${platformName}" not found in database`
            : `No matching system found for TGDB platform ID ${game.platform}`
          toast.error(errorMsg)
          return
        }

        // Get both boxart and banner images for the selected game
        let imageResponse:
          | { boxartUrl?: string; bannerUrl?: string }
          | undefined

        try {
          imageResponse = await utils.tgdb.getGameImageUrls.fetch({
            gameId: game.id,
          })
        } catch (imageError) {
          console.error('❌ Failed to fetch game images:', imageError)
          // Continue without images
        }

        // Create the game
        const isAdmin = hasPermission(userQuery.data.role, Role.ADMIN)
        const gameData = {
          title: game.game_title,
          systemId: matchingSystem.id,
          imageUrl: imageResponse?.boxartUrl, // Use boxartUrl as the primary image
          boxartUrl: imageResponse?.boxartUrl,
          bannerUrl: imageResponse?.bannerUrl,
          tgdbGameId: game.id, // Store the TGDB game ID
        }

        const newGame = await createGame.mutateAsync(gameData)

        // Show success message and redirect
        if (isAdmin) {
          toast.success('Game added successfully!')
        } else {
          toast.success(
            'Game submitted for approval! You can now create listings for this game.',
            { duration: 4000 },
          )
          router.push(`/games/${newGame.id}`)
        }

        // Close modal if open
        setIsModalOpen(false)
        setSelectedGame(null)
      } catch (error) {
        console.error('Error adding game:', error)

        // Handle duplicate game error with user-friendly message
        const errorMessage = getErrorMessage(error, 'Failed to add game')

        // Check for duplicate game error by message content
        if (errorMessage.includes('already exists')) {
          // Try to extract cause information if it exists
          if (
            error &&
            typeof error === 'object' &&
            'cause' in error &&
            error.cause &&
            typeof error.cause === 'object'
          ) {
            const cause = error.cause as Record<string, unknown>
            if (
              cause.existingGameId &&
              cause.existingGameTitle &&
              cause.systemName
            ) {
              toast.error(
                `Game already exists: "${cause.existingGameTitle}" on ${cause.systemName}`,
                {
                  duration: 10000,
                  action: {
                    label: 'View Game',
                    onClick: () =>
                      router.push(`/games/${cause.existingGameId}`),
                  },
                },
              )
              return
            }
          }

          // Fallback for duplicate errors without cause info
          toast.error(errorMessage, { duration: 8000 })
          return
        }

        // Handle all other errors
        toast.error(errorMessage)
      } finally {
        setIsSelecting(false)
      }
    },
    [
      userQuery.data,
      searchResults,
      createGame,
      utils,
      router,
      systemsQuery.data,
    ],
  )

  if (!isLoaded || userQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || !userQuery.data) return <NotSignedInMessage />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchHeader />

        <SearchForm onSearch={handleSearch} isSearching={isSearching} />

        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-12"
          >
            <LoadingSpinner text="Searching TheGamesDB..." />
          </motion.div>
        )}

        <SearchResults
          searchResults={searchResults}
          onPreview={handlePreview}
          onSelect={handleSelectGame}
          isSelecting={isSelecting}
          existingGames={existingGamesQuery.data ?? {}}
        />

        <GamePreviewModal
          game={selectedGame}
          searchResponse={searchResults}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSelect={handleSelectGame}
          isSelecting={isSelecting}
        />
      </div>
    </div>
  )
}

export default GameSearchPage
