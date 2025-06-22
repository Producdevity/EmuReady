'use client'

import { useUser } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { Badge, Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { hasPermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
import { GameBoxartImage } from './components/GameBoxartImage'
import { GameEditForm } from './components/GameEditForm'
import { GameListingsSection } from './components/GameListingsSection'

function GameDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()

  const gameQuery = api.games.byId.useQuery({ id: params.id as string })

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

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
        <div className="mb-4 md:mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <GameBoxartImage game={gameQuery.data} />
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
                  <div className="mt-2">
                    <Badge variant="default">
                      Submitted by:{' '}
                      {gameQuery.data.submitter?.name || 'Anonymous'}
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

        <GameListingsSection
          gameId={gameQuery.data.id}
          listings={gameQuery.data?.listings}
          isAdmin={hasPermission(userQuery.data?.role, Role.ADMIN)}
        />
      </div>
    </main>
  )
}

export default GameDetailsPage
