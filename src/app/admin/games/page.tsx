'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { isEmpty, isNullish } from 'remeda'
import { api } from '@/lib/api'
import storageKeys from '@/data/storageKeys'
import {
  Button,
  Input,
  LoadingSpinner,
  Badge,
  SortableHeader,
  Pagination,
  AdminTableContainer,
  ApprovalStatusBadge,
  useConfirmDialog,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import useAdminTable from '@/hooks/useAdminTable'
import { formatDate } from '@/utils/date'
import { ApprovalStatus } from '@orm'
import { type Nullable } from '@/types/utils'

type Game = RouterOutput['games']['get']['games'][number]
type GameSortField =
  | 'title'
  | 'system.name'
  | 'listingsCount'
  | 'submittedAt'
  | 'status'

const GAMES_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'listings', label: 'Listings', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'submitter', label: 'Submitter', defaultVisible: false },
  { key: 'submittedAt', label: 'Submitted', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminGamesPage() {
  const [systemId, setSystemId] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<Nullable<ApprovalStatus>>(null)
  const confirm = useConfirmDialog()

  const table = useAdminTable<GameSortField>({ defaultLimit: 20 })

  const columnVisibility = useColumnVisibility(GAMES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminGames,
  })

  const systemsQuery = api.systems.get.useQuery()
  const gamesQuery = api.games.get.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    systemId: isEmpty(systemId) ? undefined : systemId,
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    status: isNullish(statusFilter) ? undefined : statusFilter,
  })

  const gameStatsQuery = api.games.getStats.useQuery()

  const deleteGame = api.games.delete.useMutation({
    onSuccess: () => {
      toast.success('Game deleted successfully')
      gamesQuery.refetch().catch(console.error)
    },
    onError: (error) => {
      toast.error(`Failed to delete game: ${getErrorMessage(error)}`)
      console.error('Error deleting game:', error)
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

  const handleSystemChange = (value: string) => {
    setSystemId(value === '' ? '' : value)
    table.setPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    if (
      value === '' ||
      value === ApprovalStatus.PENDING ||
      value === ApprovalStatus.APPROVED ||
      value === ApprovalStatus.REJECTED
    ) {
      setStatusFilter(value === '' ? null : value)
    }
    table.setPage(1)
  }

  if (gamesQuery.isLoading) return <LoadingSpinner />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Games Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all games in the system
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button asChild variant="primary">
            <Link href="/games/new">Add Game</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/games/approvals">Game Approvals</Link>
          </Button>
        </div>
      </div>

      {gameStatsQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {gameStatsQuery.data.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Games
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {gameStatsQuery.data.approved}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Approved
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {gameStatsQuery.data.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pending
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {gameStatsQuery.data.rejected}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Rejected
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search games by title..."
              value={table.search}
              onChange={(ev) => table.setSearch(ev.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={systemId}
              onChange={(ev) => handleSystemChange(ev.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Systems</option>
              {systemsQuery.data?.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter ?? ''}
              onChange={(ev) => handleStatusFilterChange(ev.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value={ApprovalStatus.APPROVED}>Approved</option>
              <option value={ApprovalStatus.PENDING}>Pending</option>
              <option value={ApprovalStatus.REJECTED}>Rejected</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                table.setSearch('')
                setSystemId('')
                setStatusFilter(null)
                table.setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <AdminTableContainer>
        {gamesQuery.data?.games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || systemId || statusFilter
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
                        label="Listings"
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
                    <tr
                      key={game.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16 flex justify-center items-center">
                              {game.imageUrl ? (
                                <Image
                                  src={game.imageUrl}
                                  alt={game.title}
                                  width={64}
                                  height={64}
                                  className="rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    No img
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              {game.title.length > 30 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {game.title.substring(0, 30)}...
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {game.title}
                                  </TooltipContent>
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
                          <Badge variant="default">{game.system.name}</Badge>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('listings') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {game._count.listings} listings
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('status') && (
                        <td className="px-6 py-4">
                          <ApprovalStatusBadge
                            status={game.status}
                            type="game"
                          />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submitter') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {game.submitter?.name ?? 'System'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('submittedAt') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {game.submittedAt
                            ? formatDate(game.submittedAt)
                            : 'N/A'}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/games/${game.id}`}>Edit</Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(game)}
                              disabled={deleteGame.isPending}
                              isLoading={deleteGame.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {gamesQuery.data?.pagination &&
              gamesQuery.data.pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    currentPage={table.page}
                    totalPages={gamesQuery.data.pagination.pages}
                    onPageChange={table.setPage}
                  />
                </div>
              )}
          </>
        )}
      </AdminTableContainer>
    </div>
  )
}

export default AdminGamesPage
