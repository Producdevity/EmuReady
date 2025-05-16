'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import type { Role } from '@orm'

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

export default function UserRoleModal({ user, isOpen, onClose }: Props) {
  const [role, setRole] = useState<Exclude<Role, 'SUPER_ADMIN'>>(
    user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role,
  )
  const [isLoading, setIsLoading] = useState(false)

  const updateRoleMutation = api.users.updateRole.useMutation({
    onSuccess: () => {
      // Refresh users list
      api.useUtils().users.getAll.invalidate()
      onClose()
    },
    onError: (error) => {
      console.error('Error updating role:', error)
      setIsLoading(false)
      alert(`Error: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    updateRoleMutation.mutate({
      userId: user.id,
      role,
    })
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
              <RoleButton
                role="USER"
                currentRole={role}
                onClick={() => setRole('USER')}
              />
              <RoleButton
                role="AUTHOR"
                currentRole={role}
                onClick={() => setRole('AUTHOR')}
              />
              <RoleButton
                role="ADMIN"
                currentRole={role}
                onClick={() => setRole('ADMIN')}
              />
            </div>
            {user.role === 'SUPER_ADMIN' && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Note: Super Admin role can only be assigned in the database directly
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

interface RoleButtonProps {
  role: Exclude<Role, 'SUPER_ADMIN'>
  currentRole: string
  onClick: () => void
}

function RoleButton({ role, currentRole, onClick }: RoleButtonProps) {
  const isActive = role === currentRole
  const getColorClasses = () => {
    if (!isActive) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case 'AUTHOR':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  return (
    <button
      type="button"
      className={`py-2 px-3 rounded-md font-medium text-sm ${getColorClasses()} ${
        isActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''
      }`}
      onClick={onClick}
    >
      {role}
    </button>
  )
} 