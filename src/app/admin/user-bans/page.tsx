'use client'

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
} from '@/components/admin'
import {
  Button,
  ColumnVisibilityControl,
  DeleteButton,
  LoadingSpinner,
  SortableHeader,
  useConfirmDialog,
  Badge,
  Pagination,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import BanDetailsModal from './components/BanDetailsModal'
import CreateBanModal from './components/CreateBanModal'
import { type BanModalState, type CreateBanModalState } from './types'

type BanSortField = 'bannedAt' | 'expiresAt' | 'isActive' | 'reason'

const BAN_COLUMNS: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false },
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'reason', label: 'Reason', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'bannedBy', label: 'Banned By', defaultVisible: true },
  { key: 'bannedAt', label: 'Banned At', defaultVisible: true },
  { key: 'expiresAt', label: 'Expires At', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true },
]

const getBanStatusBadgeVariant = (ban: {
  isActive: boolean
  expiresAt: Date | null
}) => {
  if (!ban.isActive) return 'default'
  if (ban.expiresAt && new Date(ban.expiresAt) <= new Date()) return 'warning'
  return 'danger'
}

const getBanStatusText = (ban: {
  isActive: boolean
  expiresAt: Date | null
}) => {
  if (!ban.isActive) return 'Lifted'
  if (ban.expiresAt && new Date(ban.expiresAt) <= new Date()) return 'Expired'
  if (ban.expiresAt) return 'Temporary'
  return 'Permanent'
}

function AdminUserBansPage() {
  const { user: clerkUser } = useUser()
  const table = useAdminTable<BanSortField>({ defaultLimit: 20 })
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const columnVisibility = useColumnVisibility(BAN_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminUserBans,
  })

  const [selectedStatus, setSelectedStatus] = useState<boolean | ''>('')
  const [banDetailsModal, setBanDetailsModal] = useState<BanModalState>({
    isOpen: false,
  })
  const [createBanModal, setCreateBanModal] = useState<CreateBanModalState>({
    isOpen: false,
  })

  // Get current user data to check permissions
  const currentUserQuery = api.users.me.useQuery(undefined, {
    enabled: !!clerkUser,
  })

  const currentUserRole = currentUserQuery.data?.role
  const canCreateBans =
    currentUserRole && hasPermission(currentUserRole, Role.MODERATOR)

  const bansStatsQuery = api.userBans.getStats.useQuery()
  const bansQuery = api.userBans.getAll.useQuery({
    search: table.debouncedSearch || undefined,
    isActive: selectedStatus === '' ? undefined : selectedStatus,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const bans = bansQuery.data?.bans ?? []
  const pagination = bansQuery.data?.pagination

  const deleteBan = api.userBans.delete.useMutation({
    onSuccess: () => {
      toast.success('Ban deleted successfully!')
      utils.userBans.getAll.invalidate().catch(console.error)
      utils.userBans.getStats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to delete ban: ${getErrorMessage(err)}`)
    },
  })

  const liftBan = api.userBans.lift.useMutation({
    onSuccess: () => {
      toast.success('Ban lifted successfully!')
      utils.userBans.getAll.invalidate().catch(console.error)
      utils.userBans.getStats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to lift ban: ${getErrorMessage(err)}`)
    },
  })

  const handleViewDetails = (ban: (typeof bans)[0]) => {
    setBanDetailsModal({ isOpen: true, ban })
  }

  const handleLiftBan = async (ban: (typeof bans)[0]) => {
    if (!ban.isActive) {
      toast.error('Ban is already inactive')
      return
    }

    const confirmed = await confirm({
      title: 'Lift Ban',
      description: `Are you sure you want to lift the ban for ${ban.user.name || ban.user.email}?`,
    })

    if (!confirmed) return

    liftBan.mutate({
      id: ban.id,
      notes: 'Ban lifted via admin panel',
    } satisfies RouterInput['userBans']['lift'])
  }

  const handleDelete = async (ban: (typeof bans)[0]) => {
    const confirmed = await confirm({
      title: 'Delete Ban',
      description: `Are you sure you want to permanently delete this ban record? This action cannot be undone.`,
    })

    if (!confirmed) return

    deleteBan.mutate({
      id: ban.id,
    } satisfies RouterInput['userBans']['delete'])
  }

  const statsData = bansStatsQuery.data
    ? [
        {
          label: 'Total Bans',
          value: bansStatsQuery.data.total,
          color: 'blue' as const,
        },
        {
          label: 'Active',
          value: bansStatsQuery.data.active,
          color: 'red' as const,
        },
        {
          label: 'Expired',
          value: bansStatsQuery.data.expired,
          color: 'yellow' as const,
        },
        {
          label: 'Permanent',
          value: bansStatsQuery.data.permanent,
          color: 'gray' as const,
        },
      ]
    : []

  if (bansQuery.isPending) return <LoadingSpinner />

  return (
    <AdminPageLayout
      title="User Ban Management"
      description="Manage user bans and suspensions"
      headerActions={
        <div className="flex gap-2">
          {canCreateBans && (
            <Button
              onClick={() => setCreateBanModal({ isOpen: true })}
              variant="default"
            >
              New Ban
            </Button>
          )}
          <ColumnVisibilityControl
            columns={BAN_COLUMNS}
            columnVisibility={columnVisibility}
          />
        </div>
      }
    >
      <AdminStatsDisplay
        stats={statsData}
        isLoading={bansStatsQuery.isPending}
      />

      <AdminSearchFilters
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Search bans by user name, email, or reason..."
        onClear={table.search ? () => table.setSearch('') : undefined}
      >
        <div className="flex gap-2">
          <select
            value={selectedStatus === '' ? '' : selectedStatus.toString()}
            onChange={(e) => {
              const value = e.target.value
              setSelectedStatus(value === '' ? '' : value === 'true')
            }}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </AdminSearchFilters>

      <AdminTableContainer>
        {bans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {table.search || selectedStatus !== ''
                ? 'No bans found matching your criteria.'
                : 'No bans found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columnVisibility.isColumnVisible('id') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('user') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('reason') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('status') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('bannedBy') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Banned By
                    </th>
                  )}
                  {columnVisibility.isColumnVisible('bannedAt') && (
                    <SortableHeader
                      label="Banned At"
                      field="bannedAt"
                      currentSortField={table.sortField}
                      currentSortDirection={table.sortDirection}
                      onSort={table.handleSort}
                      className="px-6 py-3 text-left"
                    />
                  )}
                  {columnVisibility.isColumnVisible('expiresAt') && (
                    <SortableHeader
                      label="Expires At"
                      field="expiresAt"
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
                {bans.map((ban) => (
                  <tr
                    key={ban.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {columnVisibility.isColumnVisible('id') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {ban.id.slice(0, 8)}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('user') && (
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {ban.user.name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {ban.user.email}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            Role: {ban.user.role}
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('reason') && (
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-xs truncate" title={ban.reason}>
                          {ban.reason}
                        </div>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('status') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={getBanStatusBadgeVariant(ban)}>
                          {getBanStatusText(ban)}
                        </Badge>
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('bannedBy') && (
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {ban.bannedBy?.name || 'Unknown'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('bannedAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(ban.bannedAt).toLocaleDateString()}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('expiresAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {ban.expiresAt
                          ? new Date(ban.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(ban)}
                          >
                            View
                          </Button>
                          {ban.isActive && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleLiftBan(ban)}
                              disabled={liftBan.isPending}
                            >
                              Lift Ban
                            </Button>
                          )}
                          <DeleteButton
                            onClick={() => handleDelete(ban)}
                            title="Delete Ban Record"
                            isLoading={deleteBan.isPending}
                            disabled={deleteBan.isPending}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={table.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(newPage) => table.setPage(newPage)}
        />
      )}

      {/* Modals */}
      <BanDetailsModal
        isOpen={banDetailsModal.isOpen}
        onClose={() => setBanDetailsModal({ isOpen: false })}
        ban={banDetailsModal.ban}
      />

      <CreateBanModal
        isOpen={createBanModal.isOpen}
        onClose={() => setCreateBanModal({ isOpen: false })}
        userId={createBanModal.userId}
        onSuccess={() => {
          utils.userBans.getAll.invalidate().catch(console.error)
          utils.userBans.getStats.invalidate().catch(console.error)
        }}
      />
    </AdminPageLayout>
  )
}

export default AdminUserBansPage
