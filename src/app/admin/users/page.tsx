'use client'

import { ShieldUser, User } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { useAdminTable } from '@/app/admin/hooks'
import {
  AdminPageLayout,
  AdminStatsDisplay,
  AdminSearchFilters,
  AdminTableContainer,
} from '@/components/admin'
import {
  Badge,
  ColumnVisibilityControl,
  DeleteButton,
  LoadingSpinner,
  Pagination,
  SortableHeader,
  TableButton,
  ViewButton,
  useConfirmDialog,
} from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility, type ColumnDefinition } from '@/hooks'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { getRoleVariant } from '@/utils/badgeColors'
import getErrorMessage from '@/utils/getErrorMessage'
import { type Role } from '@orm'
import UserDetailsModal from './components/UserDetailsModal'
import UserRoleModal from './components/UserRoleModal'

type AdminUser = RouterOutput['users']['getAll']['users'][number]
type UserSortField =
  | 'name'
  | 'email'
  | 'role'
  | 'createdAt'
  | 'listingsCount'
  | 'votesCount'
  | 'commentsCount'
  | 'trustScore'

interface UserForModal {
  id: string
  name: string | null
  email: string
  role: Role
}

const USERS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'role', label: 'Role', defaultVisible: true },
  { key: 'trustScore', label: 'Trust Score', defaultVisible: true },
  { key: 'createdAt', label: 'Joined', defaultVisible: true },
  { key: 'listingsCount', label: 'Listings', defaultVisible: false },
  { key: 'votesCount', label: 'Votes', defaultVisible: false },
  { key: 'commentsCount', label: 'Comments', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminUsersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const table = useAdminTable<UserSortField>()
  const columnVisibility = useColumnVisibility(USERS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminUsers,
  })

  // Modal state from URL
  const userIdFromUrl = searchParams.get('userId')
  const [selectedUserForRole, setSelectedUserForRole] =
    useState<UserForModal | null>(null)

  const usersQuery = api.users.getAll.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const usersStatsQuery = api.users.getStats.useQuery()

  const users = usersQuery.data?.users ?? []
  const pagination = usersQuery.data?.pagination
  const deleteUser = api.users.delete.useMutation()
  const confirm = useConfirmDialog()

  const handleDelete = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Delete User',
      description:
        'Are you sure you want to delete this user? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteUser.mutateAsync({
        userId,
      } satisfies RouterInput['users']['delete'])
      toast.success('User deleted successfully')
      usersQuery.refetch().catch(console.error)
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast.error(`Failed to delete user: ${getErrorMessage(err)}`)
    }
  }

  const openRoleModal = (user: AdminUser) => {
    setSelectedUserForRole({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  }

  const openUserDetailsModal = (userId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('userId', userId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const closeUserDetailsModal = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('userId')
    const newUrl = params.toString() ? `?${params.toString()}` : '/admin/users'
    router.push(newUrl, { scroll: false })
  }

  const statsData = usersStatsQuery.data
    ? [
        {
          label: 'Total Users',
          value: usersStatsQuery.data.total,
          color: 'blue' as const,
        },
        {
          label: 'Users',
          value: usersStatsQuery.data.byRole.user,
          color: 'green' as const,
        },
        {
          label: 'Authors',
          value: usersStatsQuery.data.byRole.author,
          color: 'gray' as const,
        },
        {
          label: 'Developers',
          value: usersStatsQuery.data.byRole.developer,
          color: 'purple' as const,
        },
        {
          label: 'Moderators',
          value: usersStatsQuery.data.byRole.moderator,
          color: 'yellow' as const,
        },
        {
          label: 'Admins',
          value:
            usersStatsQuery.data.byRole.admin +
            usersStatsQuery.data.byRole.superAdmin,
          color: 'red' as const,
        },
      ]
    : []

  return (
    <AdminPageLayout
      title="Users Management"
      description="Manage user accounts and roles"
      headerActions={
        <ColumnVisibilityControl
          columns={USERS_COLUMNS}
          columnVisibility={columnVisibility}
        />
      }
    >
      <AdminStatsDisplay
        stats={statsData}
        isLoading={usersStatsQuery.isLoading}
      />

      <AdminSearchFilters
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Search users by name or email..."
        onClear={table.search ? () => table.setSearch('') : undefined}
      />

      <AdminTableContainer>
        {usersQuery.isLoading ? (
          <LoadingSpinner />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {columnVisibility.isColumnVisible('name') && (
                  <SortableHeader
                    label="Name"
                    field="name"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('email') && (
                  <SortableHeader
                    label="Email"
                    field="email"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('role') && (
                  <SortableHeader
                    label="Role"
                    field="role"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('trustScore') && (
                  <SortableHeader
                    label="Trust Score"
                    field="trustScore"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('createdAt') && (
                  <SortableHeader
                    label="Joined"
                    field="createdAt"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('listingsCount') && (
                  <SortableHeader
                    label="Listings"
                    field="listingsCount"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('votesCount') && (
                  <SortableHeader
                    label="Votes"
                    field="votesCount"
                    currentSortField={table.sortField}
                    currentSortDirection={table.sortDirection}
                    onSort={table.handleSort}
                  />
                )}
                {columnVisibility.isColumnVisible('commentsCount') && (
                  <SortableHeader
                    label="Comments"
                    field="commentsCount"
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
              {users?.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columnVisibility.isColumnVisible('name') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => openUserDetailsModal(user.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 font-medium"
                      >
                        {user.name ?? 'N/A'}
                      </button>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('email') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('role') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('trustScore') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.trustScore}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('createdAt') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('listingsCount') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user._count.listings}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('votesCount') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user._count.votes}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('commentsCount') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user._count.comments}
                    </td>
                  )}
                  {columnVisibility.isColumnVisible('actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <TableButton
                        onClick={() => openRoleModal(user)}
                        title="Change Role"
                        icon={ShieldUser}
                        color="yellow"
                      />
                      <ViewButton
                        title="View User Details"
                        onClick={() => openUserDetailsModal(user.id)}
                      />
                      <DeleteButton
                        onClick={() => handleDelete(user.id)}
                        title="Delete User"
                        isLoading={deleteUser.isPending}
                        disabled={deleteUser.isPending}
                      />
                    </td>
                  )}
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <User className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg">
                        {table.search
                          ? 'No users found matching your search.'
                          : 'No users found.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={table.page}
              totalPages={pagination.pages}
              onPageChange={table.setPage}
            />
          </div>
        )}
      </AdminTableContainer>

      {/* Role Modal */}
      {selectedUserForRole && (
        <UserRoleModal
          user={selectedUserForRole}
          isOpen={true}
          onClose={() => setSelectedUserForRole(null)}
        />
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        userId={userIdFromUrl}
        isOpen={!!userIdFromUrl}
        onClose={closeUserDetailsModal}
      />
    </AdminPageLayout>
  )
}

export default AdminUsersPage
