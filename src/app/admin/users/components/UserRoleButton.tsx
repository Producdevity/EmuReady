'use client'

import { useMemo } from 'react'
import { Role } from '@orm'

interface Props {
  role: Exclude<Role, 'SUPER_ADMIN'>
  currentRole: string
  onClick: () => void
}

const roleColorMap: Record<Exclude<Role, 'SUPER_ADMIN'>, string> = {
  [Role.ADMIN]: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  [Role.AUTHOR]:
    'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  [Role.USER]: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
}

function UserRoleButton(props: Props) {
  const isActive = useMemo(
    () => props.role === props.currentRole,
    [props.currentRole, props.role],
  )

  const colorClassNames = useMemo(() => {
    if (!isActive)
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'

    return roleColorMap[props.role] || roleColorMap[Role.USER]
  }, [isActive, props.role])

  return (
    <button
      type="button"
      className={`py-2 px-3 rounded-md font-medium text-sm ${colorClassNames} ${
        isActive
          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
          : ''
      }`}
      onClick={props.onClick}
    >
      {props.role}
    </button>
  )
}

export default UserRoleButton
