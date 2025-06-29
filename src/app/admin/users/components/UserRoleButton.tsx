'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Role } from '@orm'

interface Props {
  role: Role
  currentRole: string
  onClick: () => void
}

const roleColorMap: Record<Role, string> = {
  [Role.ADMIN]: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  [Role.AUTHOR]:
    'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  [Role.USER]: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  [Role.SUPER_ADMIN]:
    'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  [Role.MODERATOR]:
    'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  [Role.DEVELOPER]:
    'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
}

function UserRoleButton(props: Props) {
  const isActive = useMemo(
    () => props.role === props.currentRole,
    [props.currentRole, props.role],
  )

  const colorClassNames = useMemo(
    () =>
      isActive
        ? roleColorMap[props.role] || roleColorMap[Role.USER]
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    [isActive, props.role],
  )

  return (
    <button
      type="button"
      className={cn(
        'py-2 px-3 rounded-md font-medium text-sm',
        colorClassNames,
        isActive
          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
          : '',
      )}
      onClick={props.onClick}
    >
      {props.role}
    </button>
  )
}

export default UserRoleButton
