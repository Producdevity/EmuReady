'use client'

import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { Role } from '@orm'
import UserRoleButton from './UserRoleButton'
import { type RouterInput } from '@/types/trpc'
import toast from '@/lib/toast'

interface User {
  id: string
  name?: string | null
  email: string
  role: Role
}

interface Props {
  user: User
  isOpen: boolean
  onClose: () => void
}

function UserRoleModal({ user, isOpen, onClose }: Props) {
  const [role, setRole] = useState<Exclude<Role, 'SUPER_ADMIN'>>(
    user.role === Role.SUPER_ADMIN ? Role.ADMIN : user.role,
  )
  const [isLoading, setIsLoading] = useState(false)

  const updateRoleMutation = api.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success(`Role updated to ${role}`)
      api.useUtils().users.getAll.invalidate().catch(console.error)
      onClose()
    },
    onError: (error) => {
      console.error('Error updating role:', error)
      setIsLoading(false)
      toast.error(`Failed to update role: ${error.message}`)
    },
  })

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    setIsLoading(true)
    updateRoleMutation.mutate({
      userId: user.id,
      role,
    } satisfies RouterInput['users']['updateRole'])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
          Edit User Role
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Update role for user: <strong>{user.name ?? user.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              User Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <UserRoleButton
                role={Role.USER}
                currentRole={role}
                onClick={() => setRole(Role.USER)}
              />
              <UserRoleButton
                role={Role.AUTHOR}
                currentRole={role}
                onClick={() => setRole(Role.AUTHOR)}
              />
              <UserRoleButton
                role={Role.ADMIN}
                currentRole={role}
                onClick={() => setRole(Role.ADMIN)}
              />
            </div>
            {user.role === Role.SUPER_ADMIN && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Note: Super Admin role can only be assigned in the database
                directly
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || role === user.role}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserRoleModal
