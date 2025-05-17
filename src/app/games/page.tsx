'use client'

import { useState, type SyntheticEvent } from 'react'
import Link from 'next/link'
import { Pagination, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import type { ChangeEvent } from 'react'
import GameFilters from './components/GameFilters'
import GameCard from './components/GameCard'

function GamesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [systemId, setSystemId] = useState('')
  const limit = 12

  const { data: systems } = api.systems.list.useQuery()

  const { data, isLoading } = api.games.list.useQuery({
    search: search || undefined,
    systemId: systemId || undefined,
    limit,
    offset: (page - 1) * limit,
  })

  const games = data?.games ?? []
  const pagination = data?.pagination

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleSystemChange = (e: SyntheticEvent) => {
    setSystemId((e as unknown as ChangeEvent<HTMLSelectElement>).target.value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
          Games Library
        </h1>

        <GameFilters
          search={search}
          systemId={systemId}
          systems={systems}
          onSearchChange={handleSearchChange}
          onSystemChange={handleSystemChange}
        />

        {isLoading ? (
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
            onPageChange={handlePageChange}
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
