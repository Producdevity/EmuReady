'use client'

import { useUser } from '@clerk/nextjs'
import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { ApprovalStatus, Role } from '@orm'
import { Badge, LoadingSpinner } from '@/components/ui'
import GameEditForm from './components/GameEditForm'
import GameBoxartImage from './components/GameBoxartImage'
import { hasPermission } from '@/utils/permissions'
import { api } from '@/lib/api'
import { ChevronLeft } from 'lucide-react'

function GameDetailsPage() {
  const params = useParams()
  const { user } = useUser()
  const gameQuery = api.games.byId.useQuery({ id: params.id as string })

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  // Check edit permissions
  const isAdmin = hasPermission(userQuery.data?.role, Role.ADMIN)
  const isOwnerOfPendingGame =
    userQuery.data &&
    gameQuery.data &&
    gameQuery.data.submittedBy === userQuery.data.id &&
    gameQuery.data.status === ApprovalStatus.PENDING

  const canEdit = isAdmin || isOwnerOfPendingGame

  if (gameQuery.isLoading) return <LoadingSpinner text="Loading game data..." />

  if (gameQuery.error || !gameQuery.data) notFound()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/games"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Games
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <GameBoxartImage
              boxartUrl={gameQuery.data.boxartUrl}
              imageUrl={gameQuery.data.imageUrl}
              title={gameQuery.data.title}
            />
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {gameQuery.data.title}
                  </h1>
                  <div className="mt-2">
                    <Badge variant="default">
                      System: {gameQuery.data.system?.name}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-3">
                  {canEdit && <GameEditForm gameData={gameQuery.data} />}
                  <Link
                    href={`/listings/new?gameId=${gameQuery.data.id}`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
                  >
                    Add Listing for this Game
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Compatibility Listings
          </h2>

          {gameQuery.data.listings && gameQuery.data.listings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Emulator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Comments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {gameQuery.data.listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-400">
                          <span className="inline-block">
                            {listing.device && listing.device.brand
                              ? `${listing.device.brand.name} ${listing.device.modelName}`
                              : 'Unknown device'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.emulator?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            listing.performance?.label === 'Perfect'
                              ? 'success'
                              : listing.performance?.label === 'Great'
                                ? 'info'
                                : listing.performance?.label === 'Playable'
                                  ? 'warning'
                                  : 'danger'
                          }
                        >
                          {listing.performance?.label || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing.author?.name ?? 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {listing._count.comments || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                No compatibility listings yet for this game.
              </p>
              <Link
                href={`/listings/new?gameId=${gameQuery.data.id}`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200 text-sm font-medium"
              >
                Be the first to add a listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default GameDetailsPage
