'use client'

import { Search, ShieldUser, User } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import { AdminTableContainer } from '@/components/admin'
import {
  Button,
  Input,
  SortableHeader,
  Badge,
  ColumnVisibilityControl,
  LoadingSpinner,
  Pagination,
  useConfirmDialog,
} from '@/components/ui'
import {
  DeleteButton,
  TableButton,
  ViewButton,
} from '@/components/ui/table-buttons'
import storageKeys from '@/data/storageKeys'
import useAdminTable from '@/hooks/useAdminTable'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
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

  const {
    data: usersData,
    isLoading,
    refetch,
  } = api.users.getAll.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
    page: table.page,
    limit: table.limit,
  })

  const { data: userStats } = api.users.getStats.useQuery()

  const users = usersData?.users ?? []
  const pagination = usersData?.pagination
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
      refetch().catch(console.error)
    } catch (err) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ColumnVisibilityControl
            columns={USERS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          {userStats && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userStats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {userStats.byRole.admin + userStats.byRole.superAdmin}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Admins
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {userStats.byRole.author}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Authors
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
                placeholder="Search users by name or email..."
                value={table.search}
                onChange={table.handleSearchChange}
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

      <AdminTableContainer>
        {isLoading ? (
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
    </div>
  )
}

export default AdminUsersPage
