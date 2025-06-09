'use client'

import { useState } from 'react'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import {
  LoadingSpinner,
  Button,
  Input,
  ApprovalStatusBadge,
  Pagination,
  SortableHeader,
  AdminTableContainer,
} from '@/components/ui'
import GameDetailsModal from './components/GameDetailsModal'
import ConfirmationModal from './components/ConfirmationModal'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { ApprovalStatus } from '@orm'
import { formatDate } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import { type Nullable } from '@/types/utils'
import useAdminTable from '@/hooks/useAdminTable'

export type ProcessingAction = 'approve' | 'reject'
type GameSortField = 'title' | 'submittedAt' | 'system.name'

interface ConfirmationModalState {
  isOpen: boolean
  gameId: string | null
  action: Nullable<ProcessingAction>
  gameTitle: string
}

function GameApprovalsPage() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [processingAction, setProcessingAction] =
    useState<Nullable<ProcessingAction>>(null)
  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>({
      isOpen: false,
      gameId: null,
      action: null,
      gameTitle: '',
    })

  const table = useAdminTable<GameSortField>({
    defaultLimit: 20,
    defaultSortField: 'submittedAt',
    defaultSortDirection: 'desc',
  })

  const {
    data: pendingGamesData,
    isLoading,
    refetch,
  } = api.games.getPendingGames.useQuery({
    limit: table.limit,
    page: table.page,
    sortField: table.sortField ?? 'submittedAt',
    sortDirection: table.sortDirection ?? 'desc',
  })

  // Query for game stats
  const { data: gameStats } = api.games.getGameStats.useQuery()

  // Mutation for approving/rejecting games
  const approveGameMutation = api.games.approveGame.useMutation({
    onSuccess: (data) => {
      toast.success(`Game ${data.status.toLowerCase()} successfully!`)
      refetch().catch(console.error)
      setIsModalOpen(false)
      setSelectedGameId(null)
      setProcessingAction(null)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to process game'))
      setProcessingAction(null)
    },
  })

  const showConfirmation = (gameId: string, action: ProcessingAction) => {
    const game = pendingGamesData?.games.find((g) => g.id === gameId)
    if (game) {
      setConfirmationModal({
        isOpen: true,
        gameId,
        action,
        gameTitle: game.title,
      })
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmationModal.gameId || !confirmationModal.action) return

    setProcessingAction(confirmationModal.action)
    setConfirmationModal({
      isOpen: false,
      gameId: null,
      action: null,
      gameTitle: '',
    })

    try {
      await approveGameMutation.mutateAsync({
        id: confirmationModal.gameId,
        status:
          confirmationModal.action === 'approve'
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.REJECTED,
      })
    } catch (error) {
      // Error handling is done in onError callback
      console.error('Error processing game approval/rejection:', error)
    }
  }

  const openGameModal = (gameId: string) => {
    setSelectedGameId(gameId)
    setIsModalOpen(true)
  }

  const selectedGame = selectedGameId
    ? (pendingGamesData?.games.find((game) => game.id === selectedGameId) ??
      null)
    : null

  const filteredGames = pendingGamesData?.games ?? []

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Game Approvals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve submitted games
          </p>
        </div>

        {gameStats && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {gameStats.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {gameStats.approved}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Approved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {gameStats.rejected}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Rejected
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search games, systems, or submitters..."
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-full"
              onClick={() => {
                table.setSearch('')
                table.setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Games Table */}
      <AdminTableContainer>
        {filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search
                ? 'No games found matching your search.'
                : 'No pending games to review.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <SortableHeader
                      label="Game Title"
                      field="title"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                    <SortableHeader
                      label="System"
                      field="system.name"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitter
                    </th>
                    <SortableHeader
                      label="Submitted"
                      field="submittedAt"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGames.map((game) => (
                    <tr
                      key={game.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <Link
                              href={`/games/${game.id}`}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {game.title}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {game.system.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {game.submitter?.name ?? 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(game.submittedAt!)}
                      </td>
                      <td className="px-6 py-4">
                        <ApprovalStatusBadge status={game.status} type="game" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-700/20"
                            onClick={() => showConfirmation(game.id, 'approve')}
                            disabled={
                              processingAction === 'approve' &&
                              selectedGameId === game.id
                            }
                            isLoading={
                              processingAction === 'approve' &&
                              selectedGameId === game.id
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20"
                            onClick={() => showConfirmation(game.id, 'reject')}
                            disabled={
                              processingAction === 'reject' &&
                              selectedGameId === game.id
                            }
                            isLoading={
                              processingAction === 'reject' &&
                              selectedGameId === game.id
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 p-1.5 inline-flex items-center"
                            onClick={() => openGameModal(game.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pendingGamesData && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={table.page}
                  totalPages={pendingGamesData.pagination.pages}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </AdminTableContainer>

      {/* Game Details Modal */}
      <GameDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGameId(null)
        }}
        selectedGame={selectedGame}
        onShowConfirmation={showConfirmation}
        isProcessing={approveGameMutation.isPending}
        processingAction={processingAction}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({
            isOpen: false,
            gameId: null,
            action: null,
            gameTitle: '',
          })
        }
        action={confirmationModal.action}
        gameTitle={confirmationModal.gameTitle}
        onConfirm={handleConfirmAction}
        isProcessing={approveGameMutation.isPending}
      />
    </div>
  )
}

export default GameApprovalsPage
