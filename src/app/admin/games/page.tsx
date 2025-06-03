'use client'

import { CpuChipIcon } from '@heroicons/react/24/outline'
import { useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'
import storageKeys from '@/data/storageKeys'
import {
  Button,
  Input,
  LoadingSpinner,
  Badge,
  SelectInput,
  SortableHeader,
  Pagination,
  ColumnVisibilityControl,
  AdminTableContainer,
} from '@/components/ui'
import { Pencil, Eye, Trash2, Plus, Search } from 'lucide-react'
import { useConfirmDialog } from '@/components/ui'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { isEmpty } from 'remeda'
import useAdminTable from '@/hooks/useAdminTable'

type Game = RouterOutput['games']['get']['games'][number]
type GameSortField = 'title' | 'system.name' | 'listingsCount'

const GAMES_COLUMNS: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'listings', label: 'Listings', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminGamesPage() {
  const [systemId, setSystemId] = useState('')
  const confirm = useConfirmDialog()

  const table = useAdminTable<GameSortField>({
    defaultLimit: 20,
  })

  const columnVisibility = useColumnVisibility(GAMES_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminGames,
  })

  const { data: systems } = api.systems.get.useQuery()
  const { data, isLoading, refetch } = api.games.get.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    systemId: isEmpty(systemId) ? undefined : systemId,
    page: table.page,
    limit: table.limit,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })

  const deleteGame = api.games.delete.useMutation({
    onSuccess: () => {
      toast.success('Game deleted successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to delete game: ${error.message}`)
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

  const handleSystemChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setSystemId(ev.target.value)
    table.setPage(1)
  }

  const games = data?.games ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Games Management
        </h1>
        <div className="flex items-center gap-3">
          <ColumnVisibilityControl
            columns={GAMES_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button asChild>
            <Link href="/games/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Game
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search games..."
              value={table.search}
              onChange={table.handleSearchChange}
              className="pl-10"
            />
          </div>
          <SelectInput
            label="System"
            leftIcon={<CpuChipIcon className="w-5 h-5" />}
            options={[{ id: '', name: 'All Systems' }, ...(systems ?? [])]}
            value={systemId}
            onChange={handleSystemChange}
            hideLabel
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Loading games..." />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No games found matching your criteria.
            </p>
          </div>
        ) : (
          <>
            <AdminTableContainer>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {columnVisibility.isColumnVisible('game') && (
                      <SortableHeader
                        label="Game"
                        field="title"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('system') && (
                      <SortableHeader
                        label="System"
                        field="system.name"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('listings') && (
                      <SortableHeader
                        label="Listings"
                        field="listingsCount"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                      />
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {games.map((game) => (
                    <tr
                      key={game.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {columnVisibility.isColumnVisible('game') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {game.imageUrl ? (
                                <Image
                                  src={game.imageUrl}
                                  alt={game.title}
                                  width={48}
                                  height={48}
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
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {game.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {game.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('system') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default">{game.system.name}</Badge>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('listings') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {game._count.listings} listings
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/games/${game.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/games/${game.id}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(game)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableContainer>

            {pagination && pagination.pages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={table.page}
                  totalPages={pagination.pages}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminGamesPage
