'use client'

import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  LoadingSpinner,
  SortableHeader,
  useConfirmDialog,
  Badge,
  Pagination,
  LocalizedDate,
  Modal,
  Input,
  Code,
} from '@/components/ui'
import { ViewButton, DeleteButton, UndoButton } from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
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

const getBanStatusBadgeVariant = (ban: { isActive: boolean; expiresAt: Date | null }) => {
  if (!ban.isActive) return 'default'
  if (ban.expiresAt && new Date(ban.expiresAt) <= new Date()) return 'warning'
  return 'danger'
}

const getBanStatusText = (ban: { isActive: boolean; expiresAt: Date | null }) => {
  if (!ban.isActive) return 'Lifted'
  if (ban.expiresAt && new Date(ban.expiresAt) <= new Date()) return 'Expired'
  if (ban.expiresAt) return 'Temporary'
  return 'Permanent'
}

function AdminUserBansPage() {
  const { user: clerkUser } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
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
    userId: undefined,
  })

  // Handle query params to auto-open modal
  useEffect(() => {
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    if (action === 'ban' && userId) {
      setCreateBanModal({ isOpen: true, userId })
      // Clean up URL after opening modal
      router.replace('/admin/user-bans')
    }
  }, [searchParams, router])

  // Get current user data to check permissions
  const currentUserQuery = api.users.me.useQuery(undefined, {
    enabled: !!clerkUser,
  })

  const currentUserPermissions = currentUserQuery.data?.permissions
  const currentUserRole = currentUserQuery.data?.role
  const canCreateBans =
    currentUserPermissions && currentUserPermissions.includes(PERMISSIONS.MANAGE_USER_BANS)

  const bansStatsQuery = api.userBans.stats.useQuery()
  const bansQuery = api.userBans.get.useQuery({
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
      toast.success('Ban archived successfully!')
      utils.userBans.get.invalidate().catch(console.error)
      utils.userBans.stats.invalidate().catch(console.error)
    },
    onError: (err) => {
      toast.error(`Failed to archive ban: ${getErrorMessage(err)}`)
    },
  })

  const liftBan = api.userBans.lift.useMutation({
    onSuccess: () => {
      toast.success('Ban lifted successfully!')
      utils.userBans.get.invalidate().catch(console.error)
      utils.userBans.stats.invalidate().catch(console.error)
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

  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean
    ban?: (typeof bans)[0]
    typed: string
  }>({ isOpen: false, ban: undefined, typed: '' })
  const openArchiveModal = (ban: (typeof bans)[0]) =>
    setArchiveModal({ isOpen: true, ban, typed: '' })
  const closeArchiveModal = () => setArchiveModal({ isOpen: false, ban: undefined, typed: '' })
  const confirmArchive = () => {
    if (!archiveModal.ban) return
    deleteBan
      .mutateAsync({ id: archiveModal.ban.id } satisfies RouterInput['userBans']['delete'])
      .then(() => closeArchiveModal())
      .catch((err) => toast.error(`Failed to archive ban: ${getErrorMessage(err)}`))
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
            <Button onClick={() => setCreateBanModal({ isOpen: true })} variant="default">
              New Ban
            </Button>
          )}
          <ColumnVisibilityControl columns={BAN_COLUMNS} columnVisibility={columnVisibility} />
        </div>
      }
    >
      <AdminStatsDisplay stats={statsData} isLoading={bansStatsQuery.isPending} />

      <AdminSearchFilters<BanSortField>
        table={table}
        searchPlaceholder="Search bans by user name, email, or reason..."
      >
        <div className="flex gap-2">
          <select
            value={selectedStatus === '' ? '' : selectedStatus.toString()}
            onChange={(ev) => {
              const value = ev.target.value
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
                        <Code label={ban.id} maxLength={8} />
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
                        <LocalizedDate date={ban.bannedAt} format="date" />
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('expiresAt') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {ban.expiresAt ? (
                          <LocalizedDate date={ban.expiresAt} format="date" />
                        ) : (
                          'Never'
                        )}
                      </td>
                    )}
                    {columnVisibility.isColumnVisible('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ViewButton title="View" onClick={() => handleViewDetails(ban)} />
                          {ban.isActive && (
                            <UndoButton
                              title="Lift Ban"
                              onClick={() => handleLiftBan(ban)}
                              isLoading={liftBan.isPending}
                              disabled={liftBan.isPending}
                            />
                          )}
                          {hasRolePermission(currentUserRole, Role.ADMIN) && (
                            <DeleteButton
                              title="Archive"
                              onClick={() => openArchiveModal(ban)}
                              isLoading={deleteBan.isPending}
                              disabled={deleteBan.isPending}
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
        )}
      </AdminTableContainer>

      {pagination && pagination.pages > 1 && (
        <Pagination
          page={table.page}
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
          utils.userBans.get.invalidate().catch(console.error)
          utils.userBans.stats.invalidate().catch(console.error)
        }}
      />

      <Modal
        isOpen={archiveModal.isOpen}
        onClose={closeArchiveModal}
        title="Archive Ban Record"
        size="sm"
      >
        {archiveModal.ban && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              To archive this ban record, type the user’s{' '}
              {archiveModal.ban.user.email ? 'email' : 'name'} below.
            </p>
            <Input
              value={archiveModal.typed}
              onChange={(e) => setArchiveModal((s) => ({ ...s, typed: e.target.value }))}
              placeholder={archiveModal.ban.user.email || archiveModal.ban.user.name || ''}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeArchiveModal}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmArchive}
                isLoading={deleteBan.isPending}
                disabled={deleteBan.isPending || !matchesConfirm(archiveModal)}
              >
                Archive
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminPageLayout>
  )
}

export default AdminUserBansPage

function matchesConfirm(state: {
  ban?: { user: { email: string | null; name: string | null } }
  typed: string
}) {
  if (!state.ban) return false
  const expected = state.ban.user.email || state.ban.user.name || ''
  if (!expected) return false
  return state.typed.trim().toLowerCase() === expected.trim().toLowerCase()
}
