'use client'

import { CheckCircle, XCircle, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import ViewButton from '@/app/admin/components/table-buttons/ViewButton'
import SystemIcon from '@/components/icons/SystemIcon'
import {
  LoadingSpinner,
  Button,
  Input,
  ApprovalStatusBadge,
  Pagination,
  SortableHeader,
  AdminTableContainer,
  ColumnVisibilityControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  BulkActions,
} from '@/components/ui'
import DisplayToggleButton from '@/components/ui/DisplayToggleButton'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import useLocalStorage from '@/hooks/useLocalStorage'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type Nullable } from '@/types/utils'
import { formatDate } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { ApprovalStatus } from '@orm'
import ConfirmationModal from './components/ConfirmationModal'
import GameDetailsModal from './components/GameDetailsModal'

export type ProcessingAction = 'approve' | 'reject'
type GameSortField = 'title' | 'submittedAt' | 'system.name'

interface ConfirmationModalState {
  isOpen: boolean
  gameId: string | null
  action: Nullable<ProcessingAction>
  gameTitle: string
}

const GAME_APPROVALS_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'submitter', label: 'Submitter', defaultVisible: true },
  { key: 'submittedAt', label: 'Submitted', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function GameApprovalsPage() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [processingAction, setProcessingAction] =
    useState<Nullable<ProcessingAction>>(null)
  const [processingGameId, setProcessingGameId] = useState<string | null>(null)
  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>({
      isOpen: false,
      gameId: null,
      action: null,
      gameTitle: '',
    })

  // Bulk selection state
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([])

  const table = useAdminTable<GameSortField>({
    defaultLimit: 20,
    defaultSortField: 'submittedAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(GAME_APPROVALS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminGameApprovals,
  })

  const [showSystemIcons, setShowSystemIcons, isSystemIconsHydrated] =
    useLocalStorage(storageKeys.showSystemIcons, false)

  const pendingGamesQuery = api.games.getPendingGames.useQuery({
    limit: table.limit,
    page: table.page,
    sortField: table.sortField ?? 'submittedAt',
    sortDirection: table.sortDirection ?? 'desc',
    search: isEmpty(table.search) ? undefined : table.search,
  })

  // Query for game stats
  const { data: gameStats } = api.games.getStats.useQuery()

  // Mutation for approving/rejecting games
  const approveGameMutation = api.games.approveGame.useMutation({
    onSuccess: (data) => {
      toast.success(`Game ${data.status.toLowerCase()} successfully!`)
      pendingGamesQuery.refetch().catch(console.error)
      setIsModalOpen(false)
      setSelectedGameId(null)
      setProcessingAction(null)
      setProcessingGameId(null)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to process game'))
      setProcessingAction(null)
      setProcessingGameId(null)
    },
  })

  const bulkApproveGamesMutation = api.games.bulkApproveGames.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message)
      await pendingGamesQuery.refetch()
      setSelectedGameIds([])
    },
    onError: (err) => {
      console.error('Failed to bulk approve games:', err)
      toast.error(`Failed to bulk approve games: ${getErrorMessage(err)}`)
    },
  })

  const bulkRejectGamesMutation = api.games.bulkRejectGames.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message)
      await pendingGamesQuery.refetch()
      setSelectedGameIds([])
    },
    onError: (err) => {
      console.error('Failed to bulk reject games:', err)
      toast.error(`Failed to bulk reject games: ${getErrorMessage(err)}`)
    },
  })

  // Bulk selection handlers
  const handleSelectAllGames = (selected: boolean) => {
    if (selected) {
      setSelectedGameIds(filteredGames.map((g) => g.id))
    } else {
      setSelectedGameIds([])
    }
  }

  const handleSelectGame = (gameId: string, selected: boolean) => {
    if (selected) {
      setSelectedGameIds((prev) => [...prev, gameId])
    } else {
      setSelectedGameIds((prev) => prev.filter((id) => id !== gameId))
    }
  }

  const handleBulkApproveGames = async (ids: string[]) => {
    await bulkApproveGamesMutation.mutateAsync({ gameIds: ids })
  }

  const handleBulkRejectGames = async (ids: string[], notes?: string) => {
    await bulkRejectGamesMutation.mutateAsync({ gameIds: ids, notes })
  }

  const showConfirmation = (gameId: string, action: ProcessingAction) => {
    const game = pendingGamesQuery.data?.games.find((g) => g.id === gameId)
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
    setProcessingGameId(confirmationModal.gameId)
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
    ? (pendingGamesQuery.data?.games.find(
        (game) => game.id === selectedGameId,
      ) ?? null)
    : null

  const filteredGames = pendingGamesQuery.data?.games ?? []

  if (pendingGamesQuery.isLoading) return <LoadingSpinner />

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

        <div className="flex items-center gap-3">
          <DisplayToggleButton
            showLogos={showSystemIcons}
            onToggle={() => setShowSystemIcons(!showSystemIcons)}
            isHydrated={isSystemIconsHydrated}
            logoLabel="Show System Icons"
            nameLabel="Show System Names"
          />
          <ColumnVisibilityControl
            columns={GAME_APPROVALS_COLUMNS}
            columnVisibility={columnVisibility}
          />
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
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search games, systems, or submitters..."
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                className="w-full pl-10"
              />
            </div>
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

      {/* Bulk Actions */}
      {filteredGames.length > 0 && (
        <BulkActions
          selectedIds={selectedGameIds}
          totalCount={filteredGames.length}
          onSelectAll={handleSelectAllGames}
          onClearSelection={() => setSelectedGameIds([])}
          actions={{
            approve: {
              label: 'Approve Selected',
              onAction: handleBulkApproveGames,
            },
            reject: {
              label: 'Reject Selected',
              onAction: handleBulkRejectGames,
            },
          }}
        />
      )}

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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedGameIds.length === filteredGames.length &&
                          filteredGames.length > 0
                        }
                        onChange={(e) => handleSelectAllGames(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    {columnVisibility.isColumnVisible('game') && (
                      <SortableHeader
                        label="Game"
                        field="title"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('system') && (
                      <SortableHeader
                        label="System"
                        field="system.name"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('submitter') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Submitter
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('submittedAt') && (
                      <SortableHeader
                        label="Submitted"
                        field="submittedAt"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredGames.map((game) => (
                    <tr
                      key={game.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedGameIds.includes(game.id)}
                          onChange={(e) =>
                            handleSelectGame(game.id, e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                      </td>
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16 flex justify-center items-center">
                              <Image
                                src={getGameImageUrl(game)}
                                alt={game.title}
                                width={64}
                                height={64}
                                className="rounded-md object-cover m-h-16 w-auto"
                                unoptimized
                              />
                            </div>
                            <div className="ml-4">
                              {game.title.length > 30 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Link
                                        href={`/games/${game.id}`}
                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {game.title.substring(0, 30)}...
                                      </Link>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {game.title}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Link
                                  href={`/games/${game.id}`}
                                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {game.title}
                                </Link>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {game.id.substring(0, 20)}
                                    {game.id.length > 20 && '...'}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  ID: {game.id}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('system') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {isSystemIconsHydrated &&
                          showSystemIcons &&
                          game.system?.key ? (
                            <div className="flex items-center gap-2">
                              <SystemIcon
                                name={game.system.name}
                                systemKey={game.system.key}
                                size="md"
                              />
                              <span className="sr-only">
                                {game.system.name}
                              </span>
                            </div>
                          ) : (
                            game.system.name
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submitter') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {game.submitter?.name ?? 'Unknown'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submittedAt') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(game.submittedAt!)}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('status') && (
                        <td className="px-6 py-4">
                          <ApprovalStatusBadge status={game.status} />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-700/20"
                              onClick={() =>
                                showConfirmation(game.id, 'approve')
                              }
                              disabled={
                                processingAction === 'approve' &&
                                processingGameId === game.id
                              }
                              isLoading={
                                processingAction === 'approve' &&
                                processingGameId === game.id
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20"
                              onClick={() =>
                                showConfirmation(game.id, 'reject')
                              }
                              disabled={
                                processingAction === 'reject' &&
                                processingGameId === game.id
                              }
                              isLoading={
                                processingAction === 'reject' &&
                                processingGameId === game.id
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <ViewButton
                              onClick={() => openGameModal(game.id)}
                              title="View Details"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pendingGamesQuery.data && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={table.page}
                  totalPages={pendingGamesQuery.data.pagination.pages}
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
