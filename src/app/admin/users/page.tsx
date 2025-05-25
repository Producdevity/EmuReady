'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { Badge, Button, LoadingSpinner } from '@/components/ui'
import {
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import UserRoleModal from './components/UserRoleModal'
import { Role } from '@orm'
import { formatDate } from '@/utils/date'
import { hasPermission } from '@/utils/permissions'
import getRoleBadgeColor from './utils/getRoleBadgeColor'

interface UserForModal {
  id: string
  name: string | null
  email: string
  role: Role
}

function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userToEdit, setUserToEdit] = useState<UserForModal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (status === 'loading') return <LoadingSpinner text="Loading..." />

  if (!session || !hasPermission(session.user.role, Role.SUPER_ADMIN)) {
    router.push('/admin')
    return null
  }

  const { data: users, isLoading } = api.users.getAll.useQuery()

  const deleteUserMutation = api.users.delete.useMutation({
    onSuccess: () => {
      // TODO: Show success toast
      // TODO: Show error toast if delete fails
      // TODO: handle error
      api.useUtils().users.getAll.invalidate().catch(console.error)
    },
  })

  const handleDeleteUser = (user: UserForModal) => {
    const userName = user.name ?? 'this user'

    // TODO: Show nice confirmation modal
    if (!window.confirm(`Are you sure you want to delete user ${userName}?`)) {
      return
    }
    deleteUserMutation.mutate({ userId: user.id })
  }

  const openRoleModal = (user: UserForModal) => {
    setUserToEdit(user)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Users Management
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner text="Loading users..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Activity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users?.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {/* User image is not available from the API for now, so just show the placeholder */}
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name ?? 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={getRoleBadgeColor(user.role)}
                        className="inline-flex items-center gap-1"
                      >
                        <ShieldCheckIcon className="h-3 w-3" />
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex gap-2">
                        <span title="Listings">
                          {user._count.listings}{' '}
                          <span className="text-gray-500 dark:text-gray-400">
                            listings
                          </span>
                        </span>
                        <span className="text-gray-400">•</span>
                        <span title="Comments">
                          {user._count.comments}{' '}
                          <span className="text-gray-500 dark:text-gray-400">
                            comments
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user.id === session.user.id ? (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          (Current user)
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleModal(user)}
                            className="inline-flex items-center gap-1"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                            Edit Role
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center gap-1"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {userToEdit && (
        <UserRoleModal
          user={userToEdit}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setUserToEdit(null)
          }}
        />
      )}
    </div>
  )
}

export default AdminUsersPage
