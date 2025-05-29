'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { isEmpty } from 'remeda'
import { Button, Input, SortableHeader } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import getRoleBadgeColor from './utils/getRoleBadgeColor'
import UserRoleModal from './components/UserRoleModal'
import { useConfirmDialog } from '@/components/ui'
import useAdminTable from '@/hooks/useAdminTable'
import getErrorMessage from '@/utils/getErrorMessage'
import { type RouterOutput } from '@/types/trpc'
import { type Role } from '@orm'
import toast from '@/lib/toast'

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

function AdminUsersPage() {
  const table = useAdminTable<UserSortField>()
  const [userToEdit, setUserToEdit] = useState<UserForModal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: users, refetch } = api.users.getAll.useQuery({
    search: isEmpty(table.search) ? undefined : table.search,
    sortField: table.sortField ?? undefined,
    sortDirection: table.sortDirection ?? undefined,
  })
  const deleteUser = api.users.delete.useMutation()
  const confirm = useConfirmDialog()

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Delete User',
      description:
        'Are you sure you want to delete this user? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteUser.mutateAsync({ userId })
      refetch()
    } catch (err) {
      toast.error(`Failed to delete user: ${getErrorMessage(err)}`)
    }
  }

  const openRoleModal = (user: User) => {
    setUserToEdit({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    setIsModalOpen(true)
  }

  const closeRoleModal = () => {
    setIsModalOpen(false)
    setUserToEdit(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      <div className="mb-4">
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

      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
          <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <tr>
              <SortableHeader
                label="Name"
                field="name"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Email"
                field="email"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Role"
                field="role"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Listings"
                field="listingsCount"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Votes"
                field="votesCount"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Comments"
                field="commentsCount"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <SortableHeader
                label="Joined"
                field="createdAt"
                currentSortField={table.sortField}
                currentSortDirection={table.sortDirection}
                onSort={table.handleSort}
              />
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users?.map((user: User) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-2 font-medium">{user.name}</td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      user.role,
                    )}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {user._count.listings}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {user._count.votes}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {user._count.comments}
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {formatDateTime(user.createdAt)}
                </td>
                <td className="px-4 py-2 flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openRoleModal(user)}
                  >
                    Edit Role
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userToEdit && (
        <UserRoleModal
          user={userToEdit}
          isOpen={isModalOpen}
          onClose={() => {
            closeRoleModal()
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default AdminUsersPage
