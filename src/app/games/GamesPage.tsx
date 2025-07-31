'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  type ChangeEvent,
} from 'react'
import { isDefined } from 'remeda'
import { Pagination, LoadingSpinner, Button } from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { filterNullAndEmpty } from '@/utils/filter'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import GameCard from './components/GameCard'
import GameFilters from './components/GameFilters'

function GamesContent() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get initial values from URL
  const getInitialSearch = () => {
    const urlSearch = searchParams.get('search')
    return urlSearch && urlSearch !== 'undefined' ? urlSearch : ''
  }

  const getInitialSystemId = () => {
    const urlSystemId = searchParams.get('systemId')
    return urlSystemId && urlSystemId !== 'undefined' ? urlSystemId : ''
  }

  const getInitialPage = () => {
    const urlPage = searchParams.get('page')
    const pageNum = urlPage ? parseInt(urlPage, 10) : 1
    return !isNaN(pageNum) && pageNum > 0 ? pageNum : 1
  }

  const getInitialHideGames = () => {
    const urlHideGames = searchParams.get('hideNoListings')
    return urlHideGames !== null ? urlHideGames === 'true' : true
  }

  const getInitialListingFilter = () => {
    const urlFilter = searchParams.get('listingFilter') as
      | 'all'
      | 'withListings'
      | 'noListings'
      | null
    if (
      urlFilter &&
      ['all', 'withListings', 'noListings'].includes(urlFilter)
    ) {
      return urlFilter
    }
    // Default based on old hideNoListings parameter
    return getInitialHideGames() ? 'withListings' : 'all'
  }

  // Get values from URL
  const page = getInitialPage()
  const systemId = getInitialSystemId()
  const hideGamesWithNoListings = getInitialHideGames()
  const listingFilter = getInitialListingFilter()

  // Only input value needs a local state for debouncing
  const [inputValue, setInputValue] = useState(() => getInitialSearch())
  const debouncedSearch = useDebouncedValue(inputValue, 500)
  const limit = 12

  // Update URL params whenever the state changes
  const updateUrlParams = useCallback(
    (
      updates: {
        search?: string
        systemId?: string
        page?: number
        hideNoListings?: boolean
        listingFilter?: 'all' | 'withListings' | 'noListings'
      },
      opts: { push?: boolean } = { push: false },
    ) => {
      const params = new URLSearchParams(searchParams.toString())

      // Helper to set or delete params based on default values
      const setParam = (
        key: string,
        value: string | undefined,
        defaultValue: string,
      ) => {
        if (value === defaultValue || !value) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }

      // Apply updates
      if (updates.search !== undefined) {
        setParam('search', updates.search.trim(), '')
      }
      if (updates.systemId !== undefined) {
        setParam('systemId', updates.systemId, '')
      }
      if (updates.page !== undefined) {
        setParam('page', updates.page.toString(), '1')
      }
      if (updates.hideNoListings !== undefined) {
        setParam('hideNoListings', updates.hideNoListings.toString(), 'true')
      }
      if (updates.listingFilter !== undefined) {
        setParam('listingFilter', updates.listingFilter, 'withListings')
      }

      const newUrl = `${pathname}?${params.toString()}`
      return opts.push
        ? router.push(newUrl, { scroll: false })
        : router.replace(newUrl, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })
  const systemsQuery = api.systems.get.useQuery()

  const gamesQuery = api.games.get.useQuery(
    filterNullAndEmpty({
      search: debouncedSearch.trim() || undefined,
      systemId: systemId || undefined,
      hideGamesWithNoListings,
      listingFilter,
      limit,
      offset: (page - 1) * limit,
    }),
  )

  const games = gamesQuery.data?.games ?? []
  const pagination = gamesQuery.data?.pagination

  // Track previous search to detect changes
  const previousSearchRef = useRef(debouncedSearch)

  // Update URL when debounced search changes
  useEffect(() => {
    // Only update if search actually changed and it's different from URL
    const currentUrlSearch = searchParams.get('search') || ''
    if (
      previousSearchRef.current !== debouncedSearch &&
      debouncedSearch !== currentUrlSearch
    ) {
      previousSearchRef.current = debouncedSearch
      updateUrlParams({ search: debouncedSearch, page: 1 })
    }
  }, [debouncedSearch, updateUrlParams, searchParams])

  // Sync input value with URL when URL changes (browser navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (inputValue !== urlSearch && debouncedSearch !== urlSearch) {
      setInputValue(urlSearch)
    }
  }, [searchParams, inputValue, debouncedSearch])

  const handleSearchChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const newInputValue = ev.target.value
    setInputValue(newInputValue)
  }

  const handleSystemChange = (value: string | null) => {
    const newSystemId = value || ''
    updateUrlParams({ systemId: newSystemId, page: 1 }, { push: true })
  }

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage }, { push: true })
  }

  const handleHideGamesWithNoListingsChange = (hide: boolean) => {
    updateUrlParams({ hideNoListings: hide, page: 1 }, { push: true })
  }

  const handleListingFilterChange = (
    filter: 'all' | 'withListings' | 'noListings',
  ) => {
    updateUrlParams(
      {
        listingFilter: filter,
        hideNoListings: filter === 'withListings',
        page: 1,
      },
      { push: true },
    )
  }

  // Moderators can add games manually, others use search
  const addGameHref = hasPermission(userQuery.data?.role, Role.MODERATOR)
    ? '/games/new'
    : '/games/new/search'

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Games Library
        </h1>
        {user && (
          <Button asChild variant="fancy" className="hidden md:inline-flex">
            <Link href={addGameHref}>Add Game</Link>
          </Button>
        )}
      </div>
      <div className="max-w-7xl mx-auto">
        <GameFilters
          search={inputValue}
          systemId={systemId}
          hideGamesWithNoListings={hideGamesWithNoListings}
          listingFilter={listingFilter}
          systems={systemsQuery.data}
          onSearchChange={handleSearchChange}
          onSystemChange={handleSystemChange}
          onHideGamesWithNoListingsChange={handleHideGamesWithNoListingsChange}
          onListingFilterChange={handleListingFilterChange}
        />

        {gamesQuery.isPending ? (
          <LoadingSpinner text="Loading games..." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {games.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500 dark:text-gray-400">
                  No games found matching your criteria.
                </p>
              </div>
            )}
          </>
        )}

        {isDefined(pagination?.pages) && pagination.pages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
          />
        )}

        {user && (
          <div className="mt-12 text-center">
            <Link
              href={addGameHref}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-lg shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
            >
              Add a Game
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-96">
          <LoadingSpinner />
        </div>
      }
    >
      <GamesContent />
    </Suspense>
  )
}
