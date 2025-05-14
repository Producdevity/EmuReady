'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge, Input, Pagination, LoadingSpinner } from '@/components/ui'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import type { ChangeEvent } from 'react'

// Search and filter component for games
const GameFilters = ({
  search,
  systemId,
  systems,
  onSearchChange,
  onSystemChange,
}: {
  search: string
  systemId: string
  systems: Array<{ id: string; name: string }> | undefined
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSystemChange: (e: React.SyntheticEvent) => void
}) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-8">
    <div className="flex-1">
      <Input
        leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
        type="text"
        placeholder="Search games..."
        value={search}
        onChange={onSearchChange}
      />
    </div>
    <div className="w-full sm:w-64">
      <Input
        as="select"
        value={systemId}
        onChange={onSystemChange}
        className="mb-0"
      >
        <option value="">All Systems</option>
        {systems?.map((system) => (
          <option key={system.id} value={system.id}>
            {system.name}
          </option>
        ))}
      </Input>
    </div>
  </div>
)

// Game card component
const GameCard = ({
  game,
}: {
  game: {
    id: string
    title: string
    system?: { name: string } | null
    _count: { listings: number }
  }
}) => (
  <Link
    key={game.id}
    href={`/games/${game.id}`}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
  >
    <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
      <Image
        src={`https://placehold.co/400x300/9ca3af/1e293b?text=${encodeURIComponent(game.title.substring(0, 15))}`}
        alt={game.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false}
      />
    </div>
    <div className="p-6">
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white truncate">
        {game.title}
      </h2>
      <div className="flex items-center justify-between">
        <Badge variant="default">{game.system?.name ?? 'Unknown System'}</Badge>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {game._count.listings}{' '}
          {game._count.listings === 1 ? 'listing' : 'listings'}
        </span>
      </div>
    </div>
  </Link>
)

export default function GamesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [systemId, setSystemId] = useState('')
  const limit = 12

  // Fetch systems for filter dropdown
  const { data: systems } = api.systems.list.useQuery()

  // Fetch games with pagination and search
  const { data, isLoading } = api.games.list.useQuery({
    search: search || undefined,
    systemId: systemId || undefined,
    limit,
    offset: (page - 1) * limit,
  })

  const games = data?.games ?? []
  const pagination = data?.pagination

  // Handle search changes
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  // Handle system filter changes
  const handleSystemChange = (e: React.SyntheticEvent) => {
    setSystemId((e as unknown as ChangeEvent<HTMLSelectElement>).target.value)
    setPage(1)
  }

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
          Games Library
        </h1>

        {/* Search and filters */}
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
