'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { isEmpty } from 'remeda'
import {
  Button,
  Input,
  SortableHeader,
  Badge,
  ColumnVisibilityControl,
} from '@/components/ui'
import getRoleBadgeColor from './utils/getRoleBadgeColor'
import UserRoleModal from './components/UserRoleModal'
import { useConfirmDialog } from '@/components/ui'
import useAdminTable from '@/hooks/useAdminTable'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { type Role } from '@orm'
import toast from '@/lib/toast'
import storageKeys from '@/data/storageKeys'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import getErrorMessage from '@/utils/getErrorMessage'

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
  const table = useAdminTable<UserSortField>()
  const columnVisibility = useColumnVisibility(USERS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminUsers,
  })

  const { data: users, refetch } = api.users.getAll.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
  const deleteUser = api.users.delete.useMutation()
  const confirm = useConfirmDialog()

  const [selectedUser, setSelectedUser] = useState<UserForModal | null>(null)

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
      refetch()
    } catch (err) {
      toast.error(`Failed to delete user: ${getErrorMessage(err)}`)
    }
  }

  const openRoleModal = (user: User) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  }

  const closeRoleModal = () => {
    setSelectedUser(null)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Users Management
        </h1>
        <ColumnVisibilityControl
          columns={USERS_COLUMNS}
          columnVisibility={columnVisibility}
        />
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search users..."
            value={table.search}
            onChange={table.handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.name ?? 'N/A'}
                  </td>
                )}
                {columnVisibility.isColumnVisible('email') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                )}
                {columnVisibility.isColumnVisible('role') && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getRoleBadgeColor(user.role)}>
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
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleModal(user)}
                    >
                      Change Role
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UserRoleModal
          user={selectedUser}
          isOpen={true}
          onClose={closeRoleModal}
        />
      )}
    </div>
  )
}

export default AdminUsersPage
