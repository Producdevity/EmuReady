'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AdminErrorState } from '@/components/admin/AdminErrorState'
import { Button, PageSkeletonLoading } from '@/components/ui'
import { api } from '@/lib/api'
import { isTRPCNotFoundError } from '@/lib/trpc-client-errors'
import { GameEditForm } from './components/GameEditForm'
import { GameRelatedData } from './components/GameRelatedData'

interface Props {
  gameId: string
}

export default function AdminGameEditClientPage(props: Props) {
  const gameQuery = api.games.byId.useQuery({ id: props.gameId })

  if (gameQuery.isPending) return <PageSkeletonLoading />

  if (gameQuery.error) {
    const isNotFound = isTRPCNotFoundError(gameQuery.error)
    return (
      <AdminErrorState
        title={isNotFound ? 'Game not found' : 'Unable to load game'}
        message={
          isNotFound
            ? 'The game you are trying to edit was not found or is no longer available.'
            : 'The game data could not be loaded. Please try again.'
        }
        onRetry={() => void gameQuery.refetch()}
      />
    )
  }

  if (!gameQuery.data) {
    return (
      <AdminErrorState
        title="Game not found"
        message="The game you are trying to edit was not found or is no longer available."
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/games">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Game: {gameQuery.data.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Game Details
            </h2>
            <GameEditForm game={gameQuery.data} />
          </div>

          <GameRelatedData game={gameQuery.data} />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/games/${gameQuery.data.id}`} target="_blank">
                  View Public Page
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/listings/new?gameId=${gameQuery.data.id}`}>
                  Add New Handheld Report
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Compatible Emulators
            </h3>
            {gameQuery.data.system.emulators.length > 0 ? (
              <ul className="space-y-2">
                {gameQuery.data.system.emulators.map((emulator) => (
                  <li key={emulator.id}>
                    <Link
                      href={`/admin/emulators/${emulator.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {emulator.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No emulators support this system yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
