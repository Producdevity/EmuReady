'use client'

import { useUser } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import { notFound, useParams, useRouter } from 'next/navigation'
import { Badge, Button, LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { hasPermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
import { GameBoxartImage } from './components/GameBoxartImage'
import { GameEditForm } from './components/GameEditForm'
import { GameListingsSection } from './components/GameListingsSection'
import { GamePcListingsSection } from './components/GamePcListingsSection'

function GameDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()

  const gameQuery = api.games.byId.useQuery({ id: params.id as string })

  const userQuery = api.users.me.useQuery(undefined, { enabled: !!user })

  const isOwnerOfPendingGame =
    userQuery.data &&
    gameQuery.data &&
    gameQuery.data.submittedBy === userQuery.data.id &&
    gameQuery.data.status === ApprovalStatus.PENDING

  const canEdit = hasPermission(userQuery.data?.role, Role.MODERATOR) || isOwnerOfPendingGame

  if (gameQuery.isPending) return <LoadingSpinner text="Loading game data..." />

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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                    {gameQuery.data.title}
                    {gameQuery.data.isErotic && (
                      <Badge variant="danger" size="sm">
                        18+
                      </Badge>
                    )}
                  </h1>
                  <div className="mt-2">
                    <Badge variant="default">System: {gameQuery.data.system?.name}</Badge>
                  </div>
                  <div className="mt-2">
                    <Badge variant="default">
                      Submitted by: {gameQuery.data.submitter?.name || 'Anonymous'}
                    </Badge>
                  </div>
                </div>
                <div className="flex">{canEdit && <GameEditForm gameData={gameQuery.data} />}</div>
              </div>
            </div>
          </div>
        </div>

        <GameListingsSection
          gameId={gameQuery.data.id}
          listings={gameQuery.data?.listings}
          hasPermission={hasPermission(userQuery.data?.role, Role.ADMIN)}
          userRole={userQuery.data?.role}
        />

        <div className="mt-8">
          <GamePcListingsSection
            gameId={gameQuery.data.id}
            pcListings={gameQuery.data?.pcListings}
            hasPermission={hasPermission(userQuery.data?.role, Role.ADMIN)}
            userRole={userQuery.data?.role}
          />
        </div>
      </div>
    </main>
  )
}

export default GameDetailsPage
