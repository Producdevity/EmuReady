'use client'

import { Search, ShieldUser, Trash2, User } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { isEmpty } from 'remeda'
import LoadingIcon from '@/components/icons/LoadingIcon'
import {
  Button,
  Input,
  SortableHeader,
  Badge,
  ColumnVisibilityControl,
  AdminTableContainer,
  LoadingSpinner,
  useConfirmDialog,
} from '@/components/ui'
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

type User = RouterOutput['users']['getAll'][number]
type UserSortField =
  | 'name'
  | 'email'
  | 'role'
  | 'createdAt'
  | 'listingsCount'
  | 'votesCount'
  | 'commentsCount'

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
    data: users,
    isLoading,
    refetch,
  } = api.users.getAll.useQuery({
    search: isEmpty(table.debouncedSearch) ? undefined : table.debouncedSearch,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
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

  const openRoleModal = (user: User) => {
    setSelectedUserForRole({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  }

  const closeRoleModal = () => {
    setSelectedUserForRole(null)
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
        </div>
        <ColumnVisibilityControl
          columns={USERS_COLUMNS}
          columnVisibility={columnVisibility}
        />
      </div>

      <div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          {table.isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingIcon className="text-gray-400 h-4 w-4" />
            </div>
          )}
          <Input
            placeholder="Search users..."
            value={table.search}
            onChange={table.handleSearchChange}
            className="pl-10 pr-10"
          />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        name="View Details"
                        onClick={() => openUserDetailsModal(user.id)}
                      >
                        <User />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        name="Change Role"
                        onClick={() => openRoleModal(user)}
                      >
                        <ShieldUser />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        name="Delete User"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-700/20"
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}

              {users && users.length === 0 && (
                <tr>
                  <td
                    colSpan={columnVisibility.visibleColumns.size}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No users found
                    {table.debouncedSearch
                      ? ` matching "${table.debouncedSearch}"`
                      : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </AdminTableContainer>

      {/* Role Modal */}
      {selectedUserForRole && (
        <UserRoleModal
          user={selectedUserForRole}
          isOpen={true}
          onClose={closeRoleModal}
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
