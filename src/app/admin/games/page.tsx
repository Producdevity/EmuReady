'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { isEmpty, isNullish } from 'remeda'
import ImageIndicators from '@/app/admin/components/ImageIndicators'
import ImagePreviewModal from '@/app/admin/components/ImagePreviewModal'
import { useAdminTable } from '@/app/admin/hooks'
import { useAdminFilters } from '@/app/admin/hooks/useAdminFilters'
import { AdminPageLayout, AdminStatsDisplay, AdminTableContainer } from '@/components/admin'
import {
  ApprovalStatusBadge,
  ApproveButton,
  Badge,
  Button,
  DeleteButton,
  EditButton,
  Input,
  LoadingSpinner,
  Pagination,
  RejectButton,
  SelectInput,
  SortableHeader,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useConfirmDialog,
  ViewButton,
  LocalizedDate,
  ColumnVisibilityControl,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { type Nullable } from '@/types/utils'
import getErrorMessage from '@/utils/getErrorMessage'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { hasPermission, PERMISSIONS } from '@/utils/permission-system'
import { ApprovalStatus } from '@orm'

type Game = RouterOutput['games']['get']['games'][number]
type GameSortField = 'title' | 'system.name' | 'listingsCount' | 'submittedAt' | 'status'

const GAMES_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'listings', label: 'Listings', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'erotic', label: '18+', defaultVisible: false },
  { key: 'submitter', label: 'Submitter', defaultVisible: false },
  { key: 'submittedAt', label: 'Submitted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminGamesPage() {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [selectedGameForImagePreview, setSelectedGameForImagePreview] = useState<Game | null>(null)
  const [processingGameId, setProcessingGameId] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null)
  const confirm = useConfirmDialog()

  const table = useAdminTable<GameSortField>({ defaultLimit: 20 })
  const { filters, setFilter, clearAll } = useAdminFilters<{
    systemId: string
    status: Nullable<ApprovalStatus>
  }>(table, {
    systemId: {
      parse: (s) => s || '',
      serialize: (v) => v || '',
      defaultValue: '',
    },
    status: {
      parse: (s) =>
        s === ApprovalStatus.APPROVED ||
        s === ApprovalStatus.PENDING ||
        s === ApprovalStatus.REJECTED
          ? (s as ApprovalStatus)
          : null,
      serialize: (v) => v ?? '',
      defaultValue: null,
    },
  })

  const columnVisibility = useColumnVisibility(GAMES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminGames,
  })

  const { user } = useUser()

  const userQuery = api.users.me.useQuery(undefined, { enabled: !!user })

  const systemsQuery = api.systems.get.useQuery()
  const gamesQuery = api.games.get.useQuery({
    search: isEmpty(table.search) ? null : table.search,
    systemId: isEmpty(filters.systemId) ? null : filters.systemId,
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? null,
    sortDirection: table.sortDirection ?? null,
    status: isNullish(filters.status) ? null : filters.status,
    listingFilter: 'all',
  })

  const gameStatsQuery = api.games.stats.useQuery()

  const deleteGame = api.games.delete.useMutation({
    onSuccess: () => {
      toast.success('Game deleted successfully')
      gamesQuery.refetch().catch((error) => {
        toast.error('Failed to refresh games list')
        logger.error('[AdminGamesPage] Error refreshing games:', error)
      })
    },
    onError: (error) => {
      toast.error(`Failed to delete game: ${getErrorMessage(error)}`)
      logger.error('[AdminGamesPage] Error deleting game:', error)
    },
  })

  const updateGameStatus = api.games.updateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Game ${data.status.toLowerCase()} successfully!`)
      gamesQuery.refetch().catch((error) => {
        logger.error('[AdminGamesPage] Error refreshing games:', error)
      })
      setProcessingGameId(null)
      setProcessingAction(null)
    },
    onError: (error) => {
      toast.error(`Failed to update game status: ${getErrorMessage(error)}`)
      logger.error('[AdminGamesPage] Error updating game status:', error)
      setProcessingGameId(null)
      setProcessingAction(null)
    },
  })

  const handleDelete = async (game: Game) => {
    const confirmed = await confirm({
      title: 'Delete Game',
      description: `Are you sure you want to delete "${game.title}"? This action cannot be undone.`,
    })

    if (!confirmed) return

    deleteGame.mutate({ id: game.id } satisfies RouterInput['games']['delete'])
  }

  const handleSystemChange = (value: string) => setFilter('systemId', value)

  const handleStatusFilterChange = (value: string) =>
    setFilter('status', value === '' ? null : (value as ApprovalStatus))

  const handleImageClick = (game: Game) => {
    setSelectedGameForImagePreview(game)
    setIsImagePreviewOpen(true)
  }

  const handleApproveGame = async (game: Game) => {
    const confirmed = await confirm({
      title: 'Approve Game',
      description: `Are you sure you want to approve "${game.title}"? This will make it visible to all users.`,
      confirmText: 'Approve',
    })

    if (!confirmed) return

    setProcessingGameId(game.id)
    setProcessingAction('approve')
    updateGameStatus.mutate({
      gameId: game.id,
      newStatus: ApprovalStatus.APPROVED,
      overrideNotes: 'Approved by admin from games management page',
    })
  }

  const handleRejectGame = async (game: Game) => {
    const confirmed = await confirm({
      title: 'Reject Game',
      description: `Are you sure you want to reject "${game.title}"? This will hide it from users.`,
      confirmText: 'Reject',
    })

    if (!confirmed) return

    setProcessingGameId(game.id)
    setProcessingAction('reject')
    updateGameStatus.mutate({
      gameId: game.id,
      newStatus: ApprovalStatus.REJECTED,
      overrideNotes: 'Rejected by admin from games management page',
    })
  }

  // Prepare options for SelectInput components
  const systemOptions = [
    { id: '', name: 'All Systems' },
    ...(systemsQuery.data?.map((system) => ({
      id: system.id,
      name: system.name,
    })) ?? []),
  ]

  const statusOptions = [
    { id: '', name: 'All Status' },
    { id: ApprovalStatus.APPROVED, name: 'Approved' },
    { id: ApprovalStatus.PENDING, name: 'Pending' },
    { id: ApprovalStatus.REJECTED, name: 'Rejected' },
  ]

  return (
    <AdminPageLayout
      title="Games Management"
      description="Manage all games in the system"
      headerActions={
        <>
          <ColumnVisibilityControl columns={GAMES_COLUMNS} columnVisibility={columnVisibility} />
          <Button asChild variant="default">
            <Link href="/admin/games/approvals">Game Approvals</Link>
          </Button>
          <Button asChild variant="primary">
            <Link href="/games/new">Add Game</Link>
          </Button>
        </>
      }
    >
      <AdminStatsDisplay
        stats={[
          {
            label: 'Total Games',
            value: gameStatsQuery.data?.total,
            color: 'blue',
          },
          {
            label: 'Used in Reports',
            value: gameStatsQuery.data?.approved,
            color: 'green',
          },
          {
            label: 'Rejected',
            value: gameStatsQuery.data?.rejected,
            color: 'red',
          },
        ]}
        isLoading={gameStatsQuery.isPending}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search games by title..."
              value={table.search}
              onChange={table.handleSearchChange}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <SelectInput
              label="System Filter"
              hideLabel={true}
              value={filters.systemId}
              onChange={(ev) => handleSystemChange(ev.target.value)}
              options={systemOptions}
            />
            <SelectInput
              label="Status Filter"
              hideLabel={true}
              value={filters.status ?? ''}
              onChange={(ev) => handleStatusFilterChange(ev.target.value)}
              options={statusOptions}
            />
            <Button
              variant="outline"
              className="h-full"
              onClick={() => {
                table.setSearch('')
                clearAll()
                table.setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <AdminTableContainer>
        {gamesQuery.isPending ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner text="Loading games..." />
          </div>
        ) : gamesQuery.data?.games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || filters.systemId || filters.status
                ? 'No games found matching your criteria.'
                : 'No games found.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {columnVisibility.isColumnVisible('game') && (
                      <SortableHeader
                        label="Game Title"
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
                    {columnVisibility.isColumnVisible('listings') && (
                      <SortableHeader
                        label="Reports"
                        field="listingsCount"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <SortableHeader
                        label="Status"
                        field="status"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('erotic') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        18+
                      </th>
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
                    {columnVisibility.isColumnVisible('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {gamesQuery.data?.games.map((game) => (
                    <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16 flex justify-center items-center relative">
                              <button
                                type="button"
                                onClick={() => handleImageClick(game)}
                                className="group relative block"
                              >
                                <Image
                                  src={getGameImageUrl(game)}
                                  alt={game.title}
                                  width={64}
                                  height={64}
                                  className="rounded-md object-cover max-h-16 cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ width: 'auto', height: 'auto' }}
                                  unoptimized
                                />
                                {/* Image indicators */}
                                <div className="absolute -bottom-1 -right-1">
                                  <ImageIndicators game={game} />
                                </div>
                              </button>
                            </div>
                            <div className="ml-4">
                              {game.title.length > 30 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {game.title.substring(0, 30)}...
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">{game.title}</TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {game.title}
                                </div>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {game.id.substring(0, 8)}
                                    {game.id.length > 8 && '...'}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">ID: {game.id}</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('system') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <Badge variant="default">{game.system?.name || game.systemId}</Badge>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('listings') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <Badge>{game._count?.listings || 0} reports</Badge>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('status') && (
                        <td className="px-6 py-4">
                          <ApprovalStatusBadge status={game.status} />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('erotic') && (
                        <td className="px-6 py-4 text-sm">
                          {game.isErotic ? (
                            <Badge variant="danger" size="sm">
                              18+
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submitter') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {'submitter' in game && game.submitter?.name
                            ? game.submitter.name
                            : 'System'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submittedAt') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {game.submittedAt ? (
                            <LocalizedDate date={game.submittedAt} format="date" />
                          ) : (
                            'N/A'
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ViewButton href={`/games/${game.id}`} title="View Game" />
                            {hasPermission(userQuery.data?.permissions, PERMISSIONS.EDIT_GAMES) && (
                              <EditButton href={`/admin/games/${game.id}`} title="Edit Game" />
                            )}
                            {hasPermission(
                              userQuery.data?.permissions,
                              PERMISSIONS.APPROVE_GAMES,
                            ) &&
                              game.status === ApprovalStatus.REJECTED && (
                                <ApproveButton
                                  onClick={() => handleApproveGame(game)}
                                  title="Approve Game"
                                  isLoading={
                                    processingGameId === game.id && processingAction === 'approve'
                                  }
                                  disabled={processingGameId === game.id}
                                />
                              )}
                            {hasPermission(
                              userQuery.data?.permissions,
                              PERMISSIONS.APPROVE_GAMES,
                            ) &&
                              game.status === ApprovalStatus.APPROVED && (
                                <RejectButton
                                  onClick={() => handleRejectGame(game)}
                                  title="Reject Game"
                                  isLoading={
                                    processingGameId === game.id && processingAction === 'reject'
                                  }
                                  disabled={processingGameId === game.id}
                                />
                              )}
                            {hasPermission(
                              userQuery.data?.permissions,
                              PERMISSIONS.DELETE_GAMES,
                            ) && (
                              <DeleteButton
                                onClick={() => handleDelete(game)}
                                title="Delete Game"
                                isLoading={deleteGame.isPending}
                                disabled={deleteGame.isPending}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {gamesQuery.data?.pagination && gamesQuery.data.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  page={table.page}
                  totalPages={gamesQuery.data.pagination.pages}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </AdminTableContainer>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
        game={selectedGameForImagePreview}
      />
    </AdminPageLayout>
  )
}

export default AdminGamesPage
