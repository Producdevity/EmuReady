'use client'

import { Search, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import { AdminPageLayout, AdminTableContainer, AdminStatsDisplay } from '@/components/admin'
import {
  Button,
  Input,
  Badge,
  Pagination,
  SortableHeader,
  ColumnVisibilityControl,
  BulkActions,
  LoadingSpinner,
  ViewButton,
  EditButton,
  DeleteButton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useConfirmDialog,
  LocalizedDate,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import BadgeDetailsModal from './components/BadgeDetailsModal'
import BadgeModal from './components/BadgeModal'

type BadgeSortField = 'name' | 'createdAt' | 'updatedAt'
type BadgeData = RouterOutput['badges']['getAll']['badges'][number]

const BADGE_COLUMNS: ColumnDefinition[] = [
  { key: 'badge', label: 'Badge', defaultVisible: true },
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'assignments', label: 'Assignments', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'creator', label: 'Creator', defaultVisible: true },
  { key: 'createdAt', label: 'Created', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

export default function AdminBadgesPage() {
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const table = useAdminTable<BadgeSortField>({
    defaultLimit: 20,
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })

  const columnVisibility = useColumnVisibility(BADGE_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminBadges,
  })
  const confirm = useConfirmDialog()

  // Fetch badges
  const badgesQuery = api.badges.getAll.useQuery({
    limit: table.limit,
    page: table.page,
    search: table.search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortField: table.sortField || 'createdAt',
    sortDirection: table.sortDirection || 'desc',
  })

  // Fetch stats
  const statsQuery = api.badges.getStats.useQuery()

  // Mutations
  const deleteBadgeMutation = api.badges.delete.useMutation({
    onSuccess: () => {
      toast.success('Badge deleted successfully')
      handleRefresh()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete badge'))
    },
  })

  const handleRefresh = () => {
    badgesQuery.refetch().catch(console.error)
    statsQuery.refetch().catch(console.error)
  }

  const handleEditBadge = (badge: BadgeData) => {
    setEditingBadge(badge)
    setIsEditModalOpen(true)
  }

  const handleViewBadge = (badgeId: string) => {
    setSelectedBadgeId(badgeId)
    setIsDetailsModalOpen(true)
  }

  const handleDeleteBadge = async (badgeId: string) => {
    const confirmed = await confirm({
      title: 'Delete Badge',
      description: 'Are you sure you want to delete this badge? This action cannot be undone.',
      confirmText: 'Delete',
    })

    if (!confirmed) return

    await deleteBadgeMutation.mutateAsync({ id: badgeId })
  }

  const handleBulkDelete = async (badgeIds: string[]) => {
    const confirmed = await confirm({
      title: 'Delete Badges',
      description: `Are you sure you want to delete ${badgeIds.length} badge${
        badgeIds.length === 1 ? '' : 's'
      }? This action cannot be undone.`,
      confirmText: 'Delete All',
    })

    if (!confirmed) return

    // Using Promise.all for better performance when deleting multiple badges
    try {
      await Promise.all(badgeIds.map((badgeId) => deleteBadgeMutation.mutateAsync({ id: badgeId })))
      setSelectedBadgeIds([])
    } catch (error) {
      // Individual errors are handled by the mutation's onError callback
      console.error('Some deletions failed:', error)
    }
  }

  const handleSelectAllBadges = (selected: boolean) => {
    setSelectedBadgeIds(selected ? badges.map((b) => b.id) : [])
  }

  const handleSelectBadge = (badgeId: string, selected: boolean) => {
    setSelectedBadgeIds(
      selected ? (prev) => [...prev, badgeId] : (prev) => prev.filter((id) => id !== badgeId),
    )
  }

  const badges = badgesQuery.data?.badges || []
  const pagination = badgesQuery.data?.pagination
  const stats = statsQuery.data

  return (
    <AdminPageLayout
      title="Badge Management"
      description="Manage user badges and assignments"
      headerActions={
        <>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Badge
          </Button>
          <ColumnVisibilityControl columns={BADGE_COLUMNS} columnVisibility={columnVisibility} />
        </>
      }
    >
      {/* Stats */}
      {stats && (
        <AdminStatsDisplay
          stats={[
            {
              label: 'Total Badges',
              value: stats.total,
              color: 'blue',
            },
            {
              label: 'Active',
              value: stats.active,
              color: 'green',
            },
            {
              label: 'Inactive',
              value: stats.inactive,
              color: 'gray',
            },
            {
              label: 'Total Assignments',
              value: stats.totalAssignments,
              color: 'purple',
            },
          ]}
          isLoading={statsQuery.isPending}
        />
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search badges..."
                value={table.search}
                onChange={table.handleSearchChange}
                className="w-full pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                table.setSearch('')
                setStatusFilter('all')
                table.setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {badges.length > 0 && (
        <BulkActions
          selectedIds={selectedBadgeIds}
          totalCount={badges.length}
          onSelectAll={handleSelectAllBadges}
          onClearSelection={() => setSelectedBadgeIds([])}
          actions={{
            delete: {
              label: 'Delete Selected',
              onAction: handleBulkDelete,
            },
          }}
        />
      )}

      {/* Table */}
      <AdminTableContainer>
        {badgesQuery.isPending ? (
          <LoadingSpinner text="Loading badges..." />
        ) : badges.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search ? 'No badges found matching your search.' : 'No badges created yet.'}
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
                        checked={selectedBadgeIds.length === badges.length && badges.length > 0}
                        onChange={(e) => handleSelectAllBadges(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    {columnVisibility.isColumnVisible('badge') && (
                      <SortableHeader
                        label="Badge"
                        field="name"
                        currentSortField={table.sortField}
                        currentSortDirection={table.sortDirection}
                        onSort={table.handleSort}
                        className="px-6 py-3 text-left"
                      />
                    )}
                    {columnVisibility.isColumnVisible('description') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('assignments') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assignments
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('creator') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Creator
                      </th>
                    )}
                    {columnVisibility.isColumnVisible('createdAt') && (
                      <SortableHeader
                        label="Created"
                        field="createdAt"
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
                  {badges.map((badge) => (
                    <tr key={badge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBadgeIds.includes(badge.id)}
                          onChange={(e) => handleSelectBadge(badge.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      {columnVisibility.isColumnVisible('badge') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: badge.color }}
                            >
                              {badge.icon || badge.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {badge.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {badge.color}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('description') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {badge.description ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="line-clamp-2">
                                  {badge.description.length > 60
                                    ? `${badge.description.substring(0, 60)}...`
                                    : badge.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{badge.description}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-gray-400">No description</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('assignments') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            {badge._count.userBadges}
                          </div>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('status') && (
                        <td className="px-6 py-4">
                          <Badge variant={badge.isActive ? 'success' : 'default'}>
                            {badge.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('creator') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {badge.creator.name || badge.creator.email}
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('createdAt') && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <LocalizedDate date={badge.createdAt} format="date" />
                        </td>
                      )}
                      {columnVisibility.isColumnVisible('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ViewButton
                              onClick={() => handleViewBadge(badge.id)}
                              title="View Badge Details"
                            />
                            <EditButton onClick={() => handleEditBadge(badge)} title="Edit Badge" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DeleteButton
                                  onClick={() => handleDeleteBadge(badge.id)}
                                  disabled={badge._count.userBadges > 0}
                                  title="Delete Badge"
                                />
                              </TooltipTrigger>
                              {badge._count.userBadges > 0 && (
                                <TooltipContent>
                                  Cannot delete badge with active assignments
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  page={table.page}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  itemsPerPage={table.limit}
                  onPageChange={table.setPage}
                />
              </div>
            )}
          </>
        )}
      </AdminTableContainer>

      {/* Modals */}
      <BadgeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <BadgeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingBadge(null)
        }}
        badge={editingBadge || undefined}
        onSuccess={handleRefresh}
      />

      <BadgeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedBadgeId(null)
        }}
        badgeId={selectedBadgeId}
        onEdit={(badge) => {
          setEditingBadge(badge)
          setIsDetailsModalOpen(false)
          setIsEditModalOpen(true)
        }}
        onDelete={() => {
          setIsDetailsModalOpen(false)
          setSelectedBadgeId(null)
          handleRefresh()
        }}
      />
    </AdminPageLayout>
  )
}
