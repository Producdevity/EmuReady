'use client'

import { Role } from '@orm'
import { useUser } from '@clerk/nextjs'
import { useState, type SyntheticEvent, type ChangeEvent } from 'react'
import Link from 'next/link'
import { Pagination, LoadingSpinner, Button } from '@/components/ui'
import { api } from '@/lib/api'
import GameFilters from './components/GameFilters'
import GameCard from './components/GameCard'
import { hasPermission } from '@/utils/permissions'

function GamesPage() {
  const { user } = useUser()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [systemId, setSystemId] = useState('')
  const limit = 12

  const systemsQuery = api.systems.get.useQuery()

  const gamesQuery = api.games.get.useQuery({
    search: search || undefined,
    systemId: systemId || undefined,
    limit,
    offset: (page - 1) * limit,
  })

  const games = gamesQuery.data?.games ?? []
  const pagination = gamesQuery.data?.pagination

  const handleSearchChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearch(ev.target.value)
    setPage(1)
  }

  const handleSystemChange = (ev: SyntheticEvent) => {
    setSystemId((ev as unknown as ChangeEvent<HTMLSelectElement>).target.value)
    setPage(1)
  }

  // Get user role from Clerk's publicMetadata
  const userRole = user?.publicMetadata?.role as Role | undefined

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Games Library
        </h1>
        {userRole && hasPermission(userRole, Role.ADMIN) && (
          <Button asChild variant="fancy" className="hidden md:inline-flex">
            <Link href="/games/new">Add Game</Link>
          </Button>
        )}
      </div>
      <div className="max-w-7xl mx-auto">
        <GameFilters
          search={search}
          systemId={systemId}
          systems={systemsQuery.data}
          onSearchChange={handleSearchChange}
          onSystemChange={handleSystemChange}
        />

        {gamesQuery.isLoading ? (
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

        {/* Pagination */}
        {pagination?.pages && pagination.pages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}

        <div className="mt-12 text-center">
          <Link
            href="/games/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-lg shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
          >
            Add New Game
          </Link>
        </div>
      </div>
    </main>
  )
}

export default GamesPage
