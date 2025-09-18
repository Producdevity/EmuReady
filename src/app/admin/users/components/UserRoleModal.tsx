'use client'

import { ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import UserRoleButton from './UserRoleButton'

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

function UserRoleModal(props: Props) {
  // Get current user to check if they're SUPER_ADMIN
  const userQuery = api.users.me.useQuery()
  const utils = api.useUtils()

  const isSuperAdmin = hasRolePermission(userQuery.data?.role, Role.SUPER_ADMIN)

  const [role, setRole] = useState<Role>(
    props.user.role === Role.SUPER_ADMIN && !isSuperAdmin ? Role.ADMIN : props.user.role,
  )
  const [isLoading, setIsLoading] = useState(false)

  const updateRoleMutation = api.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success(`Role updated to ${role}`)
      // Refetch both the users list and current user data
      utils.users.get.invalidate().catch(console.error)
      utils.users.me.invalidate().catch(console.error)
      props.onClose()
    },
    onError: (error) => {
      console.error('Error updating role:', error)
      setIsLoading(false)
      toast.error(`Failed to update role: ${getErrorMessage(error)}`)
    },
  })

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    setIsLoading(true)
    updateRoleMutation.mutate({
      userId: props.user.id,
      role,
    } satisfies RouterInput['users']['updateRole'])
  }

  if (!props.isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-500" />
          Edit User Role
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Update role for user: <strong>{props.user.name ?? props.user.email}</strong>
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
                role={Role.MODERATOR}
                currentRole={role}
                onClick={() => setRole(Role.MODERATOR)}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <UserRoleButton
                role={Role.DEVELOPER}
                currentRole={role}
                onClick={() => setRole(Role.DEVELOPER)}
              />
              <UserRoleButton
                role={Role.ADMIN}
                currentRole={role}
                onClick={() => setRole(Role.ADMIN)}
              />
              {isSuperAdmin && (
                <UserRoleButton
                  role={Role.SUPER_ADMIN}
                  currentRole={role}
                  onClick={() => setRole(Role.SUPER_ADMIN)}
                />
              )}
            </div>

            {role === Role.DEVELOPER && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Note: Remember to verify this user for specific emulators after assigning the
                Developer role.
              </p>
            )}

            {!isSuperAdmin && props.user.role === Role.SUPER_ADMIN && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Note: Only Super Admins can modify Super Admin roles
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={props.onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                role === props.user.role ||
                (!isSuperAdmin && props.user.role === Role.SUPER_ADMIN)
              }
            >
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserRoleModal
